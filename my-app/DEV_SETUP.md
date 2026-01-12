# Development Environment Setup

This guide explains how to run all CodeRevU development services together using mprocs.

## Prerequisites

1. **Install mprocs** (if not already installed):
   ```bash
   # Windows (using Scoop)
   scoop install mprocs
   
   # Or download from: https://github.com/pvolok/mprocs/releases
   ```

2. **Install ngrok** (if not already installed):
   ```bash
   # Windows (using Scoop)
   scoop install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

3. **Authenticate ngrok** (one-time setup):
   ```bash
   ngrok config add-authtoken YOUR_NGROK_TOKEN
   ```

## Running All Services

### Option 1: Using mprocs (Recommended)

Run all services (Next.js, Inngest, ngrok) with a single command:

```bash
bun run dev:all
```

This will start:
- **Next.js dev server** on `http://localhost:3000`
- **Inngest dev server** on `http://localhost:8288`
- **ngrok tunnel** at `https://lowerable-permissibly-georgie.ngrok-free.dev`

### Option 2: Manual (separate terminals)

If you prefer to run services separately:

**Terminal 1 - Next.js:**
```bash
bun run dev
```

**Terminal 2 - Inngest:**
```bash
npx inngest-cli@latest dev
```

**Terminal 3 - ngrok:**
```bash
ngrok http 3000 --domain=lowerable-permissibly-georgie.ngrok-free.dev
```

## mprocs Keyboard Shortcuts

When running `bun run dev:all`:

- **Tab** - Switch between processes
- **Ctrl+A** - Show all processes
- **Ctrl+C** - Stop selected process
- **Ctrl+R** - Restart selected process
- **Ctrl+Q** - Quit mprocs (stops all processes)
- **Arrow keys** - Navigate between processes
- **Enter** - Focus on selected process output

## What Each Service Does

### Next.js Dev Server
- Runs your web application
- Hot reloads on code changes
- Available at `http://localhost:3000`

### Inngest Dev Server
- Processes background jobs (repository indexing, AI reviews)
- Provides UI at `http://localhost:8288`
- Shows job execution logs and debugging info

### ngrok Tunnel
- Exposes your local server to the internet
- Required for GitHub webhooks to reach your local machine
- Your public URL: `https://lowerable-permissibly-georgie.ngrok-free.dev`

## Environment Variables

Make sure your `.env` file has:

```bash
# Your ngrok domain (update APP_BASE_URL to match)
APP_BASE_URL=https://lowerable-permissibly-georgie.ngrok-free.dev

# GitHub webhook secret (generate with: openssl rand -hex 32)
GITHUB_WEBHOOK_SECRET=your_secret_here

# All other required variables (see .env.example)
```

## GitHub Webhook Configuration

Once ngrok is running:

1. Go to your GitHub repo → Settings → Webhooks
2. Click "Add webhook" or edit existing
3. Set Payload URL: `https://lowerable-permissibly-georgie.ngrok-free.dev/api/webhooks/github`
4. Set Content type: `application/json`
5. Set Secret: (same as `GITHUB_WEBHOOK_SECRET` in your `.env`)
6. Select events: "Pull requests"
7. Click "Add webhook"

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### ngrok domain not working
- Make sure you're using your reserved ngrok domain
- Check ngrok authentication: `ngrok config check`
- Verify domain in ngrok dashboard: https://dashboard.ngrok.com/domains

### Inngest not connecting
- Check that Next.js is running first
- Visit `http://localhost:8288` to see Inngest UI
- Verify Inngest endpoint is accessible at `http://localhost:3000/api/inngest`

## Testing the Full Stack

1. **Start all services:**
   ```bash
   bun run dev:all
   ```

2. **Connect a repository:**
   - Go to `http://localhost:3000/dashboard/repository`
   - Click "Connect" on a repository

3. **Create a test PR:**
   - Create a new branch in your connected repo
   - Make a code change
   - Open a Pull Request

4. **Watch the magic:**
   - GitHub sends webhook to ngrok → your local server
   - Webhook triggers AI review job in Inngest
   - AI analyzes the PR and posts a review comment
   - Check Inngest UI (`http://localhost:8288`) to see job execution

## Tips

- Keep the mprocs window open to monitor all services
- Check Inngest UI for background job status
- Use ngrok inspector (`http://localhost:4040`) to debug webhooks
- All logs are color-coded in mprocs for easy identification
