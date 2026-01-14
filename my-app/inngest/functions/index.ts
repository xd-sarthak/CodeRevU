import { inngest } from "../../inngest/client";
import prisma from "@/lib/db";
import { indexCodebase } from "@/module/ai/lib/rag";
import { getRepoFileContents } from "@/module/github/lib/github";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const indexRepo = inngest.createFunction(
  { id: "index-repo" },
  { event: "repository.connected" },

  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;
    console.log(`🚀 [indexRepo] Starting indexing for ${owner}/${repo}`, {
      userId,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });

    //get all files
    const files = await step.run("fetch-files", async () => {
      console.log(`📥 [indexRepo:fetch-files] Fetching files for ${owner}/${repo}`);
      try {
        const account = await prisma.account.findFirst({
          where: {
            userId: userId,
            providerId: "github"
          }
        });

        if (!account?.accessToken) {
          console.error(`❌ [indexRepo:fetch-files] No GitHub token found for user ${userId}`);
          throw new Error("No github access token found");
        }
        console.log(`✅ [indexRepo:fetch-files] Found GitHub token for user ${userId}`);

        const result = await getRepoFileContents(account.accessToken, owner, repo);
        console.log(`✅ [indexRepo:fetch-files] Fetched ${result.length} files from ${owner}/${repo}`);
        return result;
      } catch (error) {
        console.error(`❌ [indexRepo:fetch-files] Failed to fetch files`, {
          owner, repo, userId,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });

    await step.run("index-codebase", async () => {
      console.log(`🔄 [indexRepo:index-codebase] Indexing ${files.length} files for ${owner}/${repo}`);
      try {
        await indexCodebase(`${owner}/${repo}`, files);
        console.log(`✅ [indexRepo:index-codebase] Indexing complete for ${owner}/${repo}`);
      } catch (error) {
        console.error(`❌ [indexRepo:index-codebase] Failed to index codebase`, {
          owner, repo, fileCount: files.length,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    });

    console.log(`🎉 [indexRepo] Completed indexing for ${owner}/${repo} (${files.length} files)`);
    return { success: true, indexedFiles: files.length };
  }
);