## 1. Project Overview

CodeRevU is a GitHub‑integrated AI code review assistant built on Next.js, Inngest, Prisma, and Pinecone.  
It listens to pull request events from connected GitHub repositories, retrieves the diff and relevant code context, and generates detailed AI reviews posted back to GitHub and stored in a local database.  
The project is aimed at individual developers and teams who want automated, consistent PR reviews tightly integrated into their existing GitHub workflows, while also exposing dashboards and history views inside a web UI.

---

## 2. Key Features

- **✅ GitHub OAuth login**
  - GitHub social login via Better Auth with `repo` scope.
  - Session and account management stored in PostgreSQL.

- **✅ GitHub repository browsing & connection**
  - Fetches the authenticated user’s repositories via GitHub API.
  - UI for searching and connecting repositories.
  - Creates GitHub webhooks for `pull_request` events.
  - Persists connected repositories in the `Repository` table.

- **✅ Webhook-based PR event handling**
  - `/api/webhooks/github` accepts GitHub webhook events.
  - Handles `ping` and `pull_request` (`opened`, `synchronize`) events.
  - For relevant PR events, queues a review via server action.

- **✅ Background processing with Inngest**
  - Inngest client and Next.js handler at `/api/inngest`.
  - `repository.connected` event → full repository indexing into Pinecone.
  - `pr.review.requested` event → AI review generation and persistence.
  - Concurrency control on review generation.

- **✅ RAG (Retrieval-Augmented Generation) over repository code**
  - Recursive GitHub repo crawl to fetch all code files.
  - Text embedding with Google `text-embedding-004` via `ai` SDK.
  - Vector storage and similarity search in Pinecone.
  - Review generation uses context retrieved by semantic search.

- **✅ AI review generation and GitHub commenting**
  - Uses Google `gemini-2.5-flash` to generate markdown reviews.
  - Rich prompt includes PR title, description, diff, and retrieved context.
  - Posts a formatted comment back to the PR via GitHub Issues API.
  - Stores review metadata and content in the database.

- **✅ Review history UI**
  - Dashboard page for listing previous AI reviews tied to connected repos.
  - Status badges (`completed`, `failed`, `pending`), timestamps, and preview snippets.
  - Links back to GitHub PRs.

- **✅ Dashboard & activity analytics**
  - GitHub contribution graph (via GraphQL).
  - Aggregated stats (commits, PRs, reviews, total repos).
  - Monthly activity breakdown (commits, PRs, reviews) visualization.

- **✅ Settings & profile management**
  - User profile read/update (name, email).
  - List of connected repositories.
  - Disconnect single or all repositories (including webhook teardown).

- **🧩 Partially implemented / stubbed**
  - Dashboard stats and monthly activity:
    - Some metrics are hardcoded or based on sample data (e.g., totalRepos, review counts).
  - Review status semantics:
    - Schema supports `completed | failed | pending`, but some paths use inconsistent status strings (`Failed` vs `failed`).
  - UI copy/metadata:
    - App metadata (`title`, `description`) still at `create-next-app` defaults.

- **🚧 Planned / extensible (inferred from TODOs and structure)**
  - Proper rate limiting around repository connection and indexing.
  - Accurate dashboard metrics based on real DB data (connected repos, AI reviews).
  - Real review activity aggregation from DB instead of synthetic sample data.
  - Better error surfacing and UX for failed indexing or review generation.

---

## 3. Tech Stack

### Frontend

- **Next.js 16 (App Router)**
  - File-based routing (`app/`), server components, and route handlers.
  - Server Actions (`"use server"`) used for most application logic.
- **React 19**
  - Client components for dashboards, repository and review UIs.
- **TypeScript**
  - Strong typing across server actions, hooks, and components.
- **UI / Styling**
  - **Tailwind CSS 4** + custom `globals.css`.
  - **Radix UI** primitives and shadcn-style wrapper components in `components/ui`.
  - **Recharts** for charts and monthly activity.
  - **lucide-react** icons.
  - **sonner** for toast notifications.
  - **next-themes** for dark/light theme handling.

