import { Link } from 'react-router-dom'
import { ARTICLES } from './articles'

export default function Writings() {
  return (
    <div className="link-list">
      {ARTICLES.map((e) => (
        <div key={e.id} className="link-row">
          <Link className="link-item" to={`/writings/${e.id}`}>
            {e.title}
          </Link>
          <span className="link-meta">{e.date}</span>
        </div>
      ))}
    </div>
  )
}
