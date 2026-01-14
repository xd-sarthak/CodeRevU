import { inngest } from "../client";
import { getPullRequestDiff, postReviewComment } from "@/module/github/lib/github";
import { retrieveContext } from "@/module/ai/lib/rag";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import prisma from "@/lib/db";
import { incrementReviewCount } from "@/module/payment/lib/subscription";

export const generateReview = inngest.createFunction(
  { id: "generate-review", concurrency: 5 },
  { event: "pr.review.requested" },

  async ({ event, step }) => {
    const { owner, repo, prNumber, userId, repositoryId } = event.data;
    console.log(`🚀 [generateReview] Starting review for ${owner}/${repo}#${prNumber}`, {
      userId,
      repositoryId,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });

    const { diff, title, description, token } = await step.run("fetch-pr-data", async () => {
      console.log(`📥 [generateReview:fetch-pr-data] Fetching PR data for ${owner}/${repo}#${prNumber}`);

      try {
        const account = await prisma.account.findFirst({
          where: {
            userId: userId,
            providerId: "github"
          }
        });

        if (!account?.accessToken) {
          console.error(`❌ [generateReview:fetch-pr-data] No GitHub token found for user ${userId}`);
          throw new Error("No GitHub access token found");
        }
        console.log(`✅ [generateReview:fetch-pr-data] Found GitHub token for user ${userId}`);

        const data = await getPullRequestDiff(account.accessToken, owner, repo, prNumber);
        console.log(`✅ [generateReview:fetch-pr-data] PR data fetched`, { title: data.title });
        return { ...data, token: account.accessToken };
      } catch (error) {
        console.error(`❌ [generateReview:fetch-pr-data] Failed to fetch PR data`, {
          owner, repo, prNumber, userId,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });


    const context = await step.run("retrieve-context", async () => {
      console.log(`🔍 [generateReview:retrieve-context] Retrieving context for ${owner}/${repo}`);
      try {
        const query = `${title}\n${description}`;
        const result = await retrieveContext(query, `${owner}/${repo}`);
        console.log(`✅ [generateReview:retrieve-context] Retrieved ${result.length} context chunks`);
        return result;
      } catch (error) {
        console.error(`❌ [generateReview:retrieve-context] Failed to retrieve context`, {
          owner, repo, error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });


    const review = await step.run("generate-ai-review", async () => {
      console.log(`🤖 [generateReview:generate-ai-review] Generating AI review for ${owner}/${repo}#${prNumber}`);
      try {
        const prompt = `You are an expert code reviewer. Analyze the following pull request and provide a detailed, constructive code review.

PR Title: ${title}
PR Description: ${description || "No description provided"}

Context from Codebase:
${context.join("\n\n")}

Code Changes:
\`\`\`diff
${diff}
\`\`\`

Please provide:
1. **Walkthrough**: A file-by-file explanation of the changes.
2. **Sequence Diagram**: A Mermaid JS sequence diagram visualizing the flow of the changes (if applicable). Use \`\`\`mermaid ... \`\`\` block. **IMPORTANT**: Ensure the Mermaid syntax is valid. Do not use special characters (like quotes, braces, parentheses) inside Note text or labels as it breaks rendering. Keep the diagram simple.
3. **Summary**: Brief overview.
4. **Strengths**: What's done well.
5. **Issues**: Bugs, security concerns, code smells.
6. **Suggestions**: Specific code improvements.
7. **Rating**: Rate the code quality out of 5 where 5 is highest and 1 is lowest

Format your response in markdown.`;

        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          prompt
        });
        console.log(`✅ [generateReview:generate-ai-review] Review generated (${text.length} chars)`);
        return text;
      } catch (error) {
        console.error(`❌ [generateReview:generate-ai-review] Failed to generate AI review`, {
          owner, repo, prNumber,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });

    await step.run("post-comment", async () => {
      console.log(`💬 [generateReview:post-comment] Posting review to GitHub ${owner}/${repo}#${prNumber}`);
      try {
        await postReviewComment(token, owner, repo, prNumber, review);
        console.log(`✅ [generateReview:post-comment] Review posted successfully`);
      } catch (error) {
        console.error(`❌ [generateReview:post-comment] Failed to post comment`, {
          owner, repo, prNumber,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });


    await step.run("save-review", async () => {
      console.log(`💾 [generateReview:save-review] Saving review to database for ${owner}/${repo}#${prNumber}`);
      try {
        const repository = await prisma.repository.findFirst({
          where: {
            owner,
            name: repo
          }
        });

        if (repository) {
          await prisma.review.create({
            data: {
              repositoryId: repository.id,
              prNumber,
              prTitle: title,
              prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
              review,
              status: "completed",
            },
          });
          console.log(`✅ [generateReview:save-review] Review saved to database`);
        } else {
          console.warn(`⚠️ [generateReview:save-review] Repository not found in database, skipping save`);
        }
      } catch (error) {
        console.error(`❌ [generateReview:save-review] Failed to save review`, {
          owner, repo, prNumber,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });

    // Increment review count ONLY after successful completion
    // Non-blocking: failures here won't cause retries or duplicate comments
    await step.run("increment-review-count", async () => {
      console.log(`📊 [generateReview:increment-review-count] Incrementing review count for user ${userId}`);
      try {
        await incrementReviewCount(userId, repositoryId);
        console.log(`✅ [generateReview:increment-review-count] Review count incremented`);
      } catch (error) {
        // Log error but don't throw - credit tracking failure shouldn't
        // cause the entire review to retry and create duplicate GitHub comments
        console.error(`⚠️ [generateReview:increment-review-count] Failed to increment review count`, {
          userId, repositoryId,
          error: error instanceof Error ? error.message : error
        });
        console.error(`Review was successful but credit tracking failed. Manual adjustment may be needed.`);
        // Don't rethrow - allow the function to complete successfully
      }
    });

    console.log(`🎉 [generateReview] Completed review for ${owner}/${repo}#${prNumber}`);
    return { success: true };
  }
);