### Backend

- **Next.js Route Handlers**
  - `/api/auth/[...all]` (Better Auth handler).
  - `/api/webhooks/github` (GitHub webhook intake).
  - `/api/inngest` (Inngest event handler).
- **Next.js Server Actions**
  - `module/*/actions` provide most domain logic:
    - Repositories (`fetchRepositories`, `connectRepository`).
    - Reviews (`getReviews`).
    - Dashboard (`getContributionStats`, `getDashboardStats`, `getMonthlyActivity`).
    - Settings (`getUserProfile`, `updateUserProfile`, `getConnectedRepositories`, `disconnectRepository`, `disconnectAllRepository`).

### Database

- **PostgreSQL**
  - Single Prisma datasource configured with `provider = "postgresql"`.
- **Prisma**
  - Custom generator output into `lib/generated/prisma`.
  - Models: `User`, `Account`, `Session`, `Verification`, `Repository`, `Review`, `Test`.
  - Prisma client configured with `@prisma/adapter-pg` and `DATABASE_URL`.
  - Migrations managed via `prisma.config.ts`.

### Authentication

- **Better Auth**
  - Database adapter: Prisma (`prismaAdapter` with `provider: "postgresql"`).
  - Social provider: GitHub
    - `clientId` / `clientSecret` from environment.
    - Scope: `["repo"]` (full repo access).
  - Server-side helpers: `auth.api.getSession()` used to guard server actions and routes.
  - Client-side hooks & methods via `createAuthClient` (`signIn`, `useSession`, `signOut`).

### Background Jobs / Queues

- **Inngest**
  - Inngest client with `id: "my-app"`.
  - Next.js handler at `/api/inngest` via `serve`.
  - Functions:
    - `helloWorld` – test function for `test/hello.world` events.
    - `indexRepo` – reacts to `repository.connected` to index code into Pinecone.
    - `generateReview` – reacts to `pr.review.requested` to generate and store reviews.

### AI / LLM Providers

- **Vercel `ai` SDK**
  - `generateText` and `embed` building blocks.
- **@ai-sdk/google**
  - Text model: `google("gemini-2.5-flash")` for review generation.
  - Embedding model: `google.textEmbeddingModel("text-embedding-004")` for code embeddings.
- **Pinecone**
  - Vector DB for storing code embeddings per repository.
  - Semantic search (`query`) used to retrieve relevant code snippets for the AI review.

### DevOps / Tooling

- **Package manager compatibility**
  - `package.json` + `bun.lock` (Bun supported; npm/yarn/pnpm also usable).
- **Linting**
  - `eslint` + `eslint-config-next`.
- **Type checking / build**
  - TypeScript 5.x.
- **Styling tooling**
  - Tailwind CSS 4 with `@tailwindcss/postcss`.

---

## 4. System Architecture

### High-level

- **Web App (Next.js)**
  - Handles auth, dashboards, repository connection, and viewing history.
  - Invokes server actions for all sensitive or stateful operations.
- **GitHub**
  - OAuth provider for login.
  - REST and GraphQL APIs for repositories, PRs, and contributions.
  - Webhooks to notify CodeRevU of PR events.
- **Background Processing (Inngest)**
  - Orchestrates long-running tasks:
    - Repository indexing.
    - Review generation.
- **AI Layer**
  - Google Gemini models via `ai` SDK for both embeddings and review generation.
  - Pinecone for code context storage and retrieval.
- **Database (PostgreSQL + Prisma)**
  - Persists users, sessions, accounts, repositories, and reviews.

### Component Interactions

- **Auth → API**
  - Better Auth uses Prisma to store users, sessions, accounts.
  - Server actions and route handlers use `auth.api.getSession()` for auth checks.
- **API → Jobs**
  - Repository connection actions send `repository.connected` events to Inngest.
  - PR review actions send `pr.review.requested` events to Inngest.
- **Jobs → AI → DB**
  - Inngest functions call GitHub APIs to fetch data, call AI models, and persist results in PostgreSQL.
