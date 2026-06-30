import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import SolarSystem from './SolarSystem'
import Writings from './Writings'

function AsciiFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="solar-frame">
      <div className="frame-corner-row">
        <span className="frame-corner">+</span>
        <span className="frame-dash" />
        <span className="frame-corner">+</span>
      </div>
      <div className="frame-body">
        <span className="frame-pipe" />
        <div className="frame-canvas">{children}</div>
        <span className="frame-pipe" />
      </div>
      <div className="frame-corner-row">
        <span className="frame-corner">+</span>
        <span className="frame-dash" />
        <span className="frame-corner">+</span>
      </div>
    </div>
  )
}

function Home() {
  const [clicked, setClicked] = useState<Set<string>>(new Set())
  const cl = (id: string) => `bio-link${clicked.has(id) ? ' clicked' : ''}`
  const mark = (id: string) => () => setClicked((prev) => new Set(prev).add(id))

  return (
    <>
      <div>
        <AsciiFrame>
          <SolarSystem />
        </AsciiFrame>
      </div>

      <div className="bio">
        <p>
          i'm studying EE at georgia tech. i strive towards <a href="https://emersoncentral.com/texts/essays-first-series/spiritual-laws/" target="_blank" rel="noopener noreferrer" className={cl('this')} onClick={mark('this')}>this</a> as a life philosophy and currently im interested in fullstack dev + computer graphics. i believe interacting with software should be magic. find me here adi [at] gmail.com -- <a href="https://www.linkedin.com/in/adi-shankar-7268b7311/" target="_blank" rel="noopener noreferrer" className={cl('linkedin')} onClick={mark('linkedin')}>linkedin</a> -- <a href="https://github.com/AdiS-lab" target="_blank" rel="noopener noreferrer" className={cl('github')} onClick={mark('github')}>github</a>
        </p>
      </div>
    </>
  )
}

const BOOKS = [
  { title: 'The Surrender Experiment', author: 'Michael Singer' },
  { title: 'Mans Search for Meaning', author: 'Victor E Frankl' },
  { title: 'Until the End of Time', author: 'Brian Greene' },
  { title: 'Mere Christianity', author: 'CS Lewis' },
]

function BooksPage() {
  return (
    <div className="sub-page">
      <div className="sub-page-title">books</div>
      <div className="link-list">
        {BOOKS.map((b) => (
          <div key={b.title} className="link-row">
            <span className="link-item-static">{b.title}</span>
            <span className="link-meta">{b.author}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideosPage() {
  return (
    <div className="sub-page">
      <div className="sub-page-title">videos</div>
      <p style={{ fontSize: '13px', color: '#555' }}>coming soon</p>
    </div>
  )
}

function WritingsPage() {
  return (
    <div className="sub-page">
      <div className="sub-page-title">thoughts</div>
      <Writings />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)
  console.log(pathParts)
  console.log(location.pathname)

  return (
    <div className="page">
      {(
        <header className="header">
          <div className="header-left">
            <Link className="header-name" to="/">
              Adi Shankar
            </Link>
          </div>
          <nav className="header-nav">
            <Link
              className={`nav-link${location.pathname.startsWith('/videos') ? ' active' : ''}`}
              to="/videos"
            >
              videos
            </Link>
            <Link
              className={`nav-link${location.pathname.startsWith('/thoughts') ? ' active' : ''}`}
              to="/thoughts"
            >
              thoughts
            </Link>
          </nav>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/thoughts" element={<WritingsPage />} />
      </Routes>
    </div>
  )
}
