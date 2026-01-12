import { NextResponse, NextRequest } from "next/server";
import { reviewPullRequest } from "@/module/ai/actions";
import { verifyGitHubWebhook, validateWebhookEvent } from "@/lib/webhook-security";

/**
 * GitHub Webhook Handler
 * 
 * Receives webhook events from GitHub when PRs are opened or updated.
 * Security measures:
 * - HMAC-SHA256 signature validation
 * - Event type validation
 * - Payload structure validation
 * - Error handling without information leakage
 */
export async function POST(req: NextRequest) {
    try {
        // SECURITY: Get raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");
        const event = req.headers.get("x-github-event");

        // SECURITY: Verify webhook signature
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('GITHUB_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: "Webhook not configured" },
                { status: 500 }
            );
        }

        if (!verifyGitHubWebhook(rawBody, signature, webhookSecret)) {
            console.warn('GitHub webhook signature verification failed');
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Parse body after signature validation
        const body = JSON.parse(rawBody);

        // SECURITY: Validate event type and structure
        if (!validateWebhookEvent(event, body)) {
            console.warn(`Invalid webhook event: ${event}`);
            return NextResponse.json(
                { error: "Invalid event" },
                { status: 400 }
            );
        }

        console.log(`✅ Received valid GitHub event: ${event}`);

        // Handle ping event (GitHub sends this to test webhook)
        if (event === "ping") {
            return NextResponse.json({ message: "Pong" }, { status: 200 });
        }

        // Handle pull request events
        if (event === "pull_request") {
            const action = body.action;
            const repo = body.repository.full_name;
            const prNumber = body.number;

            const [owner, repoName] = repo.split("/");

            // Trigger review for opened or updated PRs
            if (action === "opened" || action === "synchronize") {
                console.log(`🔄 Triggering review for ${repo} #${prNumber}`);

                // Fire and forget - don't block webhook response
                reviewPullRequest(owner, repoName, prNumber)
                    .then(() => console.log(`✅ Review completed for ${repo} #${prNumber}`))
                    .catch((error) => {
                        console.error(`❌ Review failed for ${repo} #${prNumber}:`, error.message);
                    });
            } else {
                console.log(`ℹ️  Ignoring PR action: ${action} for ${repo} #${prNumber}`);
            }
        }

        // Return success response
        return NextResponse.json(
            { message: "Event processed" },
            { status: 200 }
        );

    } catch (error) {
        // SECURITY: Don't leak error details to potential attackers
        console.error("GitHub webhook error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
