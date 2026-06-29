import { useRef, useEffect } from 'react'

function AsciiCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const lines = text.split('\n')
        const fontSize = 10
        const lineHeight = fontSize * 1.05
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
        const finalH = Math.ceil(finalLines.length * lineHeight)

        canvas.width = w
        canvas.height = finalH
        canvas.style.width = '100%'
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
  }, [src])

  return (
    <canvas ref={canvasRef} style={{ display: 'block' }} />
  )
}

export default function OnCertainty() {
  return (
    <div className="article-contained">
      <h1 className="article-title">on certainty</h1>
      <div className="article-image" style={{ padding: 0, background: 'none', border: 'none' }}>
        <AsciiCanvas src="/other-eye.txt" />
      </div>
      <div className="article-body">
        <p>
          when starting anything we hold a standard in our heads that a pursuit should be certain, and an output should be measured. we cling on to the idea that our current vantage point is enough to optimize for an outcome. yet our worldview is formed by fragments of people whove built their own scaffold from bottom up. if everyone comes across certain, then our worldview becomes corrupted with expectation.
        </p>
        <p>
          meaning is a proxy for certainty. when approaching certainty we put meaning at the forefront of our thought (what is my purpose? is my direction right? why am i doing this?). and this feeds into the fallacy that direction/certainty/purpose comes before taking the first 10,000 steps.
        </p>
        <p>
          the reality to me, seems that meaning shouldn't be the center of human existence. rather it should be approached as a question that answers itself the more one buys into the cycle of movement and change. as perspective is gained and lost, the question of meaning deepens and so does the answer. to me, this is the source of wisdom and certainty.
        </p>
        <p>
          the point being that this whole idea of certainty is something we justify on the grounds of someone else's perspective rather than trusting our own thought. were so accustomed to looking at the world through someone else's eyes that we forget to see the present through our own. when we do so certainty -- bolstered by right, wrong and should be's -- crumbles.
        </p>
        <p>
          who are we to predict the future when we have incomplete information, and our perspective is shallow. there is way too much advice about success, metaphysics, mentalism, discipline, motivation, to get caught up in. yet none of this means anything without foundation.
        </p>
        <p>
          and i think this foundation starts by making a decision with our own eyes.
        </p>
      </div>
    </div>
  )
}
