/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js when the server starts.
 * It's the perfect place to validate environment variables before the app runs.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { validateEnv } from './lib/env';

/**
 * Called once when the server starts (both dev and production)
 * Validates all environment variables before the application runs
 */
export async function register() {
    // Validate environment variables on startup
    // This will exit the process with helpful error messages if validation fails
    validateEnv();
}
