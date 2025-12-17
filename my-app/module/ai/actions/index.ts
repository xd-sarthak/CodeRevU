"use server"
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db"
import { getPullRequestDiff } from "@/module/github/lib/github";
export async function reviewPullRequest(
    owner:string,
    repo:string,
    prNumber:number
) {
    try {
        //fetch the repo from database
    const repository = await prisma.repository.findFirst({
        where:{
            owner,
            name:repo
        },
        include:{
            user:{
                include:{
                    accounts:{
                        where:{
                            providerId:"github"
                        }
                    }
                }
            }
        }
    });

    if(!repository){
        throw new Error(`Repository ${owner}/${repo} not found`);
    }

    //fetch github account
    const githubAccount = repository.user.accounts[0];

    if(!githubAccount){
        throw new Error("No github access token found for repository owner")
    }

    //get user token to fetch repocontent
    const token = githubAccount.accessToken;

    //get pull request and what changed
    const {title} = await getPullRequestDiff(token,owner,repo,prNumber);

    await inngest.send({
        name:"pr.review.requested",
        data:{
            owner,
            repo,
            prNumber,
            userId:repository.user.id
        }
    });

    return {success:true,
        message:"Review Queued"
    }
    } catch (error) {
        
        try {
           const repository = await prisma.repository.findFirst({
            where:{owner,name:repo}
           });

           if(repository){
            await prisma.review.create({
              data:{
                repositoryId:repository.id,
                prNumber,
                prTitle:"Failed To Fetch PR",
                prUrl:`https://github.com/${owner}/${repo}/pull/${prNumber}`,
                review:`Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
                status:"Failed"
              }  
            })
           }
        } catch (dbError) {
            console.error("Failed to save error to database",dbError);
            
        }
    }
}