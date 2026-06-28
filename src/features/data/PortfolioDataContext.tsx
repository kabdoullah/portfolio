import { createContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Dispatch, ReactNode } from 'react'
import { getDefaultData } from '#/features/data/defaults'
import { exportDataAsJson, importDataFromJson } from '#/features/data/storage'
import {
  PORTFOLIO_DATA_KEY,
  portfolioDataQueryOptions,
} from '#/features/data/portfolioQuery'
import {
  createProject,
  deleteProject,
  reorderProjects,
  updateProject,
} from '#/features/data/server/projects'
import {
  createExperience,
  deleteExperience,
  reorderExperiences,
  updateExperience,
} from '#/features/data/server/experiences'
import {
  createSkill,
  deleteSkill,
  updateSkill,
} from '#/features/data/server/skills'
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from '#/features/data/server/education'
import { updatePersonalInfo } from '#/features/data/server/settings'
import { importPortfolioData, resetToDefaults } from '#/features/data/server/data'
import type {
  Education,
  Experience,
  PersonalInfo,
  PortfolioData,
  Project,
  Skill,
} from '#/features/data/types'

// Command pattern, preserved across the SQLite migration: every mutation is an
// explicit, named action. The public shape of `dispatch` is unchanged so no
// consuming component had to change — only the implementation moved from a
// localStorage reducer to Server Functions (DB writes) behind TanStack Query.
export type DataAction =
  | { type: 'UPDATE_PERSONAL_INFO'; payload: PersonalInfo }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'REORDER_PROJECTS'; payload: string[] }
  | { type: 'ADD_EXPERIENCE'; payload: Experience }
  | { type: 'UPDATE_EXPERIENCE'; payload: Experience }
  | { type: 'DELETE_EXPERIENCE'; payload: string }
  | { type: 'REORDER_EXPERIENCES'; payload: string[] }
  | { type: 'ADD_SKILL'; payload: Skill }
  | { type: 'UPDATE_SKILL'; payload: Skill }
  | { type: 'DELETE_SKILL'; payload: string }
  | { type: 'ADD_EDUCATION'; payload: Education }
  | { type: 'UPDATE_EDUCATION'; payload: Education }
  | { type: 'DELETE_EDUCATION'; payload: string }
  | { type: 'IMPORT_DATA'; payload: PortfolioData }
  | { type: 'RESET_TO_DEFAULTS' }

/** Route one named action to its Server Function. Returns the write promise. */
function runAction(action: DataAction): Promise<unknown> {
  switch (action.type) {
    case 'UPDATE_PERSONAL_INFO':
      return updatePersonalInfo({ data: action.payload })

    case 'ADD_PROJECT':
      return createProject({ data: action.payload })
    case 'UPDATE_PROJECT':
      return updateProject({ data: action.payload })
    case 'DELETE_PROJECT':
      return deleteProject({ data: action.payload })
    case 'REORDER_PROJECTS':
      return reorderProjects({ data: action.payload })

    case 'ADD_EXPERIENCE':
      return createExperience({ data: action.payload })
    case 'UPDATE_EXPERIENCE':
      return updateExperience({ data: action.payload })
    case 'DELETE_EXPERIENCE':
      return deleteExperience({ data: action.payload })
    case 'REORDER_EXPERIENCES':
      return reorderExperiences({ data: action.payload })

    case 'ADD_SKILL':
      return createSkill({ data: action.payload })
    case 'UPDATE_SKILL':
      return updateSkill({ data: action.payload })
    case 'DELETE_SKILL':
      return deleteSkill({ data: action.payload })

    case 'ADD_EDUCATION':
      return createEducation({ data: action.payload })
    case 'UPDATE_EDUCATION':
      return updateEducation({ data: action.payload })
    case 'DELETE_EDUCATION':
      return deleteEducation({ data: action.payload })

    case 'IMPORT_DATA':
      return importPortfolioData({ data: action.payload })
    case 'RESET_TO_DEFAULTS':
      return resetToDefaults()
  }
}

/** Reorder a list to match `orderedIds`, re-numbering `order` to the new index. */
function reorderById<T extends { id: string; order: number }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return orderedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined)
    .map((item, index) => ({ ...item, order: index }))
}

const upsertById = <T extends { id: string }>(items: T[], next: T): T[] =>
  items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next]

