# Design Notes

## Solar System Camera & Sun Style (User Loves This)
- **Camera**: Nearly top-down, looking straight down at the sun
  - Position: `[0, 16 * SCALE, 0.5 * SCALE]` where SCALE=3 → `[0, 48, 1.5]`
  - FOV: 45, near: 0.1, far: 1000
  - The wave field fills the entire container, sun centered
- **Sun glow**: Warm vintage tint via custom fragment shader `SUN_FS`
  - Color: `vec3(1.0, 0.95, 0.85) * 1.6` — bright warm white, high contrast against dark field
  - Applied to both sun surface particles and flare particles via `createSunMaterial()`
  - Rest of the scene (planets, wave field) uses standard white shader `PARTICLE_FS`
- **Sun label**: Pure white `#ffffff` (other planet labels use `#aaaaaa`)
  - Conditional in `createLabelTexture()`: `name === 'Sun' ? '#ffffff' : '#aaaaaa'`

## ASCII Canvas Breathe/Shimmer Animation
- Used in OnBeauty (rose) and OnSuccess (crown) articles
- Each file has its own `AsciiCanvas` component (duplicated, not shared)
- Animation runs automatically on page load (not hover-triggered)
- Keyframes: `scale(1) brightness(1)` → `scale(1.03) brightness(1.3)`, 2s ease-in-out infinite
- Canvas renders ASCII art from `.txt` files in `/public/`
- Font: 10px monospace, lineHeight 1.15, charWidth 0.6

## Bio Section (App.tsx)
- Single paragraph, no line breaks between sentences
- "georgia tech" is plain text (no link)
- "Electrical Engineering" spelled out (not "EE")
- Links: favorite books (internal), app i built, linkedin, github

## Color Palette
- Background: `#0d0d0d`
- Sun particles: warm white `rgb(255, 243, 218)` at 1.6x brightness
- Planet/wave particles: pure white
- Planet labels: `#aaaaaa`, Sun label: `#ffffff`
