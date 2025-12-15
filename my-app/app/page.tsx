// Home page component for CodeRevU
// Requires user authentication and redirects authenticated users to the dashboard
// Serves as the entry point after login

import { requireAuth } from "@/module/auth/utils/auth-utils";
import { redirect } from "next/navigation";

export default async function Home() {
  await requireAuth()
  return redirect('/dashboard')
}