- **GitHub Webhooks → API → Jobs**
  - GitHub sends POST to `/api/webhooks/github`.
  - The handler decides whether to enqueue a review via server action → Inngest.

### ASCII Architecture Diagram

```text
+-----------+        OAuth         +-----------+
|  Browser  | <------------------> |  GitHub   |
+-----+-----+                      +-----+-----+
      |                                   ^
      | HTTP (Next.js pages, actions)     |
      v                                   |
+-----+-----------------------------------+--------+
|               Next.js App (App Router)          |
|                                                 |
|  - Auth routes (/api/auth) via Better Auth      |
|  - Webhooks (/api/webhooks/github)             |
|  - Inngest handler (/api/inngest)              |
|  - Server Actions (repos, reviews, settings)   |
+-----+----------------------+-------------------+
      |                      |
      | Prisma               | Inngest events
      v                      v
+-----+--------+      +------+-------------------+
|  PostgreSQL  |      |         Inngest          |
| (Prisma ORM) |      |  - repository.connected  |
+-----+--------+      |  - pr.review.requested   |
      ^               +------+-------------------+
      |                      |
      | Reviews, repos       | GitHub & AI calls
      |                      v
      |          +-----------+---------+
      |          |   GitHub API        |
      |          |  (REST & GraphQL)   |
      |          +-----------+---------+
      |                      |
      |              Code + PR diff
      |                      v
      |          +-----------+---------+
      |          |  AI + RAG Layer    |
      |          |  (Gemini + Pinecone|
      |          +--------------------+
```

---

graph TD
    %% Styles
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef api fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef async fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef ext fill:#eceff1,stroke:#37474f,stroke-width:2px,stroke-dasharray:5 5;

    %% Client
    Browser[Browser / User]:::client

    %% Sync API Layer
    subgraph "Synchronous API Layer (Next.js App Router)"
        UI[React Server Components]:::api
        Actions[Server Actions]:::api
        Auth[Auth Routes<br/>/api/auth]:::api
        Webhooks[GitHub Webhooks<br/>/api/webhooks]:::api
        InngestAPI[Inngest Ingest Endpoint<br/>/api/inngest]:::api
    end

    %% Async Execution
    subgraph "Async Event & Execution Layer"
        Inngest[Inngest Cloud<br/>Event Bus + Scheduler]:::async
        Workers[Stateless Worker Functions<br/>(Serverless Execution)]:::async
    end

    %% Data
    subgraph "Persistence & Intelligence"
        DB[(PostgreSQL<br/>Prisma ORM)]:::data
        Vector[(Pinecone<br/>Vector Store)]:::data
    end

    %% External
    GitHub[GitHub API & Webhooks]:::ext
    Gemini[Gemini LLM]:::ext

    %% Flows
    Browser --> UI
    UI --> Actions
    Browser --> Auth

    Actions --> DB
    Auth --> DB

    Webhooks --> Inngest
    Actions --> Inngest

    Inngest --> InngestAPI
    InngestAPI --> Workers

    Workers --> GitHub
    Workers --> Gemini
    Workers --> Vector
    Workers --> DB
    Workers --> GitHub

    Auth <-- OAuth --> GitHub


## 5. Core Workflows

### 5.1 User authentication & GitHub account linking

1. User navigates to `/login`.
2. `LoginUI` renders a GitHub login button wired to `signIn.social({ provider: 'github' })` from `better-auth/react`.
3. Better Auth redirects the user to GitHub for OAuth consent with `repo` scope.
4. After successful OAuth:
   1. Better Auth creates/updates a `User` record.
   2. Persists a `Session` record.
   3. Creates or updates an `Account` record with `providerId = "github"` and `accessToken` set.
5. Future authenticated requests use `auth.api.getSession({ headers })` to pull the current user and their GitHub account.

### 5.2 Repository connection

