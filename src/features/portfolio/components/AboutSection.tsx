import { motion } from 'framer-motion'
import { GraduationCap, MapPin } from 'lucide-react'
import { CountUp } from '#/components/shared/CountUp'
import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { useLocalizedPortfolioData } from '#/features/data/useLocalizedPortfolioData'
import { SECTION_IDS } from '#/lib/utils/constants'

export function AboutSection() {
  const { data } = useLocalizedPortfolioData()
  const { personalInfo, education } = data
  const { bio, location, profilePhoto, stats, name, available } = personalInfo

  return (
    <section id={SECTION_IDS.about} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader kicker="À propos" title="Qui suis-je" align="left" />

        <div className="mt-12 grid items-start gap-10 md:grid-cols-[300px_1fr]">
          <Reveal className="mx-auto w-full max-w-75">
            <motion.div
              whileHover={{ rotate: 1, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative overflow-hidden rounded-xl border border-border shadow-[0_18px_50px_-20px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
            >
              <img
                src={profilePhoto || '/profile.jpg'}
                alt={name}
                loading="lazy"
                className="aspect-4/5 w-full object-cover"
              />
              {available ? (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <span className="size-2 animate-pulse rounded-full bg-secondary" />
                  <span className="text-xs font-medium text-white">Disponible</span>
                </div>
              ) : null}
            </motion.div>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal>
              <p className="text-lg leading-relaxed text-muted-foreground">{bio}</p>
            </Reveal>

            <Reveal className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-secondary" /> {location}
              </span>
              {education[0] ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="size-4 text-secondary" />
                  {education[0].degree}
                </span>
              ) : null}
            </Reveal>

            <Reveal className="grid grid-cols-3 gap-4 pt-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card/60 p-4 text-center backdrop-blur-sm"
                >
                  <div className="font-display text-2xl font-bold text-primary sm:text-3xl">
                    <CountUp value={stat.value} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
