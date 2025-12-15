"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search } from "lucide-react";
import { useRepositories } from "@/module/repository/hooks/use-repo";
import { Badge } from "@/components/ui/badge";
import { RepositoryListSkeleton } from "@/module/repository/components/repo-skeleton";
import { useRef } from "react";
import { useConnectRepository } from "@/module/repository/hooks/use-connect-repo";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  isConnected?: boolean;
}

const RepositoryPage = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();

  const {mutate:connectRepo} = useConnectRepository();

  const [searchQuery, setSearchQuery] = useState("");
  const [localConnectingId, setLocalConnectingId] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const observer = new IntersectionObserver(
        (entries) => {
            if(entries[0].isIntersecting && hasNextPage && !isFetchingNextPage){
                fetchNextPage()
            }
        },
        {
            threshold:0.1
        }
    )

    const currentTarget = observerTarget.current
    if(currentTarget){
        observer.observe(currentTarget)
    }

    return () => {
        if(currentTarget){
            observer.unobserve(currentTarget)
        }
    }
  },[hasNextPage,isFetchingNextPage,fetchNextPage])

  if(isLoading){
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
                <p className="text-muted-foreground">Manage and view all your Github Repositories</p>
            </div>
            <RepositoryListSkeleton/>
        </div>
    )
  }

  if (isError) return <div>Failed to load repositories.</div>;

  // Deduplicate repositories by id to prevent duplicate keys
  const allRepositoriesMap = new Map<number, Repository>();
  data?.pages.flatMap((page) => page).forEach((repo) => {
    if (!allRepositoriesMap.has(repo.id)) {
      allRepositoriesMap.set(repo.id, repo);
    }
  });
  const allRepositories: Repository[] = Array.from(allRepositoriesMap.values());

  const q = searchQuery.toLowerCase();

  const filteredRepositories = allRepositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(q) ||
      repo.full_name.toLowerCase().includes(q)
  );

  const handleConnect = async (repo: Repository) => {
   
      setLocalConnectingId(repo.id);

      connectRepo({
        owner:repo.full_name.split("/")[0],
        repo:repo.name,
        githubId:repo.id
      },
        {
          onSettled:()=>setLocalConnectingId(null)
        }
      )
      
  };

  

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredRepositories.map((repo) => (
          <Card
            key={repo.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {repo.name}
                    </CardTitle>
                    <Badge variant="outline">
                      {repo.language ?? "Unknown"}
                    </Badge>
                    {repo.isConnected && (
                      <Badge variant="secondary">Connected</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {repo.description ?? "No description"}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>

                  <Button
                    onClick={() => handleConnect(repo)}
                    disabled={
                      localConnectingId === repo.id ||
                      repo.isConnected
                    }
                    variant={repo.isConnected ? "outline" : "default"}
                  >
                    {localConnectingId === repo.id
                      ? "Connecting..."
                      : repo.isConnected
                      ? "Connected"
                      : "Connect"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div ref={observerTarget} className="py-4">
        {isFetchingNextPage && <RepositoryListSkeleton/>}
        {
            !hasNextPage && allRepositories.length > 0 && (
                <p className="text-center text-muted-foreground">
                    No more repositories
                </p>

            )
        }
      </div>
    </div>
  );
};

export default RepositoryPage;
