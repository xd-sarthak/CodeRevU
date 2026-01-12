import crypto from 'crypto';

/**
 * Verifies GitHub webhook signature using HMAC-SHA256
 * 
 * GitHub signs webhook payloads with a secret key and sends the signature
 * in the x-hub-signature-256 header. This function verifies the signature
 * to ensure the webhook is authentic and hasn't been tampered with.
 * 
 * @param payload - Raw request body as string
 * @param signature - Signature from x-hub-signature-256 header
 * @param secret - Webhook secret configured in GitHub
 * @returns true if signature is valid, false otherwise
 */
export function verifyGitHubWebhook(
    payload: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature) {
        console.warn('GitHub webhook: No signature provided');
        return false;
    }

    if (!secret) {
        console.error('GitHub webhook: No secret configured');
        return false;
    }

    try {
        // GitHub sends signature as "sha256=<hash>"
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    } catch (error) {
        console.error('GitHub webhook signature verification failed:', error);
        return false;
    }
}

/**
 * Checks if a webhook request is a replay attack
 * 
 * Replay attacks involve resending old webhook payloads. We reject
 * requests older than 5 minutes to prevent this.
 * 
 * Note: GitHub doesn't send timestamps in headers by default, so this
 * is a placeholder for future enhancement. For now, we can use the
 * request's Date header or implement our own timestamp tracking.
 * 
 * @param timestamp - Request timestamp (Unix timestamp as string)
 * @returns true if request is too old (potential replay attack)
 */
export function isReplayAttack(timestamp: string | null): boolean {
    if (!timestamp) {
        // If no timestamp provided, we can't validate
        // In production, you might want to reject these
        return false;
    }

    try {
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const fiveMinutes = 5 * 60;

        return Math.abs(currentTime - requestTime) > fiveMinutes;
    } catch (error) {
        console.error('Timestamp validation failed:', error);
        return true; // Reject on error
    }
}

/**
 * Validates that a webhook event is from an expected source
 * 
 * Additional security layer to check the event type and structure
 * 
 * @param event - Event type from x-github-event header
 * @param body - Parsed webhook payload
 * @returns true if event structure is valid
 */
export function validateWebhookEvent(event: string | null, body: any): boolean {
    if (!event) {
        console.warn('GitHub webhook: No event type provided');
        return false;
    }

    // Validate expected event types
    const allowedEvents = ['ping', 'pull_request', 'push'];
    if (!allowedEvents.includes(event)) {
        console.warn(`GitHub webhook: Unexpected event type: ${event}`);
        return false;
    }

    // Validate payload structure based on event type
    if (event === 'pull_request') {
        if (!body.action || !body.repository || !body.number) {
            console.warn('GitHub webhook: Invalid pull_request payload structure');
            return false;
        }
    }

    return true;
}
