import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MailOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/features/admin/components/ConfirmDialog'
import {
  deleteMessage,
  getMessages,
  setMessageRead,
} from '#/features/data/server/messages'
import type { Message } from '#/features/data/types'

export const Route = createFileRoute('/admin/messages')({ component: AdminMessages })

/** Shared key so the sidebar unread badge and this page read the same cache. */
export const MESSAGES_QUERY_KEY = ['messages'] as const

function AdminMessages() {
  const queryClient = useQueryClient()
  const { data: messages = [], isLoading } = useQuery({
    queryKey: MESSAGES_QUERY_KEY,
    queryFn: () => getMessages(),
  })
  const [deleting, setDeleting] = useState<Message | null>(null)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY })

  const readMutation = useMutation({
    mutationFn: (vars: { id: string; read: boolean }) => setMessageRead({ data: vars }),
    onSuccess: () => invalidate(),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage({ data: id }),
    onSuccess: () => invalidate(),
  })

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Messages{' '}
          <span className="font-mono text-lg font-normal tabular-nums text-muted-foreground">
            {String(messages.length).padStart(2, '0')}
          </span>
        </h1>
        {unread > 0 ? (
          <Badge variant="secondary">{unread} non lu{unread > 1 ? 's' : ''}</Badge>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun message pour l’instant. Les envois du formulaire de contact apparaîtront ici.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className={
                'flex flex-col gap-2 rounded-xl border p-4 ' +
                (msg.read ? 'border-border bg-card/40' : 'border-primary/40 bg-primary/5')
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  {msg.read ? null : (
                    <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Non lu" />
                  )}
                  <span className="font-medium">{msg.name}</span>
                  <a
                    href={`mailto:${msg.email}`}
                    className="font-mono text-xs text-secondary hover:underline"
                  >
                    {msg.email}
                  </a>
                </div>
                <time className="font-mono text-xs text-muted-foreground" dateTime={msg.createdAt}>
                  {new Date(msg.createdAt).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </div>

              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{msg.message}</p>

              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => readMutation.mutate({ id: msg.id, read: !msg.read })}
                >
                  {msg.read ? (
                    <>
                      <Mail className="size-4" /> Marquer non lu
                    </>
                  ) : (
                    <>
                      <MailOpen className="size-4" /> Marquer lu
                    </>
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer le message de ${msg.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(msg)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer ce message ?"
        description={deleting ? `${deleting.name} — ${deleting.email}` : undefined}
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id)
            toast.success('Message supprimé')
          }
        }}
      />
    </div>
  )
}
