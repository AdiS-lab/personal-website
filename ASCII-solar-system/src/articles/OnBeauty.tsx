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
          most of the beauty that has been seared into my mind has come from moments of
          surrender. i look to these experiences as anchors when i feel the need to conform to
          a certain person. why? the type of beauty i am speaking of is similar to a hug from
          a distant future. no words have to be exchanged to grasp the freedom it promises.
          letting go is a concept that is hard for me to internalize; maybe one day this will
          all click.
        </p>

        <h2>night stars</h2>
        <p>
          in high school, i played baseball and part of my routine was a day of sprinting,
          plyometrics, and medicine ball drills. whether it was irresponsibility or something
          else, on these days i would routinely find myself staring at the gate leading into a
          dark, empty football field after the sun had slipped away. picture a skinny kid in
          sweatpants, a synthetic t-shirt, an arm sleeve, and cleats, shivering as he prepared
          his mind to workout. while it was cold, i distinctly remember a burning desire to
          prove something to someone - - a concept i struggled to identify back then, but a
          feeling recognizable enough to push me forward. this warmed me up enough to reject
          the idea of resting in bed.
        </p>
        <p>
          what i didn't know back then was that each drill was fueled by a sense of desperation
          so strong it would later haunt me for a bit. still, after warming up it felt magical.
          those who've run in the dark understand that point when the ground starts to slip
          away, and running turns into sprinting, which turns into floating through a space
          that stretches into blurs of light. my senses happily deceived me.
        </p>
        <p>
          this high would last for a little while, but it was the moments after exhausting
          myself that have carved out a pocket of time in my memory. as soon i took out my
          earbuds, silence opened its arms offering to cleanse me completely. the weight of
          slight rustles and general emptiness became viscerally apparent. in those moments,
          all i could do was lay down on the cold, damp turf, observing every thought dissolve
          into just awareness of my barely visible surroundings.
        </p>
        <p>
          in some shape or form i understood that in these moments of silence and solitude, i
          was stripped of my humanness and cast as a tiny observer of the stars. my
          consciousness would cycle between bewilderment and acceptance, as i imagined up a
          storm of reality, finding my senses only bound to one. beauty is like a trance, and
          i was stunned.
        </p>

        <h2>night sea</h2>
        <p>
          puerto vallarta is a city on the west coast of mexico. this place, amongst many
          others, feels like home to a collective desire to escape - - a true vacation. i can
          still vaguely grasp at memories of light arpeggios and vibrant chords moving between
          people's laughs and the cool evening air while waiting to eat dinner. during my stay,
          i would typically head back to the hotel to sleep after dinners like this. but one
          day, i couldn't. i had to clear my mind. so, as dusk drew near, i made my way
          towards the beach right outside my stay. while most people were being ushered out by
          the night, i had just taken off my shoes and stepped onto cool sand. what's amazing
          about this beach is that while darkness drew nearer, the ocean and horizon started to
          melt into one.
        </p>
        <p>
          after finding a seat on a sand mound, this fact become apparent. i was enveloped in a
          vast picture of sea and sky. the rhythm of waves led my heart to their dance. and
          when closing my eyes to temper my breath, i found my mind's eye hypnotized by the
          undulating hushes, vastness of the beach, and impossibility of being able to
          experience 'beauty' all at once. retreating into my own world, i found myself
          standing between imaginations of infinite lines of people before and after me,
          experiencing the same thing in different ways. it was almost like a lucid dream where
          reflection was encouraged, but thought about reflection was immediately washed away
        </p>

        <h2>reflection</h2>
        <p>
          as you can tell, i find a lot of beauty in existential moments. i love being reminded
          of the wonder surrounding our existence. to me, surrendering can apply to thoughts,
          expectations, and preconceptions. when we break out of a phase of tunnel vision or
          neurotic cycles, unboundedness becomes apparent, catharsis floods our bodies, and
          this is exactly when beauty appears for me.
        </p>
        <img
          src="/PuertoVallarta.jpg"
          alt="Puerto Vallarta"
          style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '2rem auto 0.5rem' }}
        />
        <p style={{ textAlign: 'center', fontStyle: 'italic' }}>puerto vallarta</p>
      </div>
    </>
  )
}
