import { createContext, useEffect, useReducer, useRef } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { getDefaultData } from '#/features/data/defaults'
import {
  exportDataAsJson,
  importDataFromJson,
  loadPortfolioData,
  savePortfolioData,
} from '#/features/data/storage'
import type {
  Education,
  Experience,
  PersonalInfo,
  PortfolioData,
  Project,
  Skill,
} from '#/features/data/types'

// Command pattern: every mutation is an explicit, named action. UI never mutates
// state directly — it dispatches one of these and the provider persists the result.
export type DataAction =
  | { type: 'HYDRATE'; payload: PortfolioData }
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

/** Apply an `order` index derived from the position of each id in `orderedIds`. */
function applyOrder<T extends { id: string; order: number }>(
  items: T[],
  orderedIds: string[],
): T[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]))
  return [...items]
    .map((item) => ({ ...item, order: rank.get(item.id) ?? item.order }))
    .sort((a, b) => a.order - b.order)
}

export function portfolioDataReducer(
  state: PortfolioData,
  action: DataAction,
): PortfolioData {
  switch (action.type) {
    case 'HYDRATE':
    case 'IMPORT_DATA':
      return action.payload
    case 'RESET_TO_DEFAULTS':
      return getDefaultData()
    case 'UPDATE_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload }

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      }
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
      }
    case 'REORDER_PROJECTS':
      return { ...state, projects: applyOrder(state.projects, action.payload) }

    case 'ADD_EXPERIENCE':
      return { ...state, experiences: [...state.experiences, action.payload] }
    case 'UPDATE_EXPERIENCE':
      return {
        ...state,
        experiences: state.experiences.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      }
    case 'DELETE_EXPERIENCE':
      return {
        ...state,
        experiences: state.experiences.filter((e) => e.id !== action.payload),
      }
    case 'REORDER_EXPERIENCES':
      return {
        ...state,
        experiences: applyOrder(state.experiences, action.payload),
      }

    case 'ADD_SKILL':
      return { ...state, skills: [...state.skills, action.payload] }
    case 'UPDATE_SKILL':
      return {
        ...state,
        skills: state.skills.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      }
    case 'DELETE_SKILL':
      return {
        ...state,
        skills: state.skills.filter((s) => s.id !== action.payload),
      }

    case 'ADD_EDUCATION':
      return { ...state, education: [...state.education, action.payload] }
    case 'UPDATE_EDUCATION':
      return {
        ...state,
        education: state.education.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      }
    case 'DELETE_EDUCATION':
      return {
        ...state,
        education: state.education.filter((e) => e.id !== action.payload),
      }

    default:
      return state
  }
}

export interface PortfolioDataContextValue {
  data: PortfolioData
  dispatch: Dispatch<DataAction>
  /** True once client-side data has been read from localStorage. */
  isHydrated: boolean
  exportData: () => void
  importData: (file: File) => Promise<void>
  resetData: () => void
}

export const PortfolioDataContext =
  createContext<PortfolioDataContextValue | null>(null)

export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  // SSR-safe: render defaults on the server and first client paint to avoid a
  // hydration mismatch, then load real data from localStorage after mount.
  const [data, dispatch] = useReducer(
    portfolioDataReducer,
    undefined,
    getDefaultData,
  )
  const hydratedRef = useRef(false)

  useEffect(() => {
    dispatch({ type: 'HYDRATE', payload: loadPortfolioData() })
    hydratedRef.current = true
  }, [])

  // Persist on every change, but only after hydration so we never overwrite
  // stored data with the SSR defaults.
  useEffect(() => {
    if (!hydratedRef.current) return
    savePortfolioData(data)
  }, [data])

  const value: PortfolioDataContextValue = {
    data,
    dispatch,
    isHydrated: hydratedRef.current,
    exportData: () => exportDataAsJson(data),
    importData: async (file: File) => {
      const imported = await importDataFromJson(file)
      dispatch({ type: 'IMPORT_DATA', payload: imported })
    },
    resetData: () => dispatch({ type: 'RESET_TO_DEFAULTS' }),
  }

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  )
}
