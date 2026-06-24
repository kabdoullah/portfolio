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
import { usePortfolioData } from '#/features/data/usePortfolioData'

export const Route = createFileRoute('/')({ component: Home })

function PersonJsonLd() {
  const { data } = usePortfolioData()
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
