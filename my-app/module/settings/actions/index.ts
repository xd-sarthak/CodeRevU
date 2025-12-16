"use server"
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { success } from "zod";

// Action to fetch user profile
export async function getUserProfile(){
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select:{
                id:true,
                name:true,
                email:true,
                image:true,
                createdAt:true
            }
        });

        return user;
    } catch (error) {
        console.error("error fetching user profile: ",error);
        throw new Error("Failed to fetch user profile");
    }
}

//update user profile
export async function updateUserProfile(data:{name?:string; email?:string}){
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if(!session?.user){
            throw new Error("Unauthorized");
        }

        const updateUser = await prisma.user.update({
            where:{
                id:session.user.id
            },
            data:{
               name:data.name,
               email:data.email 
            },
            select:{
                id:true,
                name:true,
                email:true
            }
        });

        revalidatePath("/dashboard/settings","page");

        return {
            success:true,
            user:updateUser
        }
    } catch (error) {
        console.error("error updating user profile: ",error);
        throw new Error("Failed to update user profile");
    }
}