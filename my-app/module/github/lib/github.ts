import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { connection } from "next/server";

//fetches github access token for the logged in user
//Request -> session -> user -> linked Github account -> access token
export const getGithubToken = async () => {

  //gets current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorised");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    throw new Error("No github access token found");
  }

  return account.accessToken;
};


//fetches user contribution calendar data
//we use github graphql API because REST API does not provide contribution data
//contribution data is public but rate limited without auth so we use graphQL and auth token
export async function fetchUserContribution(token: string, username: string) {
  const octokit = new Octokit({ auth: token });

  //graphQL query to get contribution calendar
  const query = `
  query ($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;




  try {
    const response: any = await octokit.graphql(query, {
      username
    });

    return response.user.contributionsCollection.contributionCalendar
  } catch (error) {
    console.error("Failed to fetch GitHub contributions", error);
    throw new Error("GitHub contribution fetch failed");
  }

}

//fetche authenticated user's repositories
export const getRepositories = async (page: number = 1, perPage: number = 10) => {
  console.log('🔍 getRepositories called with:', { page, perPage });

  const token = await getGithubToken();
  console.log('✅ Got GitHub token:', token ? 'exists' : 'missing');

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    per_page: perPage,
    page: page
  });

  console.log('📦 GitHub API returned:', data.length, 'repositories');
  console.log('📋 First repo:', data[0]?.name || 'none');

  return data;

}


//webhooks allows github -> server communication
//instead of polling github, we can setup webhooks to get notified on events
//we listen for pull_request events to index code on new PRs
export const createWebHook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  // SECURITY: Use server-side env var, not NEXT_PUBLIC_ (which exposes to client)
  const webhookURL = `${process.env.APP_BASE_URL}/api/webhooks/github`

  const { data: hooks } = await octokit.rest.repos.listWebhooks({
    owner,
    repo
  });

  const exisitingHook = hooks.find(hook => hook.config.url === webhookURL);

  //Idempotency - return existing hook if already present
  if (exisitingHook) {
    return exisitingHook
  }

  //create new webhook if doesnt exist
  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookURL,
      content_type: "json",
    },
    events: ["pull_request"]
  });

  return data;
}

//deletes webhook from the repo
//identify webhooks by ID 
export const deleteWebHook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });
  // SECURITY: Use server-side env var, not NEXT_PUBLIC_ (which exposes to client)
  const webhookURL = `${process.env.APP_BASE_URL}/api/webhooks/github`;

  try {
    const { data: hooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo
    });

    const hookToDelete = hooks.find(hook => hook.config.url === webhookURL);

    if (hookToDelete) {
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookToDelete.id
      })

      return true;
    }

    return false;
  } catch (error) {
    console.error("error deleting webhook: ", error);
    return false;
  }
}

//recursively fetches all files in a repo along with their content

/**
 * Recursively fetches ALL code files from a GitHub repository.
 *
 * First principles:
 * - GitHub stores repos as a tree (files + directories)
 * - getContent returns:
 *   - a single file OR
 *   - a directory listing
 * - Files are Base64 encoded
 *
 * This function:
 * - walks the entire repo tree
 * - decodes file contents
 * - filters out binary/non-code files
 *
 * Used for:
 * - RAG indexing
 * - static analysis
 * - documentation generation
 */


export async function getRepoFileContents(
  token: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<{ path: string, content: string }[]> {

  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path
  });

  //if API returned a single file

  if (!Array.isArray(data)) {
    if (data.type === "file" && data.content) {
      return [{
        path: data.path,
        content: Buffer.from(data.content, 'base64').toString('utf-8')
      }];
    }
    return [];
  }

  //If API returned a directory
  let files: { path: string, content: string }[] = [];

  for (const item of data) {
    if (item.type === "file") {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: item.path
      });

      if (!Array.isArray(fileData) && fileData.type === "file" && fileData.content) {
        //filter out noncode files like images
        //including texts here for now
        if (!item.path.match(/\.(png|jpg|jpeg|gif|svg|bmp|txt|md|pdf)$/i)) {
          files.push({
            path: item.path,
            content: Buffer.from(fileData.content, 'base64').toString('utf-8')
          });
        }
      }
    }

    //recursive call for directories
    else if (item.type === "dir") {
      const subFiles = await getRepoFileContents(token, owner, repo, item.path);
      files = files.concat(subFiles);
    }
  }

  return files;
}

export async function getPullRequestDiff(
  token: string | null,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = new Octokit({ auth: token });

  //get pull request and what changed
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });

  // Fetch the SAME PR again, but request a different representation.
  // First principle: the same resource can have multiple valid views.
  // JSON view → structured metadata
  // DIFF view → raw textual changes (the actual code delta)
  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff"
    }
  });

  return {
    diff: diff as unknown as string,
    title: pr.title,
    description: pr.body || "",
  }
}

export async function postReviewComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  review: string
) {
  const octokit = new Octokit({ auth: token });

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body:
      "## 🤖 AI Code Review\n\n" +
      review +
      "\n\n---\n" +
      "_Powered by CodeRevU_",
  })
}