# CodeRevU 🤖

**AI-Powered Code Review Assistant for GitHub**

CodeRevU is an intelligent, automated code review platform that seamlessly integrates into your GitHub workflow. Powered by **Google Gemini AI** and **RAG (Retrieval-Augmented Generation)**, it provides deep, context-aware analysis of your Pull Requests, helping teams maintain high code quality with zero friction.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

---

## 📸 Screenshots

### Dashboard
![Dashboard Overview](./screenshots/dashboard-1.png)
*Track your repositories, commits, pull requests, and AI-generated reviews at a glance*

![Dashboard Analytics](./screenshots/dashboard-2.png)
*Visualize your contribution activity and monthly coding trends*

### Repository Management
![Repository Page](./screenshots/repository.png)
*Connect GitHub repositories with one click and manage webhook integrations*

### Subscription & Billing
![Subscription Page](./screenshots/subscription.png)
*Flexible pricing tiers powered by Polar.sh with usage tracking*

### Settings
![Settings Page](./screenshots/settings.png)
*Manage your account, connected repositories, and preferences*

### AI Code Reviews
![Review Page](./screenshots/review.png)
*View detailed AI-generated code reviews with file-by-file analysis, suggestions, and quality ratings*

---

## 🚀 Key Features

- **🔐 GitHub OAuth Integration**: One-click authentication and repository connection
- **🤖 Automated AI Reviews**: Listens for PR events via webhooks and automatically posts detailed, constructive code reviews
- **🧠 Context-Aware (RAG)**: Indexes your entire repository using vector embeddings to understand the broader context of changes, not just the diff
- **📊 Dashboard & Analytics**: Track review history, repository stats, contribution graphs, and monthly activity
- **💳 Subscription Management**: Tiered pricing with usage limits (Free, Pro) powered by Polar.sh
- **🔒 Secure & Scalable**: Built with webhook signature validation, environment variable validation, and proper authentication/authorization
- **⚡ Background Processing**: Durable workflow execution with Inngest for reliable, long-running AI tasks

---

## 🏗️ System Architecture

CodeRevU uses an **event-driven architecture** to handle asynchronous AI tasks reliably and scale efficiently.

```mermaid
graph TD
    classDef user fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef app fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef job fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef ext fill:#eceff1,stroke:#37474f,stroke-width:2px,stroke-dasharray:5 5;

    User([Developer]):::user
    GitHub([GitHub]):::ext
    Gemini([Google Gemini AI]):::ext
    Polar([Polar.sh]):::ext

    subgraph "CodeRevU Platform"
        WebApp[Next.js App Router<br/>Server Actions + API Routes]:::app
        DB[(PostgreSQL<br/>Prisma ORM)]:::data
        VectorDB[(Pinecone<br/>Vector Embeddings)]:::data
        
        subgraph "Background Workers - Inngest"
            Indexer[Repository Indexing<br/>Worker]:::job
            Reviewer[AI Review Generation<br/>Worker]:::job
        end
    end

    User -->|1. Authenticate| WebApp
    WebApp -->|OAuth| GitHub
    
    User -->|2. Connect Repo| WebApp
    WebApp -->|Create Webhook| GitHub
    WebApp -->|Trigger Event| Indexer
    Indexer -->|Fetch Code| GitHub
    Indexer -->|Generate Embeddings| Gemini
    Indexer -->|Store Vectors| VectorDB
    
    GitHub -->|3. PR Webhook| WebApp
    WebApp -->|Trigger Event| Reviewer
    Reviewer -->|Retrieve Context| VectorDB
    Reviewer -->|Fetch PR Diff| GitHub
    Reviewer -->|Generate Review| Gemini
    Reviewer -->|Post Comment| GitHub
    Reviewer -->|Save Review| DB
    
    User -->|4. Subscribe| WebApp
    WebApp -->|Checkout| Polar
    Polar -->|Webhook| WebApp
    WebApp -->|Update Tier| DB
```

### Architecture Flow

