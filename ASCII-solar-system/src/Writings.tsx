import { Suspense, useState } from 'react'
import { ARTICLES } from './articles'

export default function Writings() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [clickedIds, setClickedIds] = useState<Set<string>>(new Set())
  const ActiveComponent = ARTICLES.find((e) => e.id === openId)?.component

  function handleClick(id: string) {
    setClickedIds((prev) => new Set(prev).add(id))
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="thoughts-layout">
      <div className="thoughts-list">
        {ARTICLES.map((e) => (
          <div key={e.id} className="link-row">
            <span
              className={`link-item${openId === e.id ? ' active' : ''}${clickedIds.has(e.id) ? ' clicked' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleClick(e.id)}
            >
              {e.title}
            </span>
            <span className="link-meta">{e.date}</span>
          </div>
        ))}
      </div>
      {ActiveComponent && (
        <div className="thoughts-content">
          <Suspense fallback={<div className="article-loading">...</div>}>
            <ActiveComponent />
          </Suspense>
        </div>
      )}
    </div>
  )
}
