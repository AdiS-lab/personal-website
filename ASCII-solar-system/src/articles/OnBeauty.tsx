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

        const trimmedLines = lines.map((l) => l.trimEnd())
        const nonEmptyLines = trimmedLines.filter((l) => l.length > 0)
        const firstNonEmpty = trimmedLines.findIndex((l) => l.length > 0)
        const lastNonEmpty = trimmedLines.length - 1 - [...trimmedLines].reverse().findIndex((l) => l.length > 0)
        const croppedLines = trimmedLines.slice(firstNonEmpty, lastNonEmpty + 1)
        const minIndent = Math.min(...nonEmptyLines.map((l) => l.length - l.trimStart().length))
        const finalLines = croppedLines.map((l) => l.slice(minIndent))
        const maxCols = Math.max(...finalLines.map((l) => l.length))
        const w = Math.ceil(maxCols * charWidth)
        // const h = Math.ceil(lines.length * lineHeight)

        const finalH = Math.ceil(finalLines.length * lineHeight)
        canvas.width = w
        canvas.height = finalH
        canvas.style.width = '100%'
        canvas.style.maxWidth = `${maxWidth}px`
        canvas.style.height = 'auto'
        canvas.style.aspectRatio = `${w} / ${finalH}`

        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, w, finalH)
        ctx.fillStyle = '#ffffff'
        ctx.font = `${fontSize}px monospace`
        ctx.textBaseline = 'top'

        for (let i = 0; i < finalLines.length; i++) {
          ctx.fillText(finalLines[i], 0, i * lineHeight)
        }
      })
  }, [src, maxWidth])

  return (
    <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
  )
}

export default function OnBeauty() {
  return (
    <div className="article-contained">
      <h1 className="article-title">on beauty</h1>
      <div className="article-meta">june 2026</div>
      <div className="article-image">
        <AsciiCanvas src="/rose.txt" maxWidth={330} />
      </div>
      <div className="article-body">
        <p>
          there's a night in Mexico when the horizon melts into water. waves drown out your
          thoughts and cool sand softens the blow of impossibility. thoughts rise and fall along
          with the beat of waves, ushering you into a trance. suddenly, awe-struck and terrified
          at the thought of being alive, your mind quickly makes its way back. you refuse and try
          surrendering to this mental space. for a moment there's a sense of unboundedness. a
          freedom to strive inspired by the impossibility of existence. too much thinking.
        </p>
        <p>
          -- i go back and eat dinner. no point in dissecting my own conscious when it just
          becomes neurotic cycles
        </p>
        <p>
          there's a night when jogging becomes running becomes sprinting becomes floating. the
          ground is barely visible and blurs of light become apparent in your periphery. it all
          makes for an illusive experience, but it feels so real. as the high starts to wear, you
          realize you're exhausted and the music agrees. it dies appropriately, cutting off the
          flow of energy pumping through your veins. all that remains is silence, leaves, and some
          stars.
        </p>
        <p>
          -- im too tired to think. i let go, lie down and observe. surrendering sobers the
          thought of impossibility, and allows for less thinking. i understand the immensity of
          being alive and the thought of recognizing that immensity. this feeling comes and goes.
          its much easier to reach this point after clinging onto an outcome for so long.
        </p>
        <p>
          I've tried hard to release thoughts, expectations, preconceptions. Through reflection,
          the deepest beauty I've experienced has come after surrendering these concepts. I can
          only describe the act of doing so through a foggy lens. Because, in my experience, it
          relies on serendipity and vulnerability. Two concepts that are understood by directing
          attention somewhere other than beauty itself. In other words, beauty seems to emerge in
          unexpected moments as a byproduct of the natural tendency to cling onto people, dreams, 
          duty and release them.
        </p>
      </div>
    </div>
  )
}
