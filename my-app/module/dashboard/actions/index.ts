// Server actions for dashboard functionality
// Handles fetching and aggregating user statistics from GitHub API and database
// Includes contribution stats, overall dashboard stats, and monthly activity breakdown
// Requires authenticated session and GitHub token access

"use server";
import {
    fetchUserContribution, getGithubToken
} from "@/module/github/lib/github"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import prisma from "@/lib/db";


export async function getContributionStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const token = await getGithubToken();

        // Get the actual GitHub username from the GitHub API
        const octokit = new Octokit({ auth: token });

        const { data: user } = await octokit.rest.users.getAuthenticated();
        const username = user.login;

        const calendar = await fetchUserContribution(token, username);

        if (!calendar) {
            return null;
        }

        const contributions = calendar.weeks.flatMap((week: any) =>
            week.contributionDays.map((day: any) => ({
                date: day.date,
                count: day.contributionCount,
                level: Math.min(4, Math.floor(day.contributionCount / 3)), // Convert to 0-4 scale
            }))
        )

        return {
            contributions,
            totalContributions: calendar.totalContributions
        }

    } catch (error) {
        console.error("Error fetching contribution stats:", error);
        return null;
    }
}


export async function getDashboardStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const token = await getGithubToken();
        const octokit = new Octokit({ auth: token })

        // Get users github username

        const { data: user } = await octokit.rest.users.getAuthenticated()

        // Fetch total connected repositories from DB
        const totalRepos = await prisma.repository.count({
            where: {
                userId: session.user.id
            }
        });

        const calendar = await fetchUserContribution(token, user.login);
        const totalCommits = calendar?.totalContributions || 0

        // Count prs from github
        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr`,
            per_page: 1
        })

        const totalPRs = prs.total_count

        // Count AI reviews from database
        const totalReviews = await prisma.review.count({
            where: {
                repository: {
                    userId: session.user.id
                }
            }
        });

        return {
            totalCommits,
            totalPRs,
            totalReviews,
            totalRepos
        }

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            totalCommits: 0,
            totalPRs: 0,
            totalReviews: 0,
            totalRepos: 0,
        };
    }
}

export async function getMonthlyActivity() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session?.user) {
            throw new Error("Unauthorized");
        }
        const token = await getGithubToken();
        const octokit = new Octokit({ auth: token })

        const { data: user } = await octokit.rest.users.getAuthenticated()

        const calendar = await fetchUserContribution(token, user.login)

        if (!calendar) {
            return [];
        }

        const monthlyData: {
            [key: string]: { commits: number; prs: number; reviews: number }
        } = {}

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = { commits: 0, prs: 0, reviews: 0 };
        }

        calendar.weeks.forEach((week: any) => {
            week.contributionDays.forEach((day: any) => {
                const date = new Date(day.date);
                const monthKey = monthNames[date.getMonth()];
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].commits += day.contributionCount;
                }
            })
        })

        // Fetch reviews from database for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const reviews = await prisma.review.findMany({
            where: {
                repository: {
                    userId: session.user.id
                },
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                createdAt: true
            }
        });

        reviews.forEach((review) => {
            const monthKey = monthNames[review.createdAt.getMonth()];
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1;
            }
        })

        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr created:>${sixMonthsAgo.toISOString().split("T")[0]
                }`,
            per_page: 100,
        });

        prs.items.forEach((pr: any) => {
            const date = new Date(pr.created_at);
            const monthKey = monthNames[date.getMonth()];
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1;
            }
        });

        return Object.keys(monthlyData).map((name) => ({
            name,
            ...monthlyData[name]
        }))

    } catch (error) {
        console.error("Error fetching monthly activity:", error);
        return [];
    }
}