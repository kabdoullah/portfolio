import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '#/features/portfolio/components/Navbar'
import { Footer } from '#/features/portfolio/components/Footer'
import { ScrollProgress } from '#/features/portfolio/components/ScrollProgress'
import { HeroSection } from '#/features/portfolio/components/HeroSection'
import { AboutSection } from '#/features/portfolio/components/AboutSection'
import { SkillsSection } from '#/features/portfolio/components/SkillsSection'
import { ProjectsSection } from '#/features/portfolio/components/ProjectsSection'
import { ExperienceSection } from '#/features/portfolio/components/ExperienceSection'
import { EducationSection } from '#/features/portfolio/components/EducationSection'
import { ContactSection } from '#/features/portfolio/components/ContactSection'
import { WeaveDivider } from '#/components/shared/WeaveDivider'
import { useLocalizedPortfolioData } from '#/features/data/useLocalizedPortfolioData'
import { m } from '#/paraglide/messages'
import { getLocale, getUrlOrigin } from '#/paraglide/runtime'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => {
    // Resolved per request: getLocale()/getUrlOrigin() read the paraglide SSR
    // context, m.*() the active-locale message. fr is the unprefixed canonical,
    // en lives under /en/. x-default points at fr (the base locale).
    const locale = getLocale()
    const origin = getUrlOrigin()
    const frUrl = `${origin}/`
    const enUrl = `${origin}/en/`
    return {
      meta: [
        { title: m.meta_title() },
        { name: 'description', content: m.meta_description() },
      ],
      links: [
        { rel: 'canonical', href: locale === 'en' ? enUrl : frUrl },
        // Key must be lowercase `hreflang`: TanStack renders link attribute keys
        // verbatim, and crawlers only recognise the lowercase HTML attribute.
        { rel: 'alternate', hreflang: 'fr', href: frUrl },
        { rel: 'alternate', hreflang: 'en', href: enUrl },
        { rel: 'alternate', hreflang: 'x-default', href: frUrl },
      ],
    }
  },
})

function PersonJsonLd() {
  const { data } = useLocalizedPortfolioData()
  const { name, title, email, location, github, linkedin } = data.personalInfo
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: title,
    email: email || undefined,
    address: location,
    sameAs: [github, linkedin].filter(Boolean),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

function Home() {
  return (
    <>
      <PersonJsonLd />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <WeaveDivider />
        <AboutSection />
        <WeaveDivider />
        <SkillsSection />
        <WeaveDivider />
        <ProjectsSection />
        <WeaveDivider />
        <ExperienceSection />
        <WeaveDivider />
        <EducationSection />
        <WeaveDivider />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
