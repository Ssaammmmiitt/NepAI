import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { useAuthStore } from '@/store/authStore'
import { useFadeIn } from '@/hooks/useAnimations'

export function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, user, initialize, initialized } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useFadeIn({ delay: 0.1 })

  useEffect(() => {
    if (!initialized) void initialize()
  }, [initialized, initialize])

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-dt-bg">
      <PublicHeader subtitle="NEPSE Stock Prediction" />

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div ref={formRef} className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-dt-border bg-dt-surface sm:h-14 sm:w-14">
              <BrandLogo size="lg" />
            </div>
            <h2 className="font-mono text-xl font-bold uppercase tracking-[0.06em] text-dt-text">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="mt-2 text-sm text-dt-meta">
              {mode === 'login'
                ? 'Sign in to access your predictions'
                : 'Start your AI-powered trading journey'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 border border-dt-border bg-dt-surface p-6"
          >
            {mode === 'signup' ? (
              <Input
                label="Full Name"
                placeholder="Hari Bahadur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            ) : null}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error ? (
              <p className="border border-dt-negative px-3 py-2 text-xs text-dt-negative">{error}</p>
            ) : null}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>

            <p className="text-center text-xs text-dt-meta">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                className="cursor-pointer font-mono font-medium text-dt-accent-bright hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
