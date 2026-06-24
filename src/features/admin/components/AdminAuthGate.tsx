import { useEffect, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { ADMIN_AUTH_KEY } from '#/lib/utils/constants'
import { verifyAdminPassword } from '#/features/data/server/admin'

// The password is verified server-side (see `server/admin.ts`) so the secret is
// never shipped in the client bundle. A granted session is kept in
// sessionStorage (cleared on tab close).

// Warp threads strung across the panel's top — the loom, ready to be worked.
const WARP_TOP =
  'repeating-linear-gradient(90deg, color-mix(in oklab, var(--thread) 50%, transparent) 0 1px, transparent 1px 9px)'

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true')
    setReady(true)
  }, [])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const { isValid } = await verifyAdminPassword({ data: { password } })
      if (isValid) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
        setAuthed(true)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Avoid flashing the login form before sessionStorage is read.
  if (!ready) return null

  if (authed) return <>{children}</>

  return (
    <div className="admin flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-thread/40 bg-card p-8"
      >
        {/* Selvedge — the bound top edge of the cloth. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundImage: WARP_TOP }}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-secondary">
              AKC · atelier
            </span>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Ouvrir l’atelier
            </h1>
            <p className="text-sm text-muted-foreground">
              Cet espace gère le contenu du portfolio. Entrez le mot de passe pour continuer.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-password">Mot de passe</Label>
            <Input
              id="admin-password"
              type="password"
              autoFocus
              aria-invalid={error}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
            />
            {error ? (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <Lock className="size-3.5" /> Mot de passe incorrect. Réessayez.
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Vérification…' : 'Ouvrir l’atelier'}
          </Button>
        </div>
      </form>
    </div>
  )
}
