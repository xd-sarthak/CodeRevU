"use server";

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createWebHook,
  getRepositories,
} from "@/module/github/lib/github";

/**
 * Fetches all GitHub repositories for the authenticated user
 * and annotates them with connection status.
 */
export const fetchRepositories = async (
  page: number = 1,
  perPage: number = 10
) => {
  // Authenticate request using server-side headers
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Hard security boundary: unauthenticated users get nothing
  if (!session) {
    throw new Error("Unauthorised");
  }

  // Fetch repositories directly from GitHub API
  const githubRepos = await getRepositories(page, perPage);

  // Fetch repositories already connected in CodeRevU
  const dbRepos = await prisma.repository.findMany({
    where: {
      userId: session.user.id,
    },
  });

  // Create a fast lookup set of connected GitHub repo IDs
  // BigInt is required because GitHub IDs exceed JS safe integer limits
  const connectedRepoIds = new Set(
    dbRepos.map((repo) => repo.githubId)
  );

  // Merge GitHub repo data with connection status
  return githubRepos.map((repo: any) => ({
    ...repo,
    isConnected: connectedRepoIds.has(BigInt(repo.id)),
  }));
};

/**
 * Connects a GitHub repository to CodeRevU.
 * 1. Authenticate user
 * 2. Create GitHub webhook (GitHub → CodeRevU)
 * 3. Persist repo connection in database
 * 4. Trigger async indexing pipeline (RAG)
 */
export const connectRepository = async (
  owner: string,
  repo: string,
  githubId: number
) => {
  // Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorised");
  }

  // TODO:
  // Rate limiting should be enforced here:


  // Create webhook so GitHub can notify us about PRs/events
  const webhook = await createWebHook(owner, repo);

  // Only persist repo if webhook creation succeeded
  if (webhook) {
    await prisma.repository.create({
      data: {
        // GitHub IDs must be stored as BigInt to preserve precision
        githubId: BigInt(githubId),
        name: repo,
        owner,
        fullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        userId: session.user.id,
      },
    });
  }

  // TODO:
  // Increment user's connected repo count

  /**
   * Trigger repository indexing asynchronously.
   *
   * First principles:
   * - Indexing is slow (API calls, embeddings, vector DB writes)
   * - Users should not wait for it
   * - Failures should not block repo connection
   *
   * This is "fire-and-forget" via Inngest.
   */
  try {
    await inngest.send({
      name: "repository.connected",
      data: {
        owner,
        repo,
        userId: session.user.id,
      },
    });
  } catch (error) {
    // Indexing failure should not break core functionality
    console.error(
      "Failed to trigger repository indexing: ",
      error
    );
  }

  // Return webhook metadata to caller
  return webhook;
};
