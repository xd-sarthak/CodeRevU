"use server"
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getReviews() {
    console.log(`🔍 [getReviews] Fetching reviews`);
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            console.error(`❌ [getReviews] No session found`);
            throw new Error("Unauthorised");
        }
        console.log(`✅ [getReviews] Session found for user ${session.user.id}`);

        const reviews = await prisma.review.findMany({
            where: {
                repository: {
                    userId: session.user.id
                }
            },
            include: {
                repository: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 50
        });

        console.log(`✅ [getReviews] Fetched ${reviews.length} reviews for user ${session.user.id}`);
        return reviews;
    } catch (error) {
        console.error(`❌ [getReviews] Failed to fetch reviews`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}