1. Authenticated user hits `/dashboard/repository`.
2. The client hook `useRepositories` calls the server action `fetchRepositories(page, perPage)` via React Query.
3. `fetchRepositories`:
   1. Validates the session (`auth.api.getSession`); if missing, throws `"Unauthorised"`.
   2. Fetches GitHub repositories via `getRepositories` (Octokit).
   3. Fetches already-connected repos from `prisma.repository`.
   4. Annotates GitHub repos with `isConnected` based on `githubId` presence.
4. UI shows list of repos with `Connect` buttons.
5. Clicking `Connect` on a repo:
   1. Calls client hook `useConnectRepository`, which invokes server action `connectRepository(owner, repo, githubId)`.
   2. `connectRepository` verifies session and calls `createWebHook` to:
      - Check for existing webhook pointing to `${NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`.
      - Create a new webhook for `pull_request` events if none exist.
   3. On successful webhook creation, it inserts a `Repository` row with:
      - `githubId` (BigInt), `name`, `owner`, `fullName`, `url`, `userId`.
   4. It then sends an Inngest event `repository.connected` with `{ owner, repo, userId }` (fire-and-forget).
6. The client invalidates the `"repositories"` query, causing UI to refresh and show the repo as connected.

### 5.3 Repository indexing (background)

1. Inngest receives `repository.connected` via `/api/inngest`.
2. `indexRepo` function executes:
   1. Finds the GitHub `Account` for `userId` (`providerId = "github"`).
   2. Retrieves the `accessToken`.
   3. Uses `getRepoFileContents` to:
      - Recursively walk the repo tree via GitHub REST API.
      - Decode Base64 file contents.
      - Filter out non-code files (images, Markdown, etc.).
   4. Calls `indexCodebase` with repo ID (`"${owner}/${repo}"`) and file list.
3. `indexCodebase`:
   1. For each file:
      - Builds `content = "File: <path>\n\n<file content>"`.
      - Truncates to 8000 chars for token safety.
      - Generates an embedding via `google.textEmbeddingModel("text-embedding-004")`.
      - Adds a Pinecone vector with metadata `{ repoId, path, content }`.
   2. Batches vectors in chunks of 100 and upserts into `pineconeIndex`.

### 5.4 Pull Request review generation

1. GitHub sends a `POST` request to `/api/webhooks/github` on relevant events.
2. The handler:
   1. Reads the `x-github-event` header.
   2. For `ping`, responds with `{ message: "Pong" }`.
   3. For `pull_request`:
      - Extracts `action`, `repository.full_name`, and PR `number`.
      - Splits `full_name` into `owner` and `repoName`.
      - If `action` in `{ "opened", "synchronize" }`:
        - Calls server action `reviewPullRequest(owner, repoName, prNumber)`.
3. `reviewPullRequest`:
   1. Fetches the `Repository` row by `owner` and `name`.
   2. Includes `user.accounts` filtered to `providerId = "github"`.
   3. Reads the user’s GitHub `accessToken`.
   4. Optionally calls `getPullRequestDiff` (currently only to get `title`; the main diff is retrieved later in the Inngest function).
   5. Sends Inngest event `pr.review.requested` with `{ owner, repo, prNumber, userId }`.
   6. On any error:
      - Best-effort: finds the `Repository` and inserts a `Review` row with status `"Failed"` and an error message string in `review`.
