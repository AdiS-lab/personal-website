import { Suspense, useState } from 'react'
import { ARTICLES } from './articles'

export default function Writings() {
  const [openId, setOpenId] = useState<string | null>(null)
  const ActiveComponent = ARTICLES.find((e) => e.id === openId)?.component

  return (
    <div className="thoughts-layout">
      <div className="thoughts-list">
        {ARTICLES.map((e) => (
          <div key={e.id} className="link-row">
            <span
              className={`link-item${openId === e.id ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenId(openId === e.id ? null : e.id)}
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
