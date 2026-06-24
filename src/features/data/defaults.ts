import type { PortfolioData } from '#/features/data/types'

// First-run seed + reset target. NEVER import this into UI components — read data
// through `usePortfolioData()` instead (see PortfolioDataContext).

export function getDefaultData(): PortfolioData {
  return {
    personalInfo: {
      name: 'Abdoulaye Kemogoha COULIBALY',
      title: 'Développeur Full Stack',
      taglines: [
        'Développeur Full Stack',
        'Backend Java / Spring',
        'Mobile Flutter',
        'Python & IA/Data',
      ],
      bio: "Développeur Full Stack basé à Abidjan, je conçois et livre des produits de bout en bout — du backend Java/Spring aux applications mobiles Flutter, en passant par des solutions Python et IA/Data. J'aime le code propre, les architectures solides et les interfaces soignées.",
      location: 'Abidjan, Côte d’Ivoire',
      email: 'abdoullahcoulibaly2@gmail.com',
      phone: '',
      github: 'https://github.com/',
      linkedin: 'https://www.linkedin.com/',
      cvUrl: '',
      profilePhoto: '/profile.jpg',
      available: true,
      stats: [
        { label: "Années d'expérience", value: '3+' },
        { label: 'Projets livrés', value: '10+' },
        { label: 'Technologies', value: '15+' },
      ],
    },
    skills: [
      { id: 'skill-java', name: 'Java', category: 'Backend', level: 'advanced' },
      { id: 'skill-spring', name: 'Spring Boot', category: 'Backend', level: 'advanced' },
      { id: 'skill-python', name: 'Python', category: 'Backend', level: 'advanced' },
      { id: 'skill-postgres', name: 'PostgreSQL', category: 'Backend', level: 'intermediate' },
      { id: 'skill-flutter', name: 'Flutter', category: 'Mobile', level: 'advanced' },
      { id: 'skill-dart', name: 'Dart', category: 'Mobile', level: 'advanced' },
      { id: 'skill-react', name: 'React', category: 'Frontend', level: 'advanced' },
      { id: 'skill-ts', name: 'TypeScript', category: 'Frontend', level: 'advanced' },
      { id: 'skill-tailwind', name: 'Tailwind CSS', category: 'Frontend', level: 'advanced' },
      { id: 'skill-docker', name: 'Docker', category: 'DevOps', level: 'intermediate' },
      { id: 'skill-git', name: 'Git', category: 'DevOps', level: 'advanced' },
      { id: 'skill-cicd', name: 'CI/CD', category: 'DevOps', level: 'intermediate' },
      { id: 'skill-pandas', name: 'Pandas', category: 'IA/Data', level: 'intermediate' },
      { id: 'skill-ml', name: 'Machine Learning', category: 'IA/Data', level: 'beginner' },
    ],
    projects: [
      {
        id: 'project-ifins',
        title: 'IFINS — Site Corporate',
        description:
          "Site vitrine corporate pour une institution financière, avec gestion de contenu, formulaires de contact et design responsive.",
        stack: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
        type: 'Freelance',
        year: '2024',
        liveUrl: '',
        githubUrl: '',
        highlights: [
          'Architecture backend modulaire',
          'Interface responsive et accessible',
          'Déploiement conteneurisé',
        ],
        featured: true,
        order: 0,
      },
      {
        id: 'project-cutout-ai',
        title: 'CutOut AI — Retouche photo',
        description:
          "Application de retouche photo assistée par IA : suppression d'arrière-plan et amélioration automatique des images.",
        stack: ['Python', 'Flutter', 'Machine Learning'],
        type: 'Personnel',
        year: '2024',
        liveUrl: '',
        githubUrl: '',
        highlights: [
          "Pipeline de traitement d'images",
          'Modèle de segmentation IA',
          'App mobile multiplateforme',
        ],
        featured: true,
        order: 1,
      },
    ],
    experiences: [
      {
        id: 'exp-fullstack',
        role: 'Développeur Full Stack',
        company: 'Freelance',
        period: '2022 — Présent',
        stack: ['Java', 'Spring Boot', 'Flutter', 'React', 'Python'],
        bullets: [
          'Conception et livraison de produits web et mobiles de bout en bout',
          'Mise en place d’architectures backend robustes et testables',
          'Collaboration directe avec les clients pour cadrer les besoins',
        ],
        order: 0,
      },
    ],
    education: [
      {
        id: 'edu-info',
        degree: 'Diplôme en Informatique',
        school: 'Abidjan, Côte d’Ivoire',
        period: '2018 — 2021',
        description: 'Génie logiciel, bases de données et développement applicatif.',
      },
    ],
    lastUpdated: new Date(0).toISOString(),
  }
}