4. Inngest receives `pr.review.requested` and invokes `generateReview`:
   1. **Step `"fetch-pr-data"`**:
      - Finds the GitHub `Account` record for `userId`.
      - Gets `accessToken`.
      - Calls `getPullRequestDiff(token, owner, repo, prNumber)` to:
        - Fetch PR metadata (`title`, `body`).
        - Fetch the diff view via `mediaType: { format: "diff" }`.
      - Returns `{ diff, title, description, token }`.
   2. **Step `"retrieve-context"`**:
      - Builds query string from `title` + `description`.
      - Calls `retrieveContext(query, "${owner}/${repo}")` to:
        - Embed the query.
        - Query Pinecone for top `topK` matches filtered by `repoId`.
        - Return an array of snippet strings (`content` from metadata).
   3. **Step `"generate-ai-review"`**:
      - Constructs a detailed markdown prompt including:
        - PR title and description.
        - Retrieved context.
        - Full diff wrapped in ```diff code fences.
        - Instructions for walkthrough, Mermaid sequence diagram, summary, strengths, issues, suggestions, and rating.
      - Calls `generateText({ model: google("gemini-2.5-flash"), prompt })`.
      - Returns AI-generated `text`.
   4. **Step `"post-comment"`**:
      - Calls `postReviewComment(token, owner, repo, prNumber, review)` to:
        - Post a GitHub issue comment on the PR with a header and `_Powered by CodeRevU_` footer.
   5. **Step `"save-review"`**:
      - Finds the `Repository` row by `owner` and `name`.
      - Creates a `Review` record with:
        - `repositoryId`, `prNumber`, `prTitle`, `prUrl`, `review`, and `status: "completed"`.
   6. Returns `{ success: true }`.

### 5.5 Viewing review history

1. User navigates to `/dashboard/reviews`.
2. Client component calls `useQuery` with `queryKey: ["reviews"]` that calls server action `getReviews()`.
3. `getReviews`:
   1. Validates session.
   2. Fetches up to 50 `Review` rows where the associated `repository.userId` is the current user, including the `Repository`.
   3. Orders by `createdAt DESC`.
4. UI renders cards for each review with:
   - PR title, repository full name, PR number.
   - Status badge.
   - Time since review (`formatDistanceToNow`).
   - Snippet of the review body.
   - Link to PR on GitHub.

---

## 6. Database Design

### ORM

- **ORM**: Prisma
- **Why**:
  - Type-safe queries.
  - Strong model definitions and migrations.
  - Integration with Better Auth via Prisma adapter.

### Core Models

- **User**
  - Fields: `id`, `name`, `email`, `emailVerified`, `image`, timestamps.
  - Relations:
    - `sessions: Session[]`
    - `accounts: Account[]`
    - `repositories: Repository[]`
  - Unique: `email`.

- **Account**
  - Represents an auth provider account (e.g., GitHub).
  - Fields: `accountId`, `providerId`, `userId`, tokens (`accessToken`, `refreshToken`, `idToken`), scopes and expiry.
  - Relation: belongs to `User`.
  - Used to store GitHub OAuth token used by GitHub SDK.

- **Session**
  - Authentication session with `token`, `expiresAt`, `ipAddress`, `userAgent`.
  - Relation: belongs to `User`.

- **Verification**
  - Generic verification token storage (e.g., email verification, password reset).
  - Fields: `identifier`, `value`, `expiresAt`, timestamps.

- **Repository**
  - CodeRevU’s representation of a connected GitHub repository.
  - Fields:
    - `id` (internal ID)
    - `githubId` (BigInt, unique, matches GitHub repo ID)
    - `name`, `owner`, `fullName`, `url`
    - `userId` (owner user)
  - Relations:
    - `user: User`
    - `reviews: Review[]`.
  - Indexed by `userId`.

- **Review**
  - Represents a single AI review result for a PR.
  - Fields:
    - `id`
    - `repositoryId`
    - `prNumber`, `prTitle`, `prUrl`
    - `review` (text content, `Text` column)
    - `status` (`"completed"` default; conceptually `"completed" | "failed" | "pending"`)
  - Relation:
    - `repository: Repository`.

- **Test**
  - A simple `Test` table with `id` and `name`.
  - Appears to be for experimentation/demo, not core logic.

---

## 7. API Endpoints

> **Note:** Most business logic is implemented as Next.js Server Actions rather than traditional REST routes. This section documents only HTTP route handlers under `app/api`.

### 7.1 Auth

#### `GET /api/auth/[...all]` and `POST /api/auth/[...all]`

- **Purpose**: Delegated Better Auth handler for all auth-related routes (login, callback, session, etc.).
- **Auth required**: Mixed (some public like login callback; some require session).
- **Implementation**: `toNextJsHandler(auth)` returns `GET` and `POST` handlers.
- **Request/Response**:
  - Shapes are defined by Better Auth; the app code treats this as a black box.
  - Typically JSON responses with user/session data or redirects for OAuth flows.

### 7.2 GitHub Webhooks

#### `POST /api/webhooks/github`

- **Purpose**: Receive GitHub webhook events for this installation, primarily `pull_request` events.
- **Auth required**: No (GitHub calls it directly); should be restricted by secret/signature at a future point.
- **Request body**:
  - Raw GitHub webhook JSON.
  - For `pull_request` events includes fields like:
    - `action`
    - `repository.full_name`
    - `number` (PR number)
- **Headers**:
  - `x-github-event`: used to distinguish `ping` vs `pull_request`.
- **Behavior**:
  1. Reads JSON body and `x-github-event`.
  2. If event is `ping`:
     - Returns `200 { message: "Pong" }`.
  3. If event is `pull_request`:
     - Extracts `action`, repo name, PR number.
     - If `action` in `{ "opened", "synchronize" }`:
       - Calls `reviewPullRequest(owner, repo, prNumber)` (server action).
     - Logs success or failure of the review request.
  4. Returns `200 { message: "Event Processes" }` on success.
  5. Returns `500 { error: "Internal Server Error" }` on catch-all errors.
- **Response shape**:
  - JSON with `message` or `error`.

### 7.3 Inngest Handler

#### `GET /api/inngest`, `POST /api/inngest`, `PUT /api/inngest`

- **Purpose**: Entry point for Inngest’s event processing and function execution.
- **Auth required**: No standard user auth; Inngest uses its own mechanism/keys (configured outside this codebase).
- **Request/Response**:
  - Managed by `serve({ client: inngest, functions: [helloWorld, indexRepo, generateReview] })`.
  - Not meant for direct manual consumption; Inngest runtime calls this.

---

## 8. Environment Variables

| Variable                        | Required | Used In                       | Description |
|---------------------------------|----------|-------------------------------|-------------|
| `DATABASE_URL`                 | ✅       | `lib/db.ts`, `prisma.config`  | PostgreSQL connection string (includes DB, user, password, host, port). |
| `GITHUB_CLIENT_ID`             | ✅       | `lib/auth.ts`                 | GitHub OAuth client ID for Better Auth. |
| `GITHUB_CLIENT_SECRET`         | ✅       | `lib/auth.ts`                 | GitHub OAuth client secret for Better Auth. |
| `PINECONE_API_KEY`             | ✅       | `lib/pinecone.ts`             | API key for Pinecone client. |
| `NEXT_PUBLIC_APP_BASE_URL`     | ✅       | `module/github/lib/github.ts` | Public base URL used when creating GitHub webhooks (`<BASE_URL>/api/webhooks/github`). Must be accessible from GitHub. |
| `NEXT_PUBLIC_BETTER_AUTH_URL`  | 🔁\*     | `lib/auth-client.ts`          | Public base URL for Better Auth endpoints; if not set, falls back to `BETTER_AUTH_URL`. |
| `BETTER_AUTH_URL`              | 🔁\*     | `lib/auth-client.ts`          | Non-public fallback for Better Auth base URL. |
| `NODE_ENV`                     | Optional | `lib/db.ts`                   | Controls Prisma client global singleton caching in dev vs prod. |

\* **At least one of** `NEXT_PUBLIC_BETTER_AUTH_URL` **or** `BETTER_AUTH_URL` must be set so the client auth library can correctly reach the Better Auth API.

> There is no environment variable for the Pinecone index name; it is currently hardcoded as `"coderevu-indexing-v1"` in `lib/pinecone.ts`.

---

## 9. Installation & Local Setup

### 9.1 Prerequisites

1. **Node.js** 18+ (for Next.js 16) and a package manager (npm, pnpm, yarn, or Bun).
2. **PostgreSQL** instance reachable from your dev machine.
3. **GitHub OAuth App**:
   - Client ID and secret.
   - Redirect URL configured via Better Auth (see their docs).
4. **Pinecone** account and an index named `coderevu-indexing-v1`.
5. **Google AI / Gemini** access with API key configured for use by `@ai-sdk/google` (set via environment, typically `GOOGLE_API_KEY`, though this repo uses the `ai` SDK’s default mechanism; configure according to `ai` SDK + Google provider docs).

### 9.2 Clone the repo

```bash
git clone <this-repo-url> CodeRevU
cd CodeRevU/my-app
```

### 9.3 Install dependencies

```bash
# using npm
npm install

