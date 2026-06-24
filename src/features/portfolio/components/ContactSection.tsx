import { useForm } from '@tanstack/react-form'
import { Github, Linkedin, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { createMessage } from '#/features/data/server/messages'
import { SECTION_IDS } from '#/lib/utils/constants'

const contactSchema = z.object({
  name: z.string().min(2, 'Votre nom est requis'),
  email: z.email('Adresse email invalide'),
  message: z.string().min(10, 'Votre message est un peu court'),
})

export function ContactSection() {
  const { data } = usePortfolioData()
  const { email, github, linkedin } = data.personalInfo

  const form = useForm({
    defaultValues: { name: '', email: '', message: '' },
    validators: { onChange: contactSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createMessage({ data: value })
        toast.success('Message envoyé ! Je vous réponds rapidement.')
        formApi.reset()
      } catch {
        toast.error('Échec de l’envoi. Réessayez dans un instant.')
      }
    },
  })

  return (
    <section id={SECTION_IDS.contact} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader
          kicker="Contact"
          title="Travaillons ensemble"
          subtitle="Une idée, un projet, une mission ? Écrivez-moi."
        />

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <Reveal className="flex flex-col gap-4">
            {email ? (
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                <Mail className="size-5 text-secondary" /> {email}
              </a>
            ) : null}
            {github ? (
              <a href={github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                <Github className="size-5 text-secondary" /> GitHub
              </a>
            ) : null}
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                <Linkedin className="size-5 text-secondary" /> LinkedIn
              </a>
            ) : null}
          </Reveal>

          <Reveal>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void form.handleSubmit()
              }}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm"
              noValidate
            >
              <form.Field name="name">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={field.name}>Nom</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} touched={field.state.meta.isTouched} />
                  </div>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} touched={field.state.meta.isTouched} />
                  </div>
                )}
              </form.Field>

              <form.Field name="message">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={field.name}>Message</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={5}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} touched={field.state.meta.isTouched} />
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit} className="w-fit">
                    <Send className="size-4" />
                    {isSubmitting ? 'Envoi…' : 'Envoyer'}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FieldError({
  errors,
  touched,
}: {
  errors: Array<{ message?: string } | undefined>
  touched: boolean
}) {
  if (!touched) return null
  const message = errors.find((e) => e?.message)?.message
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}