1. **Authentication**: Users authenticate via GitHub OAuth, granting repository access
2. **Repository Connection**: Users connect repositories, triggering webhook creation and background indexing
3. **PR Review**: When a PR is opened/updated, GitHub sends a webhook → Inngest worker fetches context from Pinecone → Gemini generates review → Posted as PR comment
4. **Subscription**: Users can upgrade to Pro tier via Polar.sh for higher limits

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 16** (App Router) - React framework with server-side rendering
- **React 19** - UI library with latest concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Radix UI components with beautiful defaults
- **TanStack Query** - Data fetching and caching
- **Recharts** - Data visualization for analytics

### **Backend**
- **Next.js Server Actions** - Type-safe server-side mutations
- **Next.js API Routes** - RESTful endpoints for webhooks
- **Prisma 7** - Type-safe ORM with PostgreSQL adapter
- **Better Auth** - Modern authentication with GitHub OAuth
- **Zod** - Runtime type validation

### **AI & Vector Database**
- **Google Gemini 2.5 Flash** - Large language model for code review generation
- **Pinecone** - Vector database for semantic code search (RAG)
- **Vercel AI SDK** - Unified interface for AI model interactions

### **Background Jobs**
- **Inngest** - Durable workflow execution with retries, concurrency control, and observability

### **Payments**
- **Polar.sh** - Developer-first payment platform with subscription management

### **Infrastructure**
- **PostgreSQL** - Relational database for user data, repositories, and reviews
- **Vercel** (recommended) - Deployment platform with edge functions
- **ngrok** (development) - Local webhook testing

---

### **Solution**
CodeRevU combines **AI-powered analysis** with **RAG (Retrieval-Augmented Generation)** to provide context-aware code reviews that understand your entire codebase, not just the diff.

### **Key Technical Challenges Solved**

1. **Long-Running AI Tasks**: AI review generation can take 30-60 seconds, exceeding serverless function timeouts
   - **Solution**: Inngest for durable workflow execution with automatic retries

2. **Context Awareness**: LLMs reviewing only the diff miss important context
   - **Solution**: RAG pipeline that embeds entire codebase into Pinecone and retrieves relevant context

3. **GitHub API Rate Limits**: Recursive file fetching can exhaust rate limits
   - **Solution**: Inngest concurrency controls and efficient batching

4. **Webhook Security**: Webhooks must be validated to prevent spoofing
   - **Solution**: HMAC-SHA256 signature verification with timing-safe comparison

5. **Multi-Tenant Architecture**: Single webhook secret for all users
   - **Solution**: Programmatic webhook creation via GitHub API with server-managed secret

---

## 📁 Project Structure

```
CodeRevU/
├── my-app/                          # Main Next.js application
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth route group (login, signup)
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/[...all]/       # Better Auth endpoints
│   │   │   ├── inngest/             # Inngest webhook endpoint
│   │   │   └── webhooks/github/     # GitHub webhook handler
│   │   ├── dashboard/               # Dashboard pages
│   │   ├── layout.tsx               # Root layout with providers
│   │   └── page.tsx                 # Landing page
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── providers/               # Context providers (Query, Theme)
│   │   └── app-sidebar.tsx          # Main navigation sidebar
│   │
│   ├── module/                      # Feature modules (domain-driven design)
│   │   ├── ai/                      # AI review logic
│   │   │   ├── actions/             # Server actions (reviewPullRequest)
│   │   │   └── lib/                 # RAG implementation
│   │   ├── auth/                    # Authentication utilities
│   │   ├── dashboard/               # Dashboard data fetching
│   │   ├── github/                  # GitHub API integration
│   │   │   └── lib/github.ts        # Octokit wrapper (repos, webhooks, PRs)
│   │   ├── payment/                 # Subscription management
│   │   │   ├── actions/             # Checkout actions
│   │   │   ├── config/              # Polar.sh client
│   │   │   └── lib/subscription.ts  # Tier limits and usage tracking
│   │   ├── repository/              # Repository connection logic
│   │   │   ├── actions/             # Connect/disconnect actions
│   │   │   └── hooks/               # React hooks for repo state
│   │   ├── review/                  # Review history
│   │   └── settings/                # User settings
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── auth.ts                  # Better Auth configuration
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── env.ts                   # Environment variable validation (Zod)
│   │   ├── pinecone.ts              # Pinecone client
│   │   ├── utils.ts                 # Helper functions (cn, etc.)
│   │   └── webhook-security.ts      # HMAC signature verification
│   │
│   ├── inngest/                     # Background job definitions
│   │   ├── client.ts                # Inngest client configuration
│   │   └── functions/               # Inngest functions
│   │       ├── index.ts             # Function registry
│   │       └── review.ts            # PR review generation worker
│   │
│   ├── prisma/                      # Database schema and migrations
│   │   └── schema.prisma            # Prisma schema (User, Repository, Review, etc.)
│   │
│   ├── public/                      # Static assets
│   ├── .env                         # Environment variables (gitignored)
│   ├── .env.example                 # Environment template
│   ├── next.config.ts               # Next.js configuration
│   ├── tailwind.config.ts           # Tailwind configuration
│   └── tsconfig.json                # TypeScript configuration
│
├── CODE_REVIEW_CHECKLIST.md        # Code review guidelines for team
└── README.md                        # This file
```

