import { Reveal } from '#/components/shared/Reveal'
import { cn } from '#/lib/utils'

interface SectionHeaderProps {
  kicker: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-secondary',
          align === 'center' && 'justify-center',
        )}
      >
        <span className="h-px w-6 bg-secondary/50" aria-hidden />
        {kicker}
      </span>
      <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-muted-foreground text-pretty">{subtitle}</p>
      ) : null}
    </Reveal>
  )
}
