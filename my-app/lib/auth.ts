// Authentication configuration using Better Auth
// Integrates with Prisma database adapter for PostgreSQL
// Configures GitHub OAuth provider with repository access scope
// Handles user authentication, sessions, and social login
import { betterAuth } from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "./db";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { PolarClient } from "@/module/payment/config/polar";
import { updatePolarCustomerId, updateUserTier } from "@/module/payment/lib/subscription";

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
      trustedOrigins:["http://localhost:3000","https://lowerable-permissibly-georgie.ngrok-free.dev"],
     plugins: [
        polar({
            client: PolarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "cc388622-ecca-4efc-92c4-e0e40f8c90b3",
                            slug: "coderevu" // Custom slug for easy reference in Checkout URL, e.g. /checkout/codeRevU
                        }
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL || "/dashboard/subscriptions?success=true",
                    authenticatedUsersOnly: true
                }),
                portal({
                  returnUrl: process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000/dashboard",
                }),
                usage(),
                webhooks({
                    secret:process.env.POLAR_WEBHOOK_SECRET!,
                    onSubscriptionActive:async (payload) => {
                        const customerId = payload.data.customerId;
                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId: customerId
                            }
                        });

                        if(user){
                            await updateUserTier(user.id,"PRO","ACTIVE",payload.data.id)
                        }
                        //
                    },
                    onSubscriptionCanceled: async (payload) => {
                        const customerId = payload.data.customerId;

                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId: customerId
                            }
                        });

                        if(user){
                            await updateUserTier(user.id,user.subscriptionTier as any,"CANCELED")
                        }
                    },
                    onSubscriptionRevoked: async (payload) => {
                        const customerId = payload.data.customerId;

                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId: customerId
                            }
                        });

                        if(user){
                            await updateUserTier(user.id,"FREE","EXPIRED")
                        }
                    },
                    onOrderPaid: async () => {},
                    onCustomerCreated: async (payload) => {
                        const user = await prisma.user.findUnique({
                            where:{
                                email:payload.data.email
                            }
                        });

                        if(user){
                            await updatePolarCustomerId(user.id,payload.data.id)
                        }
                    }


                })
            ],
        })
    ]
});

