"use server";
import { auth } from "@/lib/auth";
import { getRemainingLimits, updateUserTier } from "@/module/payment/lib/subscription";
import { headers } from "next/headers";
import { PolarClient } from "@/module/payment/config/polar";
import prisma from "@/lib/db";

export interface SubscriptionData {
    user: {
        id: string;
        name: string;
        email: string;
        subscriptionTier: string;
        subscriptionStatus: string | null;
        polarCustomerId: string | null;
        polarSubscriptionId: string | null;
    } | null;
    limits: {
        tier: "FREE" | "PRO";
        repositories: {
            current: number;
            limit: number | null;
            canAdd: boolean;
        };
        reviews: {
            [repositoryId: string]: {
                current: number;
                limit: number | null;
                canAdd: boolean;
            };
        };
    } | null;
}

export async function getSubscriptionData(): Promise<SubscriptionData> {
    console.log(`🔍 [getSubscriptionData] Fetching subscription data`);
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            console.log(`ℹ️ [getSubscriptionData] No session, returning empty data`);
            return { user: null, limits: null };
        }
        console.log(`✅ [getSubscriptionData] Session found for user ${session.user.id}`);

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            console.warn(`⚠️ [getSubscriptionData] User not found in database: ${session.user.id}`);
            return { user: null, limits: null };
        }

        const limits = await getRemainingLimits(user.id);
        console.log(`✅ [getSubscriptionData] Data fetched successfully`, {
            userId: user.id,
            tier: user.subscriptionTier
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                subscriptionTier: user.subscriptionTier || "FREE",
                subscriptionStatus: user.subscriptionStatus || null,
                polarCustomerId: user.polarCustomerId || null,
                polarSubscriptionId: user.polarSubscriptionId || null,
            },
            limits,
        };
    } catch (error) {
        console.error(`❌ [getSubscriptionData] Failed to fetch subscription data`, {
            error: error instanceof Error ? error.message : error
        });
        throw error;
    }
}

export async function syncSubscriptionStatus() {
    console.log(`🔄 [syncSubscriptionStatus] Starting subscription sync`);
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            console.error(`❌ [syncSubscriptionStatus] No session found`);
            throw new Error("Not authenticated");
        }
        console.log(`✅ [syncSubscriptionStatus] Session found for user ${session.user.id}`);

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.polarCustomerId) {
            console.warn(`⚠️ [syncSubscriptionStatus] No Polar customer ID found for user ${session?.user?.id}`);
            return { success: false, message: "No Polar customer ID found" };
        }
        console.log(`✅ [syncSubscriptionStatus] Found Polar customer: ${user.polarCustomerId}`);

        // Fetch subscriptions from Polar
        console.log(`📥 [syncSubscriptionStatus] Fetching subscriptions from Polar`);
        const result = await PolarClient.subscriptions.list({
            customerId: user.polarCustomerId,
        });

        const subscriptions = result.result?.items || [];
        console.log(`✅ [syncSubscriptionStatus] Found ${subscriptions.length} subscriptions`);

        // Find the most relevant subscription (active or most recent)
        const activeSub = subscriptions.find((sub: any) => sub.status === 'active');
        const latestSub = subscriptions[0]; // Assuming API returns sorted or we should sort

        if (activeSub) {
            console.log(`📤 [syncSubscriptionStatus] Found active subscription, updating to PRO`);
            await updateUserTier(user.id, "PRO", "ACTIVE", activeSub.id);
            console.log(`✅ [syncSubscriptionStatus] Updated user to PRO tier`);
            return { success: true, status: "ACTIVE" };
        } else if (latestSub) {
            // If latest is canceled/expired
            const status = latestSub.status === 'canceled' ? 'CANCELED' : 'EXPIRED';
            console.log(`📤 [syncSubscriptionStatus] Found ${status} subscription`);
            // Only downgrade if we are sure it's not active
            if (latestSub.status !== 'active') {
                await updateUserTier(user.id, "FREE", status, latestSub.id);
                console.log(`✅ [syncSubscriptionStatus] Downgraded user to FREE tier`);
            }
            return { success: true, status };
        }

        console.log(`ℹ️ [syncSubscriptionStatus] No subscriptions found`);
        return { success: true, status: "NO_SUBSCRIPTION" };
    } catch (error) {
        console.error(`❌ [syncSubscriptionStatus] Failed to sync subscription`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
        });
        return { success: false, error: "Failed to sync with Polar" };
    }
}