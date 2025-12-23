# CodeRevU

**CodeRevU** is an intelligent, automated code review assistant that integrates seamlessly into your GitHub workflow. Powered by **Google Gemini** and **Inngest**, it provides deep, context-aware analysis of your Pull Requests, helping teams maintain high code quality with zero friction.

![System Architecture](my-app/public/system-architecture.png)

## 🚀 Key Features

- **GitHub Integrated**: One-click login and repository connection via GitHub OAuth.
- **Automated AI Reviews**: Listens for PR events and automatically posts detailed, constructive code reviews.
- **Context-Aware (RAG)**: Indexes your entire repository to understand the broader context of changes, not just the diff.
- **Dashboard & Analytics**: Track review history, repository stats, and contribution graphs in a unified dashboard.
- **Secure & Scalable**: Built on Next.js 16 and Inngest for reliable background processing.

---

## 🏗️ Architecture

CodeRevU relies on an event-driven architecture to handle asynchronous AI tasks reliably.

```mermaid
graph TD
    classDef user fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef app fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef job fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef ext fill:#eceff1,stroke:#37474f,stroke-width:2px,stroke-dasharray:5 5;

    User([User / Developer]):::user
    GitHub([GitHub Platform]):::ext
    Gemini([Google Gemini]):::ext

    subgraph "CodeRevU Platform"
        WebApp[Next.js App / API]:::app
        DB[(PostgreSQL)]:::data
        VectorDB[(Pinecone)]:::data
        
        subgraph "Background Workers (Inngest)"
            Indexer[Repo Indexing Worker]:::job
            Reviewer[Review Generation Worker]:::job
        end
    end

    User -->|"Open PR"| GitHub
    GitHub -->|"Webhook (pull_request)"| WebApp
    
    WebApp -->|"Trigger Event"| Reviewer
    Reviewer -->|"Fetch Context"| VectorDB
    Reviewer -->|"Generate Review"| Gemini
    Reviewer -->|"Post Comment"| GitHub
    
    User -->|"Connect Repo"| WebApp
    WebApp -->|"Trigger Event"| Indexer
    Indexer -->|"Crawl & Embed"| VectorDB
```

---

## 🛠️ Technology Decisions

We chose a modern, type-safe, and scalable stack to ensure reliability and developer experience.

### **Next.js 16 (App Router)**
*   **Why?** Provides a unified framework for both the frontend UI and backend API routes. The App Router and Server Actions allow us to write secure, server-side logic close to our UI components without full boilerplate of a separate backend service.

### **Inngest**
*   **Why?** AI tasks (indexing repos, generating reviews) are long-running and prone to timeouts on standard serverless functions. Inngest provides durable workflow execution, automatic retries, and flow control (concurrency limits) to handle GitHub API rate limits gracefully.

### **Prisma & PostgreSQL**
*   **Why?** CodeRevU deals with relational data: Users manage multiple Repositories, which have multiple Reviews. SQL is the natural fit, and Prisma offers best-in-class TypeScript safety, making database interactions intuitive and error-resistant.

### **Google Gemini + Pinecone (RAG)**
*   **Why?** Standard LLM reviews often lack context. By embedding the codebase into **Pinecone** and retrieving relevant snippets for **Gemini** (which has a large context window), we significantly reduce hallucinations and specific "blind spots" in reviews.

---

## ⚡ Installation & Usage

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- GitHub OAuth App (Client ID & Secret)
- Pinecone Account
- Google AI API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/coderevu.git
cd coderevu/my-app
```

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Configure Environment
Create a `.env` file in the `my-app` directory:
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/coderevu"

# Auth (Better Auth + GitHub)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000/api/auth"

# AI & Vector DB
PINECONE_API_KEY="your_pinecone_key"
# Google AI keys are managed via AI SDK, typically GOOGLE_API_KEY
```

### 4. Setup Database
```bash
npx prisma migrate dev
```

### 5. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to start using CodeRevU.

---

## 📝 License
This project is proprietary and all rights are reserved.
