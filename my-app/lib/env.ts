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
 * Validated environment variables (lazy evaluation)
 * 
 * Uses safeParse to avoid throwing at import time.
 * Call validateEnv() early in your application to ensure all variables are valid.
 */
const envResult = envSchema.safeParse(process.env);

/**
 * Validated and typed environment variables
 * 
 * Use this instead of process.env to get type safety and validation
 * 
 * @example
 * import { env } from '@/lib/env';
 * const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
 */
export const env = envResult.success ? envResult.data : ({} as Env);

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and provides helpful error messages
 * Call this early in your application startup
 * 
 * @throws {Error} If environment variables are invalid
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

    console.log('✅ Environment variables validated successfully');
}