# or using bun
bun install
```

### 9.4 Setup environment variables

Create a `.env` file in `my-app/`:

```bash
cp .env.example .env  # if you have a template; otherwise create manually
```

Minimum required values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/coderevu
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
PINECONE_API_KEY=...
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000

# At least one of:
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
# or
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Plus any keys required by @ai-sdk/google per their documentation (e.g. GOOGLE_API_KEY)
```

### 9.5 Database setup / migrations

From `my-app/`:

```bash
npx prisma migrate deploy
# or, for local development with new DB
npx prisma migrate dev
```

This will create the tables defined in `prisma/schema.prisma`.

### 9.6 Run the dev server

```bash
npm run dev
# or
bun dev
```

Open `http://localhost:3000` in your browser.  
You should be redirected to `/login` if not authenticated.

### 9.7 Trigger a test workflow

1. **Login**:
   - Go to `http://localhost:3000/login`.
   - Sign in with GitHub, granting `repo` scope.
2. **Connect a repository**:
   - Navigate to `/dashboard/repository` via the app UI.
   - Search/select a repository you own.
   - Click **Connect**; ensure a webhook is created in GitHub under the repo’s *Settings → Webhooks*.
3. **Open a PR**:
   - On GitHub, open a PR in the connected repository (or push new commits to an open PR).
