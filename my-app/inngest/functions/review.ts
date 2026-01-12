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

    const { diff, title, description, token } = await step.run("fetch-pr-data", async () => {

      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          providerId: "github"
        }
      })

      if (!account?.accessToken) {
        throw new Error("No GitHub access token found");
      }

      const data = await getPullRequestDiff(account.accessToken, owner, repo, prNumber);
      return { ...data, token: account.accessToken }
    });


    const context = await step.run("retrieve-context", async () => {
      const query = `${title}\n${description}`;

      return await retrieveContext(query, `${owner}/${repo}`)
    });


    const review = await step.run("generate-ai-review", async () => {
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
      })

      return text
    });

    await step.run("post-comment", async () => {
      await postReviewComment(token, owner, repo, prNumber, review)
    })


    await step.run("save-review", async () => {
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
      }
    })

    // Increment review count ONLY after successful completion
    // Non-blocking: failures here won't cause retries or duplicate comments
    await step.run("increment-review-count", async () => {
      try {
        await incrementReviewCount(userId, repositoryId);
        console.log(`✅ Review count incremented for user ${userId}`);
      } catch (error) {
        // Log error but don't throw - credit tracking failure shouldn't
        // cause the entire review to retry and create duplicate GitHub comments
        console.error(`⚠️ Failed to increment review count for user ${userId}:`, error);
        console.error(`Review was successful but credit tracking failed. Manual adjustment may be needed.`);
        // Don't rethrow - allow the function to complete successfully
      }
    });

    return { success: true }
  }
)