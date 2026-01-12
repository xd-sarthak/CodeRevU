/**
 * Test script for GitHub webhook signature validation
 * 
 * This script simulates a GitHub webhook request with a valid HMAC signature
 * to test that our webhook endpoint correctly validates signatures.
 * 
 * Usage:
 * 1. Make sure your dev server is running (bun run dev)
 * 2. Run: npx tsx test-webhook.ts
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/github';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    console.error('❌ Error: GITHUB_WEBHOOK_SECRET not found in .env file');
    console.error('Please add GITHUB_WEBHOOK_SECRET to your .env file');
    process.exit(1);
}

console.log('🔑 Webhook secret loaded from .env file\n');

// Sample GitHub webhook payload (ping event)
const payload = {
    zen: "Design for failure.",
    hook_id: 123456789,
    hook: {
        type: "Repository",
        id: 123456789,
        active: true,
        events: ["pull_request"]
    }
};

const payloadString = JSON.stringify(payload);

// Generate HMAC signature (same way GitHub does it)
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
const signature = 'sha256=' + hmac.update(payloadString).digest('hex');

console.log('🧪 Testing GitHub Webhook Signature Validation\n');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('Payload:', payloadString);
console.log('Generated Signature:', signature);
console.log('\n--- Test 1: Valid Signature ---');

// Test 1: Valid signature (should succeed)
fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-github-event': 'ping',
        'x-hub-signature-256': signature,
    },
    body: payloadString,
})
    .then(async (response) => {
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);

        if (response.status === 200) {
            console.log('✅ Test 1 PASSED: Valid signature accepted\n');
        } else {
            console.log('❌ Test 1 FAILED: Valid signature rejected\n');
        }

        // Test 2: Invalid signature (should fail with 401)
        console.log('--- Test 2: Invalid Signature ---');
        return fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'ping',
                'x-hub-signature-256': 'sha256=invalid_signature_12345',
            },
            body: payloadString,
        });
    })
    .then(async (response) => {
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);

        if (response.status === 401) {
            console.log('✅ Test 2 PASSED: Invalid signature rejected\n');
        } else {
            console.log('❌ Test 2 FAILED: Invalid signature accepted\n');
        }

        // Test 3: Missing signature (should fail with 401)
        console.log('--- Test 3: Missing Signature ---');
        return fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'ping',
            },
            body: payloadString,
        });
    })
    .then(async (response) => {
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);

        if (response.status === 401) {
            console.log('✅ Test 3 PASSED: Missing signature rejected\n');
        } else {
            console.log('❌ Test 3 FAILED: Missing signature accepted\n');
        }

        console.log('\n🎉 All tests completed!');
    })
    .catch((error) => {
        console.error('❌ Test failed with error:', error.message);
    });
