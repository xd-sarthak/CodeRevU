"use server"
import { fetchUserContribution,getGithubToken } from "@/module/github/lib/github"
import {auth} from "@/lib/auth"
import { headers } from "next/headers"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

export async function getDashboardStats(){
    
}