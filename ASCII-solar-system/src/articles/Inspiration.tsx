import { useRef, useEffect } from 'react'

function AsciiCanvas({ src, maxWidth = 500 }: { src: string; maxWidth?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const lines = text.split('\n')
        const fontSize = 10
        const lineHeight = fontSize * 1.15
        const charWidth = fontSize * 0.6

        const maxCols = Math.max(...lines.map((l) => l.length))
        const w = Math.ceil(maxCols * charWidth)
        const h = Math.ceil(lines.length * lineHeight)

        canvas.width = w
        canvas.height = h
        canvas.style.width = '100%'
        canvas.style.maxWidth = `${maxWidth}px`
        canvas.style.height = 'auto'
        canvas.style.aspectRatio = `${w} / ${h}`

        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = '#ffffff'
        ctx.font = `${fontSize}px monospace`
        ctx.textBaseline = 'top'

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], 0, i * lineHeight)
        }
      })
  }, [src, maxWidth])

  return (
    <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
  )
}

export default function Inspiration() {
  return (
    <>
      <h1 className="article-title">inspiration</h1>
      <div className="article-meta">june 2026</div>
      <div className="article-image">
        <AsciiCanvas src="/crown.txt" maxWidth={350} />
      </div>
    </>
  )
}
