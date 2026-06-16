import { Routes, Route, Link, useLocation } from 'react-router-dom'
import SolarSystem from './SolarSystem'
import { FolderList, VideoFolder, VideoPlayer } from './Gallery'
import Writings from './Writings'
import Article from './Article'

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
  return (
    <>
      <AsciiFrame>
        <SolarSystem />
      </AsciiFrame>

      <div className="bio">
        <p>
          studying EE at <a href="https://www.gatech.edu" target="_blank" rel="noopener noreferrer" className="bio-link">georgia tech</a>.
          here are some of my <Link className="bio-link" to="/books">favorite books</Link> and
          an <a href="https://frontendhanddraw.vercel.app/" target="_blank" rel="noopener noreferrer" className="bio-link">app i built</a>.
        </p>
        <p>
          i believe software should be a magical experience.
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
      <FolderList />
    </div>
  )
}

function WritingsPage() {
  return (
    <div className="sub-page">
      <div className="sub-page-title">writings</div>
      <Writings />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)
  console.log(pathParts)
  console.log(location.pathname)

  const isDetail =
    (pathParts[0] === 'writings' && pathParts.length >= 2) ||
    (pathParts[0] === 'videos' && pathParts.length >= 3)

  return (
    <div className="page">
      {!isDetail && (
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
              className={`nav-link${location.pathname.startsWith('/writings') ? ' active' : ''}`}
              to="/writings"
            >
              writings
            </Link>
          </nav>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/videos/:folderId" element={<VideoFolder />} />
        <Route path="/videos/:folderId/:videoId" element={<VideoPlayer />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/writings" element={<WritingsPage />} />
        <Route path="/writings/:id" element={<Article />} />
      </Routes>
    </div>
  )
}
