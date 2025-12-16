import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

export const getGithubToken = async () => {
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

export async function fetchUserContribution(token: string, username: string) {
  const octokit = new Octokit({ auth: token });
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
    const response:any = await octokit.graphql(query,{
        username
    });

    return response.user.contributionsCollection.contributionCalendar
} catch (error) {
    console.error("Failed to fetch GitHub contributions", error);
    throw new Error("GitHub contribution fetch failed");
}

}

export const getRepositories = async (page:number=1,perPage:number=10) => {
    const token = await getGithubToken();
    const octokit = new Octokit({auth:token});

    const {data} = await octokit.rest.repos.listForAuthenticatedUser({
      sort:"updated",
      direction:"desc",
      visibility:"all"
    });

    return data;

}

export const createWebHook = async (owner:string,repo:string) => {
  const token  = await getGithubToken();
  const octokit = new Octokit({auth:token});

  const webhookURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`

  const {data:hooks} = await octokit.rest.repos.listWebhooks({
    owner,
    repo
  });

  const exisitingHook = hooks.find(hook=>hook.config.url === webhookURL);

  if(exisitingHook){
    return exisitingHook
  }

  const {data} = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config:{
      url:webhookURL,
      content_type:"json"
    },
    events:["pull_request"]
  });

  return data;
}

export const deleteWebHook = async (owner:string,repo:string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({auth:token});
  const webhookURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

  try {
    const {data:hooks} = await octokit.rest.repos.listWebhooks({
      owner,
      repo
    });

    const hookToDelete = hooks.find(hook => hook.config.url === webhookURL);

    if(hookToDelete){
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id:hookToDelete.id
      })

      return true;
    }

    return false;
  } catch (error) {
    console.error("error deleting webhook: ",error);
    return false;    
  }
}