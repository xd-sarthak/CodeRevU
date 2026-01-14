"use server"
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db"
import { getPullRequestDiff } from "@/module/github/lib/github";
import { canCreateReview, incrementReviewCount } from "@/module/payment/lib/subscription";

export async function reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
) {
    console.log(`🚀 reviewPullRequest called:`, { owner, repo, prNumber });

    try {
        //fetch the repo from database
        const repository = await prisma.repository.findFirst({
            where: {
                owner,
                name: repo
            },
            include: {
                user: {
                    include: {
                        accounts: {
                            where: {
                                providerId: "github"
                            }
                        }
                    }
                }
            }
        });

        if (!repository) {
            console.error(`❌ Repository not found in database:`, { owner, repo });
            throw new Error(`Repository ${owner}/${repo} not found`);
        }

        console.log(`✅ Repository found:`, {
            id: repository.id,
            owner: repository.owner,
            name: repository.name,
            userId: repository.user.id
        });

        //tier limits
        const canReview = await canCreateReview(repository.user.id, repository.id);
        if (!canReview) {
            console.error(`❌ Review limit reached for user:`, {
                userId: repository.user.id,
                repositoryId: repository.id
            });
            throw new Error("You have reached your review limit for this repository. Please upgrade to pro");
        }

        console.log(`✅ Review limit check passed for user:`, { userId: repository.user.id });

        //fetch github account
        const githubAccount = repository.user.accounts[0];

        if (!githubAccount) {
            console.error(`❌ No GitHub account found for user:`, { userId: repository.user.id });
            throw new Error("No github access token found for repository owner")
        }

        console.log(`✅ GitHub account found for user:`, {
            userId: repository.user.id,
            accountId: githubAccount.id
        });

        //get user token to fetch repocontent
        const token = githubAccount.accessToken;

        //get pull request and what changed
        console.log(`📥 Fetching PR diff from GitHub...`);
        const { title } = await getPullRequestDiff(token, owner, repo, prNumber);
        console.log(`✅ PR diff fetched:`, { title });

        console.log(`📤 Sending Inngest event: pr.review.requested`);
        console.log(`🔧 Inngest env check in action:`, {
            INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? 'set (' + process.env.INNGEST_SIGNING_KEY.substring(0, 8) + '...)' : 'MISSING',
            INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ? 'set (' + process.env.INNGEST_EVENT_KEY.substring(0, 8) + '...)' : 'MISSING',
        });

        try {
            const sendResult = await inngest.send({
                name: "pr.review.requested",
                data: {
                    owner,
                    repo,
                    prNumber,
                    userId: repository.user.id,
                    repositoryId: repository.id  // Pass repositoryId for credit tracking
                }
            });
            console.log(`✅ Inngest event sent successfully:`, sendResult);
        } catch (inngestError) {
            console.error(`❌ Inngest send failed:`, {
                error: inngestError instanceof Error ? inngestError.message : inngestError,
                stack: inngestError instanceof Error ? inngestError.stack : undefined
            });
            throw inngestError;
        }

        return {
            success: true,
            message: "Review Queued"
        }
    } catch (error) {
        console.error(`❌ Error in reviewPullRequest:`, {
            owner,
            repo,
            prNumber,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : error
        });

        try {
            const repository = await prisma.repository.findFirst({
                where: { owner, name: repo }
            });

            if (repository) {
                console.log(`💾 Saving error review to database...`);
                await prisma.review.create({
                    data: {
                        repositoryId: repository.id,
                        prNumber,
                        prTitle: "Failed To Fetch PR",
                        prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                        review: `Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
                        status: "Failed"
                    }
                })
                console.log(`✅ Error review saved to database`);
            }
        } catch (dbError) {
            console.error("❌ Failed to save error to database", dbError);

        }

        // Re-throw the error so the webhook handler can catch it
        throw error;
    }
}

