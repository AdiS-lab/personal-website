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

export default function OnHappiness() {
  return (
    <div className="article-contained">
      <h1 className="article-title">on happiness</h1>
      <div className="article-image" style={{ padding: 0, background: 'none', border: 'none', overflow: 'hidden' }}>
        <div style={{ marginTop: '-28%' }}>
          <AsciiCanvas src="/starry-night.txt" />
        </div>
      </div>
      <div className="article-body">
        <p>
          recently ive been making a conscious effort to create a mental and physical note of all things that make me feel excited for the future. so much negativity in psycho-analysis, there's no point up to a point.
        </p>
        <p>
          1. i read through this <a href="https://paulgraham.com/greatwork.html">https://paulgraham.com/greatwork.html</a> today. it was like someone was speaking my thoughts back to me. i find a lot of reassurance when the thoughts ive been circling are crystallized from someone else's perspective. ive only read a few books that have met me where im at.
        </p>
        <p>
          2. i took melatonin, slept for 8 hours, and felt amazing in the morning. although staying up all night is fun, there's something special about waking up to a clear mind, and a rested body. its even more special when the days prior were spent staying up all night.
        </p>
        <p>
          3. im lucky to have a couple friends that i can talk to without any masks at all. its refreshing to have conversations without worrying about marketing myself, expecting something in return, or just pretending. a lot of young adulthood seems to involve artificial relationships. partly because everyone is finding themselves, partly because of FOMO, partly because of competition. i hope to become the kind of person that someone feels comfortable enough to just speak their mind.
        </p>
        <p>
          4. a good song sheds new light on the same old routine. im one of those people who believe that music has incredible power to influence the mind. a sad song has the potential to drag someone's mind through the mud or grant catharsis. a new, happy song has the potential to generate a completely different outlook on the same work. here's a note i wrote to myself a while ago:
        </p>
        <blockquote style={{ marginLeft: '2em' }}>
          "music should be a whole body experience, in the car, in speakers, it is literally encapsulating the soul and guiding it"
        </blockquote>
        <p>
          when optimism isn't forced, it becomes a genuine fervor to move forward and like all feelings, it comes and goes. i try not to take these moments for granted, because who knows how many one experiences in a lifetime. it seems that most of our time is just fumbling and bumbling in the dark until one day things somehow settle.
        </p>
      </div>
    </div>
  )
}
