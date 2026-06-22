import { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ARTICLES } from './articles'

export default function Article() {
  const { id } = useParams<{ id: string }>()
  const article = ARTICLES.find((a) => a.id === id)

  if (!article) {
    return (
      <div className="sub-page article-page">
        <p>not found.</p>
        <Link to="/thoughts" className="back-link">thoughts</Link>
      </div>
    )
  }

  const Component = article.component

  return (
    <div className="sub-page article-page">
      <Link to="/thoughts" className="back-link">thoughts</Link>
      <Suspense fallback={<div className="article-loading">...</div>}>
        <Component />
      </Suspense>
    </div>
  )
}
