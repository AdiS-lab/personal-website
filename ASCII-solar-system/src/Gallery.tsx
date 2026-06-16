import { Link, useParams } from 'react-router-dom'

interface VideoEntry {
  id: string
  title: string
  src: string
}

interface Folder {
  id: string
  title: string
  videos: VideoEntry[]
}
// ________________ main idea is when rendering out nested/bunch of links just create an arr of objects to refer to ___________
const FOLDERS: Folder[] = [
  {
    id: 'mt-tam-2026',
    title: 'mt_tam_2026/',
    videos: [
      { id: 'beautiful-walk', title: 'beautiful_walk.mp4', src: '/videos/BeautifulWalk.mp4' },
      { id: 'me', title: 'me.mp4', src: '/videos/Me.mp4' },
      { id: 'mt-tam', title: 'mt_tam.mp4', src: '/videos/MtTam.mp4' },
    ],
  },
  {
    id: 'other',
    title: 'other/',
    videos: [
      { id: 'water', title: 'water.mp4', src: '/videos/Water.mp4' },
      { id: 'san-francisco', title: 'san_francisco.mp4', src: '/videos/ANMR0129.mp4' },
      { id: 'atlanta', title: 'atlanta.mp4', src: '/videos/ANMR0272.mp4' },
    ],
  },
]

export function FolderList() {
  return (
    <div className="link-list">
      {FOLDERS.map((f) => (
        <div key={f.id} className="link-row">
          <Link className="link-item" to={`/videos/${f.id}`}>
            {f.title}
          </Link>
        </div>
      ))}
    </div>
  )
}

// find the folder and then render out the list. 
export function VideoFolder() {
  const { folderId } = useParams<{ folderId: string }>()
  const folder = FOLDERS.find((f) => f.id === folderId)

  if (!folder) {
    return (
      <div className="sub-page">
        <Link to="/videos" className="back-link">videos</Link>
        <p>not found.</p>
      </div>
    )
  }

  return (
    <div className="sub-page">
      <Link to="/videos" className="back-link">videos</Link>
      <div className="sub-page-title">{folder.title}</div>
      <div className="link-list">
        {folder.videos.map((v) => (
          <div key={v.id} className="link-row">
            <Link className="link-item" to={`/videos/${folderId}/${v.id}`}>
              {v.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VideoPlayer() {
  const { folderId, videoId } = useParams<{ folderId: string; videoId: string }>()
  const folder = FOLDERS.find((f) => f.id === folderId)
  const video = folder?.videos.find((v) => v.id === videoId)

  if (!folder || !video) {
    return (
      <div className="sub-page video-page">
        <Link to="/videos" className="back-link">videos</Link>
        <p>not found.</p>
      </div>
    )
  }

  return (
    <div className="sub-page video-page">
      <Link to={`/videos/${folderId}`} className="back-link">{folder.title.replace('/', '')}</Link>
      <video
        className="video-player"
        src={video.src}
        autoPlay
        loop
        muted
        playsInline
        controls
      />
    </div>
  )
}