4. **Observe the flow**:
   - GitHub sends a `pull_request` webhook to `/api/webhooks/github`.
   - The server action `reviewPullRequest` sends `pr.review.requested` to Inngest.
   - Inngest invokes `generateReview`:
     - Fetches diff and context, calls AI, posts comment to PR.
   - Visit `/dashboard/reviews` in the app to see the review logged in history.

---

## 10. Background Jobs & Webhooks

### Background Jobs (Inngest)

- **Triggering**
  - `repository.connected`:
    - Sent by `connectRepository` when a repo is successfully connected and webhook is created.
    - Triggers `indexRepo` to fetch and index code into Pinecone.
  - `pr.review.requested`:
    - Sent by `reviewPullRequest` when a relevant PR webhook is received.
    - Triggers `generateReview` for AI review generation.

- **Execution**
  - All Inngest functions are served via `/api/inngest`.
  - Inngest manages retries and observability (configured externally; not explicit in this repo).
  - `generateReview` specifies `concurrency: 5` to limit simultaneous reviews.

- **Failure Handling**
  - Inside `generateReview`, thrown errors will cause function failure; saving “failed” state is currently handled only in `reviewPullRequest` catch block (best-effort DB logging).
  - Indexing failures are logged to console; they do not prevent repository connection from succeeding.

### Webhooks (GitHub)

- **Creation**
  - `createWebHook(owner, repo)`:
    - Checks for an existing webhook with URL `${NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`.
    - If found, returns it (idempotent behavior).
    - If not, creates a webhook for `pull_request` events.
- **Deletion**
  - `deleteWebHook(owner, repo)`:
    - Locates matching webhook by URL.
    - Deletes it using GitHub’s `deleteWebhook` API.
  - Used by `disconnectRepository` and `disconnectAllRepository`.

- **Handling**
  - `/api/webhooks/github` route:
    - Receives and logs events.
    - Dispatches review jobs for `pull_request` events.

- **Retries / Failures**
  - GitHub will retry webhook deliveries on non-2xx responses (standard GitHub behavior).
  - The current handler always attempts to return 200 for recognized events; failures are logged but not surfaced to GitHub as structured errors.

