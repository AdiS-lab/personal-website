import { useRef, useEffect } from 'react'

const roseBreatheKeyframes = `
@keyframes roseBreathe {
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
      <style>{roseBreatheKeyframes}</style>
      <div
        style={{
          transformOrigin: 'center',
          animation: 'roseBreathe 2s ease-in-out infinite',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
      </div>
    </>
  )
}

export default function OnBeauty() {
  return (
    <>
      <h1 className="article-title">on beauty</h1>
      <div className="article-meta">june 2026</div>
      <div className="article-image">
        <AsciiCanvas src="/rose.txt" maxWidth={350} />
      </div>
      <div className="article-body">
        <h2>pockets of time</h2>
        <p>
          most of the beauty seared into my mind has come from moments of surrender. i look
          to these experiences as anchors whenever i feel the pressure to conform to a certain
          persona. why? the type of beauty i am speaking of feels like a hug from a distant
          future. no words need to be exchanged to grasp the freedom it promises. letting go
          is a concept that is hard for me to internalize; maybe one day this will all click.
        </p>

        <h2>night stars</h2>
        <p>
          in high school, i played baseball. part of my routine involved sprinting,
          plyometrics, and medicine ball drills. because i never managed my time well, i
          routinely found myself staring at the gate leading into a dark, empty football field
          long after the sun had slipped away. picture a skinny kid in sweatpants, a synthetic
          t-shirt, an arm sleeve, and cleats, shivering as he unlocked a supposedly locked
          gate. while it was cold, i distinctly remember a burning desire to prove something
          to someone -- a concept i struggled to identify back then, but a feeling
          recognizable enough to push me forward. this warmed me up enough to reject any
          notion of resting in bed.
        </p>
        <p>
          what i didn't know back then was that each drill was laden with a desperation so
          strong it would later turn into psychological torment. still, it felt magical in the
          moment. those who have run in the dark understand that point when the ground starts
          to slip away -- when running turns into sprinting, and sprinting turns into floating
          through a space that stretches into blurs of light. my senses happily deceived me,
          and the music pumped into my veins only added to the experience.
        </p>
        <p>
          this high would last for a little while, but it was the moments after exhausting
          myself that carved out a permanent pocket of time in my head. as i took out my
          earbuds, silence opened its arms, offering to cleanse me completely. i obliged, and
          as i did, the weight of slight rustles became viscerally apparent. in those moments,
          all i could do was lie down on the cold, damp turf, observing every thought dissolve
          into a pure awareness of my barely visible surroundings.
        </p>
        <p>
          i understood that i was only an observer -- stripped of my humanness but granted
          access to a state of peace. bewilderment was continuously met with acceptance as i
          cycled through the complex emotions of believing in mutability while observing only
          immutability. a conscious entity imagining up a storm of reality, yet bound to only
          one, is justified in its neurotic tendencies. beauty is a trance, and i felt strung
          along.
        </p>

        <h2>night sea</h2>
        <p>
          puerto vallarta is a city on the west coast of mexico. this place, amongst many
          others, feels like home to a collective desire to escape -- a true vacation. i can
          still vaguely grasp memories of a ukulele meeting an audience. no doubt it makes for
          a lively experience, but what struck me most is how gracefully light arpeggios and
          vibrant chords moved between the laughter of people and the cool evening air. music
          and people resonating with each other created an overwhelming sense of longing.
        </p>
        <p>
          anyway, during my stay, i would typically head back to the hotel to sleep after
          dinner. but one day, i couldn't. i had to clear my mind. so, as dusk drew near, i
          headed toward the beach accessible by foot. while most people were being ushered out
          by the night, i had just taken off my shoes and stepped onto what was now cool sand.
          what is amazing about this beach is that as darkness drew nearer, the ocean and
          horizon started to melt into one.
        </p>
        <p>
          as i found my seat on a mound by the waves, i found myself enveloped in a vast
          picture of sea and sky. as the last stragglers left, i let the rhythm of the waves
          lead my heart along while closing my eyes to temper my breath. except for the
          occasional distant shout, my mind's eye was hypnotized by the light crashes of waves
          against the shore. retreating into a world of peace, i found myself sitting between
          infinite possibilities ahead and infinite history behind. in many ways, it felt like
          a celestial slumber where reflection was encouraged, but thinking about reflection
          wasn't.
        </p>

        <h2>reflection</h2>
        <p>
          as you can tell, i find a lot of beauty in existential moments -- places and
          experiences that remind me of the wonder of being here at all. to me, surrendering
          can apply to thoughts, expectations, and preconceptions. whatever the case may be,
          there is always novelty to be found when we break dogma. breaking out of tunnel
          vision or escaping repetitive cycles is when unboundedness becomes apparent, and
          this is exactly when beauty appears for me.
        </p>
      </div>
    </>
  )
}
