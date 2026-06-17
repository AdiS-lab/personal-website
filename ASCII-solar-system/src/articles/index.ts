import { type ComponentType, lazy } from 'react'

export interface ArticleEntry {
  id: string
  title: string
  date: string
  component: ComponentType
}

export const ARTICLES: ArticleEntry[] = [
  // {
  //   id: 'on-success',
  //   title: 'on-success',
  //   date: '2026.03',
  //   component: lazy(() => import('./OnSuccess')),
  // },
  {
    id: 'on-beauty',
    title: 'on-beauty',
    date: '2026.06.16',

    component: lazy(() => import('./OnBeauty'))
  }
]