const removeById = <T extends { id: string }>(items: T[], id: string): T[] =>
  items.filter((item) => item.id !== id)

/**
 * Apply an action to a `PortfolioData` snapshot — the optimistic mirror of the
 * Server Functions in `runAction`. Lets the cache reflect a write instantly
 * (before the round-trip lands), so admin edits feel immediate on a slow remote
 * DB. `onSettled` still invalidates, so the server stays the final authority and
 * any divergence (e.g. server-assigned ordering) is reconciled on refetch.
 */
function applyAction(data: PortfolioData, action: DataAction): PortfolioData {
  const base: PortfolioData = { ...data, lastUpdated: new Date().toISOString() }
  switch (action.type) {
    case 'UPDATE_PERSONAL_INFO':
      return { ...base, personalInfo: action.payload }

    case 'ADD_PROJECT':
    case 'UPDATE_PROJECT':
      return { ...base, projects: upsertById(base.projects, action.payload) }
    case 'DELETE_PROJECT':
      return { ...base, projects: removeById(base.projects, action.payload) }
    case 'REORDER_PROJECTS':
      return { ...base, projects: reorderById(base.projects, action.payload) }

    case 'ADD_EXPERIENCE':
    case 'UPDATE_EXPERIENCE':
      return { ...base, experiences: upsertById(base.experiences, action.payload) }
    case 'DELETE_EXPERIENCE':
      return { ...base, experiences: removeById(base.experiences, action.payload) }
    case 'REORDER_EXPERIENCES':
      return { ...base, experiences: reorderById(base.experiences, action.payload) }

    case 'ADD_SKILL':
    case 'UPDATE_SKILL':
      return { ...base, skills: upsertById(base.skills, action.payload) }
    case 'DELETE_SKILL':
      return { ...base, skills: removeById(base.skills, action.payload) }

    case 'ADD_EDUCATION':
    case 'UPDATE_EDUCATION':
      return { ...base, education: upsertById(base.education, action.payload) }
    case 'DELETE_EDUCATION':
      return { ...base, education: removeById(base.education, action.payload) }

    case 'IMPORT_DATA':
      return action.payload
    case 'RESET_TO_DEFAULTS':
      return getDefaultData()
  }
}

export interface PortfolioDataContextValue {
  data: PortfolioData
  dispatch: Dispatch<DataAction>
  /** True once real data has been read from the database (vs. seed defaults). */
  isHydrated: boolean
  exportData: () => void
  importData: (file: File) => Promise<void>
  resetData: () => void
}

export const PortfolioDataContext =
  createContext<PortfolioDataContextValue | null>(null)

export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const query = useQuery(portfolioDataQueryOptions)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PORTFOLIO_DATA_KEY })

  // One mutation funnels every action. The cache is updated optimistically so
  // the UI reflects the write immediately (no wait for the round-trip on a slow
  // remote DB); on error we roll back to the pre-mutation snapshot, and we
  // always invalidate on settle so the server remains the final authority.
  const mutation = useMutation({
    mutationFn: runAction,
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: PORTFOLIO_DATA_KEY })
      const previous = queryClient.getQueryData<PortfolioData>(PORTFOLIO_DATA_KEY)
      queryClient.setQueryData<PortfolioData>(
        PORTFOLIO_DATA_KEY,
        applyAction(previous ?? getDefaultData(), action),
      )
      return { previous }
    },
    onError: (_error, _action, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(PORTFOLIO_DATA_KEY, context.previous)
      }
    },
    onSettled: () => invalidate(),
  })

  // SSR / first paint shows the seed defaults (the DB may not be loaded yet),
  // matching the previous localStorage behaviour and avoiding hydration drift.
  const data = query.data ?? getDefaultData()

  const value: PortfolioDataContextValue = {
    data,
    isHydrated: query.isSuccess,
    // Same signature as the old reducer dispatch (fire-and-forget, void).
    dispatch: (action) => {
      mutation.mutate(action)
    },
    exportData: () => exportDataAsJson(data),
    importData: async (file: File) => {
      // Validate the JSON client-side first (clear error to the user), then the
      // Server Function validates again before touching the DB.
      const imported = await importDataFromJson(file)
      await importPortfolioData({ data: imported })
      await invalidate()
    },
    resetData: () => {
      mutation.mutate({ type: 'RESET_TO_DEFAULTS' })
    },
  }

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  )
}