---

## 11. Security Considerations

- **Token handling**
  - GitHub OAuth access tokens are stored in the `Account` table (`accessToken`).
  - All GitHub API calls (repos, contributions, PRs, diff fetching) use this token.
  - Tokens are not exposed to the client; they are only used server-side (server actions, Inngest functions).

- **Session handling**
  - Better Auth manages `Session` table with `token` and `expiresAt`.
  - Server actions and GitHub helpers always call `auth.api.getSession({ headers })` and throw or redirect on unauthenticated access.
  - Sensitive actions (repository connect/disconnect, reading reviews, profile update) are guarded by these checks.

- **Webhook verification**
  - **Current State**:
    - `/api/webhooks/github` does not verify `X-Hub-Signature` / `X-Hub-Signature-256` or use a webhook secret.
    - This is a security gap: any third party can POST to this endpoint and potentially trigger review jobs.
  - **Planned**:
    - Add HMAC verification against a shared secret stored in env vars.

- **Auth boundaries**
  - Only repositories associated with the current `userId` are returned or modified in server actions.
  - Review queries filter by `repository.userId` to ensure users only see their own reviews.
  - Disconnect operations validate that the repository belongs to the current user before deleting.

- **AI prompt safety**
  - Prompts include full PR diffs and retrieved code snippets.
  - No additional PII stripping or content filtering is performed in this codebase.
  - No explicit prompt injection mitigation or safety filters are implemented beyond model defaults.

---

## 12. Limitations & Known Gaps

- **Webhook security**
  - No signature verification for GitHub webhooks.
  - No rate limiting or abuse protection on `/api/webhooks/github`.

- **Dashboard accuracy**
  - Some dashboard metrics are hardcoded (e.g., `totalRepos = 30`, `totalReviews = 44`).
  - Monthly review counts use synthetic sample data instead of the real `Review` table.

- **Status consistency**
  - `Review.status` defaults to `"completed"`, but error paths write `"Failed"` (capitalized), while UI expects `"failed"`.
  - No centralized enum or validation for status values.

- **Indexing robustness**
  - Repository indexing assumes Pinecone and embedding calls always succeed; errors are logged but not persisted or surfaced to the user.
  - No retry strategy implemented in code for failed embedding or upsert operations (beyond what Inngest might provide by default).

- **Scalability**
  - `getRepoFileContents` recursively fetches each file individually; large repos may be slow and API-rate limited.
  - RAG index stores truncated contents with no chunking strategy beyond simple `slice(0, 8000)`.

- **Multi-tenant / org features**
  - Design is per-user; no explicit team/org modeling or RBAC.

- **Configuration**
  - Pinecone index name is hardcoded; no environment-based configurability.
  - App metadata still uses default Next.js values.

---

## 13. Future Improvements

- **Security**
  - Implement GitHub webhook signature verification with a secret (HMAC SHA-256).
  - Add rate limiting and basic abuse detection on webhook and auth endpoints.
  - Normalize `Review.status` into a strict enum and enforce it at application level.

- **Observability & Reliability**
  - Add structured logging and tracing around Inngest functions (indexing, review generation).
  - Persist failures of indexing and review generation into `Review` or a dedicated `Job` table.
  - Surface job status and errors in the UI.

- **Dashboard & Analytics**
  - Replace hardcoded stats and synthetic review counts with real queries over `Repository` and `Review`.
  - Add filters (per repo, date range) for reviews and activity.

- **RAG & Performance**
  - Implement smarter chunking strategies (e.g., by function/file sections) instead of naive truncation.
  - Make Pinecone index name and topK configurable via environment variables.
  - Apply caching or incremental indexing for large repos.

- **Developer Experience**
  - Provide `.env.example` and detailed docs for configuring Google AI and Inngest keys.
  - Add tests for core workflows (repository connect, webhook handling, review generation).

---

## 14. License

No explicit license file is present in this repository.  
Unless a license is added, treat this code as **all rights reserved** and seek permission from the author before using it in production or redistributing.


