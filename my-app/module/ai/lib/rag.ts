import { pineconeIndex } from "@/lib/pinecone";
import {embed} from "ai";
import {google} from "@ai-sdk/google"
import { metadata } from "@/app/layout";

//text -> embebdding -> vector database

export async function generateEmbedding(text:string){
    const {embedding} = await embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value:text
    });

    return embedding;
}

//indexes codebase into pinecone and generate vectors
export async function indexCodebase(repoId:string,files:{path:string,content:string}[]){
    const vectors = [];
    //chunking
    for(const file of files){
        const content = `File: ${file.path}\n\n${file.content}`;
        const truncatedContent = content.slice(0,8000); //to avoid token limit

        try {
            const embedding = await generateEmbedding(truncatedContent);
            vectors.push({
                id: `${repoId}-${file.path.replace(/\//g,"_")}`,
                values: embedding,
                //will retrieve using metadata filter
                metadata:{
                    repoId,
                    path:file.path,
                    content:truncatedContent
                }
            })
        } catch (error) {
            console.error(`failed to embed ${file.path}`,error);
            
        }
    }
    //upsert if atleast one vector generated
    if(vectors.length > 0){
        const batchSize = 100; //batching helps in ratelimits 

        for(let i=0; i<vectors.length; i+=batchSize){
            const batch = vectors.slice(i,i+batchSize);
            await pineconeIndex.upsert(batch);
        }
    }

    console.log("indexing complete"); 
}


//retrieves relevant context from pinecone
//query -> embedding -> vector similarity search -> topK file snippets
export async function retrieveContext(query:string,repoId:string,topK:number =5){
    const embedding = await generateEmbedding(query);

    const results = await pineconeIndex.query({
        vector:embedding,
        topK,
        filter:{
            repoId
        },
        includeMetadata:true
    });

    // Extract only the embedded content from metadata
    // Defensive filter removes null/undefined cases
    return results.matches.map(match => match.metadata?.content as string).filter(Boolean);
}