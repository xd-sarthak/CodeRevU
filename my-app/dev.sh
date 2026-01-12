#!/bin/bash

# Development environment startup script for CodeRevU
# Runs Next.js dev server, Inngest dev server, and ngrok tunnel

echo "🚀 Starting CodeRevU Development Environment..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start Next.js dev server
echo "📦 Starting Next.js dev server..."
bun run dev &
NEXT_PID=$!

# Wait a bit for Next.js to start
sleep 3

# Start Inngest dev server
echo "⚙️  Starting Inngest dev server..."
npx inngest-cli@latest dev &
INNGEST_PID=$!

# Wait a bit for Inngest to start
sleep 2

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 3000 --domain=lowerable-permissibly-georgie.ngrok-free.dev &
NGROK_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Services:"
echo "   Next.js:  http://localhost:3000"
echo "   Inngest:  http://localhost:8288"
echo "   ngrok:    https://lowerable-permissibly-georgie.ngrok-free.dev"
echo "   ngrok UI: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
