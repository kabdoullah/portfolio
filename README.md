# Portfolio — Abdoulaye Kemogoha COULIBALY

Portfolio personnel (développeur Full Stack, Abidjan) : un site public d'une page, bilingue
**FR/EN**, et un **tableau de bord `/admin`** qui permet de modifier tout le contenu du site
(projets, expériences, compétences, formation, infos personnelles) et de lire les messages du
formulaire de contact. Le contenu est stocké dans **Neon (Postgres)** ; le site est déployé sur
**Render**.

## Stack

- **React 19** + **TanStack Start** (SSR, Server Functions) + **Vite 8**, routage par fichiers
- **TanStack Query** (cache côté client), **TanStack Form** + **Zod v4**
- **Drizzle ORM** + **postgres.js** sur **Neon**
- **Tailwind CSS v4** + **shadcn/ui**, **Framer Motion**, **@dnd-kit** (réordonnancement admin)
- **Paraglide JS** pour l'i18n (FR par défaut, EN sous `/en/`)
- **TypeScript strict**, **Vitest**, ESLint + Prettier
- **React Compiler** activé

## Prérequis

- **Node 22** (voir `.nvmrc`)
- **pnpm 11** — npm et yarn ne respectent pas la configuration `pnpm-workspace.yaml`
- Une base **Neon** : une branche `dev` pour le développement local

## Démarrage

```bash
pnpm install
cp .env.local.example .env.local
```

Renseigner `.env.local` :

| Variable         | Rôle                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | **Obligatoire.** Chaîne de connexion **directe** de la branche Neon `dev` (hôte sans `-pooler`).         |
| `ADMIN_PASSWORD` | Mot de passe de `/admin`, vérifié côté serveur (`admin2025` par défaut). Ne pas le préfixer par `VITE_`. |

Puis créer le schéma, insérer le contenu par défaut et lancer le serveur :

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev          # http://localhost:3000
```

## Scripts

| Commande                                   | Rôle                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                 | Serveur de développement (port 3000)                                                                                |
| `pnpm build` / `pnpm preview`              | Build de production (client + SSR) / le servir                                                                      |
| `pnpm start`                               | Entrée de production : applique les migrations (seed seulement si la base est vide), puis sert le build sur `$PORT` |
| `pnpm test`                                | Tests Vitest (`pnpm exec vitest run <chemin>` pour un seul fichier)                                                 |
| `pnpm lint` / `pnpm format` / `pnpm check` | ESLint / Prettier + ESLint --fix / vérification Prettier                                                            |
| `pnpm db:generate`                         | Génère une migration Drizzle dans `drizzle/` à partir de `src/features/data/db/schema.ts`                           |
| `pnpm db:migrate` / `pnpm db:push`         | Applique les migrations / pousse le schéma directement (dev)                                                        |
| `pnpm db:seed` / `pnpm db:setup`           | Insère le contenu par défaut / `db:push` + `db:seed`                                                                |
| `pnpm db:transfer <fichier.db> [--force]`  | Copie ponctuelle de l'ancienne base SQLite (Railway) vers Neon — voir `DEPLOY.md`                                   |

Ajouter un composant shadcn : `pnpm dlx shadcn@latest add <composant>`.

## Organisation

```
src/
├── features/
│   ├── data/        # types, schémas Zod, seed, accès BD (db/) et Server Functions (server/)
│   ├── portfolio/   # sections du site public
│   ├── admin/       # tableau de bord
│   └── i18n/        # messages FR/EN (Paraglide)
├── components/      # ui/ (shadcn), shared/, layout/
├── routes/          # routes TanStack (index, admin/*)
└── server.ts        # entrée SSR (middleware Paraglide)
scripts/             # migrate (démarrage prod), seed, transfert SQLite → Neon
drizzle/             # migrations SQL générées
```

Le contenu modifiable forme un seul objet `PortfolioData`. Toute modification passe par une
action nommée (`dispatch`) qui appelle une Server Function validée par Zod ; le cache TanStack
Query est mis à jour de façon optimiste, puis resynchronisé avec la base. Les détails
d'architecture et les conventions du projet sont dans [`CLAUDE.md`](CLAUDE.md).

## Administration

`/admin` est protégé par `ADMIN_PASSWORD` (session conservée dans `sessionStorage`). On y gère
tout le contenu, l'ordre des projets et expériences (glisser-déposer), les traductions anglaises
optionnelles, les messages de contact, ainsi que l'export / import JSON et la réinitialisation
au contenu par défaut.

## Déploiement

Render (runtime Node natif, `render.yaml`) + Neon. La procédure complète — configuration Neon,
transfert des données depuis Railway, création du service Render et bascule — est décrite dans
[`DEPLOY.md`](DEPLOY.md).
