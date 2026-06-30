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

export default function OnBeauty() {
  return (
    <div className="article-contained">
      <h1 className="article-title">on beauty</h1>
      <div className="article-image" style={{ padding: 0, background: 'none', border: 'none' }}>
        <AsciiCanvas src="/cool-rose.txt" />
      </div>
      <div className="article-body">
        <p>
          there's a night in Mexico where the horizon melts into water. waves drown out your thoughts and cool sand softens the blow of impossibility. thoughts rise and fall along with the beat of waves, ushering away all reason and rhyme into trance. awe-struck and terrified at the thought of being alive you try surrendering to this mental space in order to bask in the gut-wrenching feeling of shattered perspective. for a moment, a sense of unboundedness emerges inspired by the impossibility of existence.
        </p>
        <p>
          there's a night when jogging becomes running becomes sprinting becomes floating. the ground is barely visible and turf blurs into spots of light that only appear in your periphery. it all makes for an illusive experience, but it feels so real. as the high starts to wear, you realize you're exhausted and the music agrees. it dies appropriately, cutting off a flow of energy pumping through your veins. all that remains is silence, leaves, and some stars.
        </p>
        <p>
          I've tried hard to release thoughts, expectations, preconceptions. Through reflection, the deepest beauty I've lived through has come after surrendering these concepts. In my experience, this relies on serendipity and vulnerability. Two concepts that are best understood by forgetting they exist in the first place. from what ive seen, beauty comes in unexpected moments as a byproduct of the natural dance between clinging onto people/dreams and releasing them.
        </p>
      </div>
    </div>
  )
}
