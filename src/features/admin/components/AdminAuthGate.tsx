import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { ADMIN_AUTH_KEY } from '#/lib/utils/constants'

// Local-only gate: there is no backend. The password is checked against a build
// env var; a granted session is kept in sessionStorage (cleared on tab close).
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin2025'

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true')
    setReady(true)
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  // Avoid flashing the login form before sessionStorage is read.
  if (!ready) return null

  if (authed) return <>{children}</>

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 p-4 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
            <Lock className="size-5" />
          </span>
          <h1 className="font-display text-xl font-bold">Espace d’administration</h1>
          <p className="text-sm text-slate-400">
            Saisissez le mot de passe pour continuer.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-password" className="text-slate-300">
            Mot de passe
          </Label>
          <Input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
            className="border-slate-700 bg-slate-800 text-slate-100"
          />
          {error ? (
            <p className="text-xs text-red-400">Mot de passe incorrect.</p>
          ) : null}
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
          Se connecter
        </Button>
      </form>
    </div>
  )
}