## ⚡ Getting Started

### **Prerequisites**
- **Node.js 18+** (or Bun)
- **PostgreSQL** database
- **GitHub OAuth App** ([Create one](https://github.com/settings/developers))
- **Pinecone Account** ([Sign up](https://www.pinecone.io/))
- **Google AI API Key** ([Get key](https://ai.google.dev/))
- **Polar.sh Account** (optional, for payments)

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/CodeRevU.git
cd CodeRevU/my-app
```

### **2. Install Dependencies**
```bash
npm install
# or
bun install
```

### **3. Configure Environment Variables**

Create a `.env` file in the `my-app` directory (use `.env.example` as template):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coderevu"

# GitHub OAuth & Webhooks
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_WEBHOOK_SECRET="generate_with_openssl_rand_hex_32"

# Application URLs
APP_BASE_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000/api/auth"
BETTER_AUTH_SECRET="generate_with_openssl_rand_hex_32"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000/api/auth"

# AI & Vector Database
GOOGLE_GENERATIVE_AI_API_KEY="your_google_ai_key"
PINECONE_API_KEY="your_pinecone_key"
PINECONE_INDEX_NAME="coderevu"

# Inngest (optional in dev)
INNGEST_EVENT_KEY="your_inngest_event_key"
INNGEST_SIGNING_KEY="your_inngest_signing_key"

# Polar.sh (optional)
POLAR_ACCESS_TOKEN="your_polar_token"
POLAR_WEBHOOK_SECRET="your_polar_webhook_secret"
POLAR_SUCCESS_URL="http://localhost:3000/dashboard/subscriptions?success=true"
```

**Generate secrets**:
```bash
openssl rand -hex 32  # For GITHUB_WEBHOOK_SECRET
openssl rand -hex 32  # For BETTER_AUTH_SECRET
```

### **4. Setup Database**
```bash
npx prisma migrate dev
npx prisma generate
```

### **5. Setup Pinecone Index**
Create a Pinecone index with:
- **Dimensions**: 768 (for Google text-embedding-004)
- **Metric**: Cosine similarity
- **Name**: `coderevu` (or match your `PINECONE_INDEX_NAME`)

### **6. Run Development Server**

**Option A: Simple (Next.js only)**
```bash
npm run dev
```

**Option B: Full Stack (Next.js + Inngest Dev Server)**
```bash
npm run dev:all  # Uses mprocs to run both
```

Or manually in separate terminals:
```bash
# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli@latest dev
```

### **7. Setup ngrok (for webhook testing)**
```bash
ngrok http 3000
```

Update `APP_BASE_URL` in `.env` with your ngrok URL.

### **8. Open the Application**
Visit `http://localhost:3000` and sign in with GitHub!

---

## 🔒 Security Features

- ✅ **Webhook Signature Validation**: HMAC-SHA256 verification with timing-safe comparison
- ✅ **Environment Variable Validation**: Zod schema validation on startup
- ✅ **SQL Injection Prevention**: Prisma ORM with parameterized queries
- ✅ **Authentication**: Better Auth with secure session management
- ✅ **Authorization**: User-scoped data access in all server actions
- ✅ **Secret Management**: No secrets in code, all in environment variables
- ✅ **CORS Protection**: Trusted origins configuration

---

## 🚀 Deployment

### **Recommended: Vercel**

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!



