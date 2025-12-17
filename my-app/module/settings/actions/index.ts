"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteWebHook } from "@/module/github/lib/github";

/**
 * Fetches the currently authenticated user's profile.
 */
export async function getUserProfile() {
  try {
    // Authenticate request using request headers (server-only)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // No session or malformed session → access denied
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Fetch minimal user data needed by the UI
    // (never expose internal fields by default)
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("error fetching user profile: ", error);
    throw new Error("Failed to fetch user profile");
  }
}

/**
 * Updates the authenticated user's profile.
 */
export async function updateUserProfile(data: {
  name?: string;
  email?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Update only allowed fields
    // Prisma enforces row-level ownership via user ID
    const updateUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: data.name,
        email: data.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Force Next.js to re-render stale cached pages
    revalidatePath("/dashboard/settings", "page");

    return {
      success: true,
      user: updateUser,
    };
  } catch (error) {
    console.error("error updating user profile: ", error);
    throw new Error("Failed to update user profile");
  }
}

/**
 * Fetches all repositories connected by the current user.
 */
export async function getConnectedRepositories() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Fetch repos explicitly connected by this user
    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        url: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return repositories;
  } catch (error) {
    // Read operations fail-soft to avoid breaking the UI
    console.error("error fetching connected repositories: ", error);
    return [];
  }
}

/**
 * Disconnects a single repository from CodeRevU.
 */
export async function disconnectRepository(repositoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Verify ownership before deletion
    const repository = await prisma.repository.findUnique({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    if (!repository) {
      throw new Error("Repository not found");
    }

    // Remove GitHub → CodeRevU integration
    await deleteWebHook(repository.owner, repository.name);

    // Remove local representation
    await prisma.repository.delete({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    // Revalidate affected UI routes
    revalidatePath("/dashboard/settiings", "page"); // ❌ typo
    revalidatePath("/dashboard/repository", "page");

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting repository: ", error);
    return { success: false, error: "Failed to disconnect repository" };
  }
}

/**
 * Disconnects ALL repositories for the authenticated user.
 */
export async function disconnectAllRepository() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Fetch all connected repos for this user
    const repository = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Remove all GitHub webhooks concurrently
    await Promise.all(
      repository.map(async (repo) => {
        await deleteWebHook(repo.owner, repo.name);
      })
    );

    // Remove all repository records in one operation
    const result = await prisma.repository.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // Revalidate UI
    revalidatePath("/dashboard/settiings", "page"); // ❌ typo
    revalidatePath("/dashboard/repository", "page");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error disconnecting all repositories: ", error);
    return {
      success: false,
      error: "Failed to disconnect repositories",
    };
  }
}
