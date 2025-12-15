// Authentication configuration using Better Auth
// Integrates with Prisma database adapter for PostgreSQL
// Configures GitHub OAuth provider with repository access scope
// Handles user authentication, sessions, and social login
import { betterAuth } from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders: { 
        github: { 
          clientId: process.env.GITHUB_CLIENT_ID as string, 
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
          scope:["repo"]
        }, 
      }, 
});

