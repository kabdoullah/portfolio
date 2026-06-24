import { useForm } from '@tanstack/react-form'
import { Github, Linkedin, Mail, Phone, Send } from 'lucide-react'
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

// Default country code prepended for wa.me when the stored phone has none
// (Abidjan, Côte d'Ivoire). wa.me wants digits only — no +, spaces, or 00 prefix.
const WHATSAPP_COUNTRY_CODE = '225'

/** Normalise a stored phone into a wa.me path: digits only, country code ensured. */
function toWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (!digits.startsWith(WHATSAPP_COUNTRY_CODE)) digits = WHATSAPP_COUNTRY_CODE + digits
  return digits
}

// Official WhatsApp glyph (lucide ships no brand icons). Single solid path so it
// renders crisp at icon size; brand green #25D366 set by the caller via className.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c.01-4.54 3.7-8.23 8.25-8.23zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.65 2.08.82 2.5.66 2.96.62.46-.04 1.48-.6 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.11-.22-.17-.46-.29-.24-.12-1.48-.73-1.71-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.53.07-.24-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43-.06-.12-.55-1.34-.77-1.83-.2-.48-.4-.42-.55-.43-.14 0-.3-.01-.46-.01z" />
    </svg>
  )
}

const contactSchema = z.object({
  name: z.string().min(2, 'Votre nom est requis'),
  email: z.email('Adresse email invalide'),
  message: z.string().min(10, 'Votre message est un peu court'),
})

export function ContactSection() {
  const { data } = usePortfolioData()
  const { email, phone, github, linkedin } = data.personalInfo

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
            {phone ? (
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                <Phone className="size-5 text-secondary" /> {phone}
              </a>
            ) : null}
            {phone ? (
              <a
                href={`https://wa.me/${toWhatsAppNumber(phone)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
              >
                <WhatsAppIcon className="size-5 text-secondary" /> WhatsApp
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
