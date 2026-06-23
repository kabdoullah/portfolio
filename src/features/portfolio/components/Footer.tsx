import { Github, Linkedin, Mail } from 'lucide-react'
import { usePortfolioData } from '#/features/data/usePortfolioData'

export function Footer() {
  const { data } = usePortfolioData()
  const { name, email, github, linkedin } = data.personalInfo
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-background/40">
      <div className="mx-auto flex w-[min(1120px,calc(100%-2rem))] flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {year} {name}
        </p>
        <div className="flex items-center gap-4">
          {email ? (
            <a href={`mailto:${email}`} aria-label="Email" className="text-muted-foreground hover:text-foreground">
              <Mail className="size-5" />
            </a>
          ) : null}
          {github ? (
            <a href={github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
              <Github className="size-5" />
            </a>
          ) : null}
          {linkedin ? (
            <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground">
              <Linkedin className="size-5" />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
