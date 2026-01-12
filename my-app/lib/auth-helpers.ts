import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connection } from "next/server";
import prisma from "@/lib/db";

/**
 * Authorization Helper Utilities
 * 
 * Provides reusable functions for authentication and authorization checks
 * in Server Actions and API routes.
 */

/**
 * Requires user to be authenticated
 * 
 * Use this at the start of any Server Action that requires authentication.
 * Automatically calls connection() to prevent blocking route errors.
 * 
 * @throws Error if user is not authenticated
 * @returns Session object with user information
 * 
 * @example
 * export async function myServerAction() {
 *   const session = await requireAuth();
 *   // Now safe to use session.user.id
 * }
 */
export async function requireAuth() {
    // Opt into dynamic rendering to prevent blocking route errors
    await connection();

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        throw new Error("Unauthorized: Authentication required");
    }

    return session;
}

/**
 * Verifies that a user has access to a specific repository
 * 
 * Checks that the repository exists and belongs to the authenticated user.
 * 
 * @param userId - ID of the authenticated user
 * @param repositoryId - ID of the repository to check
 * @throws Error if repository doesn't exist or user doesn't have access
 * @returns Repository object if access is granted
 * 
 * @example
 * const session = await requireAuth();
 * const repo = await requireRepositoryAccess(session.user.id, repoId);
 */
export async function requireRepositoryAccess(
    userId: string,
    repositoryId: string
) {
    const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: {
            id: true,
            userId: true,
            name: true,
            owner: true,
            fullName: true,
        },
    });

    if (!repository) {
        throw new Error("Repository not found");
    }

    if (repository.userId !== userId) {
        throw new Error("Forbidden: You don't have access to this repository");
    }

    return repository;
}

/**
 * Verifies that a user has access to a specific review
 * 
 * Checks that the review exists and belongs to one of the user's repositories.
 * 
 * @param userId - ID of the authenticated user
 * @param reviewId - ID of the review to check
 * @throws Error if review doesn't exist or user doesn't have access
 * @returns Review object with repository information
 * 
 * @example
 * const session = await requireAuth();
 * const review = await requireReviewAccess(session.user.id, reviewId);
 */
export async function requireReviewAccess(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            repository: {
                select: {
                    userId: true,
                    name: true,
                    owner: true,
                },
            },
        },
    });

    if (!review) {
        throw new Error("Review not found");
    }

    if (review.repository.userId !== userId) {
        throw new Error("Forbidden: You don't have access to this review");
    }

    return review;
}

/**
 * Checks if a user owns a repository by GitHub ID
 * 
 * Useful when you have a GitHub repository ID but not the database ID.
 * 
 * @param userId - ID of the authenticated user
 * @param githubRepoId - GitHub repository ID (as BigInt)
 * @returns Repository if found and owned by user, null otherwise
 */
export async function findUserRepository(
    userId: string,
    githubRepoId: bigint
) {
    return await prisma.repository.findFirst({
        where: {
            userId,
            githubId: githubRepoId,
        },
    });
}

/**
 * Checks if a user has permission to perform an action based on their subscription tier
 * 
 * @param userId - ID of the authenticated user
 * @param requiredTier - Minimum tier required ('FREE' or 'PRO')
 * @throws Error if user doesn't have required tier
 * @returns User object with subscription information
 */
export async function requireSubscriptionTier(
    userId: string,
    requiredTier: 'FREE' | 'PRO'
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            subscriptionTier: true,
            subscriptionStatus: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // PRO tier has access to everything
    if (user.subscriptionTier === 'PRO' && user.subscriptionStatus === 'ACTIVE') {
        return user;
    }

    // If FREE tier is required, allow it
    if (requiredTier === 'FREE') {
        return user;
    }

    // Otherwise, user needs PRO tier
    throw new Error("Upgrade required: This feature requires a PRO subscription");
}
