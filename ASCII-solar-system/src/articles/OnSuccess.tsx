import { useRef, useEffect } from 'react'

const crownBreatheKeyframes = `
@keyframes crownBreathe {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.03); filter: brightness(1.3); }
}`

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
    <>
      <style>{crownBreatheKeyframes}</style>
      <div
        style={{
          transformOrigin: 'center',
          animation: 'crownBreathe 2s ease-in-out infinite',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
      </div>
    </>
  )
}

export default function OnSuccess() {
  return (
    <>
      <h1 className="article-title">on success</h1>
      <div className="article-meta">march 2026</div>
      <div className="article-image">
        <AsciiCanvas src="/crown.txt" maxWidth={350} />
      </div>
      <div className="article-body">
        <p>
          success walks a tightrope that lies in careful balance between everything.
        </p>
        <p>
          if you're someone who can't turn off their mind, then you understand the feeling
          when you start ruminating over every decision. you probably understand the feeling
          of wanting to do everything, but also know that to actually obsess you need to
          simplify, sacrifice, and commit.
        </p>
        <p>
          and i've been witnessing this moment over and over: where my mind becomes split in
          a million different directions because a sense of fear starts taking a hold of my
          senses. these cycles have stunted me.
        </p>
        <p>
          i'm learning that this feeling will never go away, which is why it is so important
          to accept it, because working through uncertainty is where true magic happens.
        </p>
        <p>
          everyone wants financial freedom, as do i. but i also crave mental freedom. and so
          i will continue sharing my thoughts as i work to achieve both.
        </p>
      </div>
    </>
  )
}
