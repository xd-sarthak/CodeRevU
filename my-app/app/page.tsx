// Home page component for CodeRevU
// Requires user authentication and redirects authenticated users to the dashboard
// Serves as the entry point after login

import { Suspense } from "react";
import { requireAuth } from "@/module/auth/utils/auth-utils";
import { redirect } from "next/navigation";

async function AuthRedirect() {
  await requireAuth()
  return redirect('/dashboard')
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AuthRedirect />
    </Suspense>
  )
}
