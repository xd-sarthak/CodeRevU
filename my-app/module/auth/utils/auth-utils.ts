// Authentication utility functions for server-side auth checks
// requireAuth: Ensures user is authenticated, redirects to login if not
// requireUnAuth: Ensures user is not authenticated, redirects to home if logged in
// Used in page components and API routes to protect resources

"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

export const requireAuth = async () => {
    await connection()
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/login")
    }

    return session
}

export const requireUnAuth = async () => {
    await connection()
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        redirect("/")
    }

    return session
}