/**
 * Test script to simulate a GitHub pull_request webhook event
 * 
 * This script sends a mock pull_request webhook to your local server
 * to test the PR review flow without creating an actual PR on GitHub.
 * 
 * Usage:
 * 1. Make sure your dev server is running (npm run dev)
 * 2. Update the REPO_OWNER, REPO_NAME, and PR_NUMBER below
 * 3. Run: npx tsx test-pr-webhook.ts
 */

import crypto from 'crypto';

// Configuration - UPDATE THESE VALUES
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/github';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your_webhook_secret';
const REPO_OWNER = 'xd-sarthak'; // e.g., 'octocat'
const REPO_NAME = 'Vamos';        // e.g., 'Hello-World'
const PR_NUMBER = 1;

// Mock pull_request event payload
const mockPayload = {
    action: 'opened', // or 'synchronize' for PR updates
    number: PR_NUMBER,
    pull_request: {
        id: 1,
        number: PR_NUMBER,
        title: 'Test PR: Add new feature',
        body: 'This is a test pull request to verify the review system works correctly.',
        state: 'open',
        user: {
            login: REPO_OWNER,
            id: 1,
        },
        head: {
            ref: 'feature-branch',
            sha: 'abc123def456',
        },
        base: {
            ref: 'main',
            sha: 'def456abc123',
        },
    },
    repository: {
        id: 1,
        name: REPO_NAME,
        full_name: `${REPO_OWNER}/${REPO_NAME}`,
        owner: {
            login: REPO_OWNER,
            id: 1,
        },
    },
    sender: {
        login: REPO_OWNER,
        id: 1,
    },
};

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
}

/**
 * Send test webhook to local server
 */
async function sendTestWebhook() {
    const payloadString = JSON.stringify(mockPayload);
    const signature = generateSignature(payloadString, WEBHOOK_SECRET);

    console.log('🧪 Sending test pull_request webhook...');
    console.log('📋 Payload:', {
        action: mockPayload.action,
        repo: mockPayload.repository.full_name,
        prNumber: mockPayload.number,
        prTitle: mockPayload.pull_request.title,
    });
    console.log('🔐 Signature:', signature);
    console.log('');

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-GitHub-Event': 'pull_request',
                'X-Hub-Signature-256': signature,
                'X-GitHub-Delivery': crypto.randomUUID(),
            },
            body: payloadString,
        });

        const responseText = await response.text();

        console.log('📥 Response Status:', response.status, response.statusText);
        console.log('📥 Response Body:', responseText);

        if (response.ok) {
            console.log('');
            console.log('✅ Webhook sent successfully!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Check your application logs for detailed flow tracking');
            console.log('2. Look for the 🚀 reviewPullRequest called log');
            console.log('3. Verify the 📤 Inngest event sent successfully log');
            console.log('4. Check your Inngest dashboard to see if the job was triggered');
        } else {
            console.error('');
            console.error('❌ Webhook failed!');
            console.error('Check the error message above for details.');
        }
    } catch (error) {
        console.error('');
        console.error('❌ Error sending webhook:', error);
        console.error('');
        console.error('Make sure:');
        console.error('1. Your dev server is running (npm run dev)');
        console.error('2. The webhook URL is correct:', WEBHOOK_URL);
    }
}

// Run the test
sendTestWebhook();
