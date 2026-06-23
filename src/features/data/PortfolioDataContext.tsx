import { createContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Dispatch, ReactNode } from 'react'
import { getDefaultData } from '#/features/data/defaults'
import { exportDataAsJson, importDataFromJson } from '#/features/data/storage'
import { getPortfolioData } from '#/features/data/server/portfolio-data'
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

export const PORTFOLIO_DATA_KEY = ['portfolio-data'] as const

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

  const query = useQuery({
    queryKey: PORTFOLIO_DATA_KEY,
    queryFn: () => getPortfolioData(),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PORTFOLIO_DATA_KEY })

  // One mutation funnels every action; the cache is refreshed on success so the
  // returned row(s) become the new source of truth without a manual merge.
  const mutation = useMutation({
    mutationFn: runAction,
    onSuccess: () => invalidate(),
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
