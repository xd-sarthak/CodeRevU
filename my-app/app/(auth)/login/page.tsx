import { Suspense } from 'react'
import LoginUI from '@/module/auth/components/login-uti'
import { requireUnAuth } from '@/module/auth/utils/auth-utils'

async function AuthGate() {
  await requireUnAuth()
  return <LoginUI />
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthGate />
    </Suspense>
  )
}
