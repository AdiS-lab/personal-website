import { type ComponentType, lazy } from 'react'

export interface ArticleEntry {
  id: string
  title: string
  date: string
  component: ComponentType
}

export const ARTICLES: ArticleEntry[] = [
  {
    id: 'on-beauty',
    title: 'on-beauty',
    date: '2026.06.16',
    component: lazy(() => import('./OnBeauty'))
  },
  {
    id: 'on-certainty',
    title: 'on-certainty',
    date: '2026.06.29',
    component: lazy(() => import('./OnCertainty'))
  }
]
