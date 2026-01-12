import { z } from 'zod';

/**
 * Environment variable schema with validation
 * 
 * This ensures all required environment variables are present and valid
 * before the application starts. Fails fast with clear error messages.
 */
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

    // GitHub OAuth & Integration
    GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
    GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
    GITHUB_WEBHOOK_SECRET: z.string().min(1, 'GITHUB_WEBHOOK_SECRET is required for webhook security'),

    // AI - Google Gemini
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required'),

    // Vector Database - Pinecone
    PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
    PINECONE_INDEX_NAME: z.string().min(1, 'PINECONE_INDEX_NAME is required'),

    // Application URLs (server-side only, NOT NEXT_PUBLIC_)
    APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL'),

    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Authentication - Better Auth
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),

    // Polar (Payment/Subscription) - Optional
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    POLAR_SUCCESS_URL: z.string().optional(),

    // Inngest (Background Jobs) - Optional in development
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),

    // Client-side variables (these are safe to expose)
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
});

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Module-scoped validated environment variables
 * Only set after validateEnv() is called successfully
 */
let _env: Env | null = null;

/**
 * Get validated environment variables
 * 
 * @throws {Error} If validateEnv() hasn't been called yet
 * @returns Validated environment variables
 * 
 * @example
 * import { getEnv } from '@/lib/env';
 * const apiKey = getEnv().GOOGLE_GENERATIVE_AI_API_KEY;
 */
export function getEnv(): Env {
    if (!_env) {
        throw new Error(
            'Environment variables not validated. Call validateEnv() first. ' +
            'This should be done in instrumentation.ts or at application startup.'
        );
    }
    return _env;
}

/**
 * @deprecated Use getEnv() instead for safer access to environment variables
 * 
 * Backward-compatible export that returns validated env or empty object.
 * This exists for compatibility but should be migrated to getEnv().
 * 
 * @example
 * // OLD (unsafe):
 * import { env } from '@/lib/env';
 * const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
 * 
 * // NEW (safe):
 * import { getEnv } from '@/lib/env';
 * const apiKey = getEnv().GOOGLE_GENERATIVE_AI_API_KEY;
 */
export const env: Env = new Proxy({} as Env, {
    get(target, prop) {
        if (_env) {
            return _env[prop as keyof Env];
        }
        // If accessed before validation, throw helpful error
        throw new Error(
            `Attempted to access env.${String(prop)} before validateEnv() was called. ` +
            'Environment variables must be validated first (done in instrumentation.ts). ' +
            'Consider using getEnv() instead for explicit validation checks.'
        );
    }
});

/**
 * Validates environment variables and provides helpful error messages
 * Call this early in your application startup (e.g., in instrumentation.ts)
 * 
 * @throws {Error} If environment variables are invalid (via process.exit)
 */
export function validateEnv(): void {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Environment variable validation failed:');
        result.error.issues.forEach((err: z.ZodIssue) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    // Store validated environment variables
    _env = result.data;
    console.log('✅ Environment variables validated successfully');
}
