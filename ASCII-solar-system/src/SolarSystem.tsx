import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
//  Constants
// ============================================================

const SCALE = 3
const SUN_R = 2 * SCALE
const CHARS = [' ', '.', ':', '*', '+', '#', '%', '@']
const CHAR_COUNT = CHARS.length
const CELL_SIZE = 64

// Wave parameters — gentle, delicate ripples
const WAVE_FREQ = 0.55
const WAVE_SPEED = 0.5
const WAVE_AMP = 0.45

// ============================================================
//  Texture Atlas — 8 glyphs in a 512x64 canvas
// ============================================================

function createAtlasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CELL_SIZE * CHAR_COUNT
  canvas.height = CELL_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'white'
  ctx.font = 'bold 45px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < CHAR_COUNT; i++) {
    ctx.fillText(CHARS[i], i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  return tex
}

// ============================================================
//  JS-side 3D noise
// ============================================================

function hash3(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177 + 1013904223) | 0
  h = ((h ^ (h >>> 13)) * 1274126177) | 0
  h = ((h ^ (h >>> 16))) | 0
  return ((h & 0x7fffffff) + 1) / (0x7fffffff + 2)
}

function noise3d(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x - ix, fy = y - iy, fz = z - iz
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const sz = fz * fz * (3 - 2 * fz)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  return lerp(
    lerp(
      lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), sx),
      lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), sx),
      sy
    ),
    lerp(
      lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), sx),
      lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), sx),
      sy
    ),
    sz
  )
}

// ============================================================
//  Fibonacci sphere sampling
// ============================================================

function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * i / goldenRatio
    const phi = Math.acos(1 - 2 * (i + 0.5) / count)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
  }
  return positions
}

// ============================================================
//  Wave height helper
// ============================================================

function waveY(dist: number, time: number): number {
  return Math.sin(dist * WAVE_FREQ - time * WAVE_SPEED) * WAVE_AMP
}

function waveCharIndex(waveHeight: number): number {
  const t = (waveHeight + WAVE_AMP) / (2 * WAVE_AMP)
  return Math.max(1, Math.min(7, Math.floor(t * 6 + 1)))
}

// ============================================================
//  Shared shader code
// ============================================================

const PARTICLE_VS = /* glsl */ `
  attribute float aCharIndex;
  varying vec2 vUv;
  varying float vCharIndex;

  void main() {
    vCharIndex = aCharIndex;
    vUv = uv;

    vec3 instancePos = vec3(
      instanceMatrix[3][0],
      instanceMatrix[3][1],
      instanceMatrix[3][2]
    );
    float scaleX = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));

    vec3 worldInstancePos = (modelMatrix * vec4(instancePos, 1.0)).xyz;

    vec3 toCamera = normalize(cameraPosition - worldInstancePos);
    vec3 refUp = abs(toCamera.y) > 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(refUp, toCamera));
    vec3 up = cross(toCamera, right);

    vec3 worldPos = worldInstancePos + (right * position.x + up * position.y) * scaleX;

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
  }
`

const PARTICLE_FS = /* glsl */ `
  uniform sampler2D atlas;
  varying vec2 vUv;
  varying float vCharIndex;

  void main() {
    float idx = floor(clamp(vCharIndex, 0.0, 7.0));
    vec2 atlasUv = vec2((vUv.x + idx) / 8.0, vUv.y);
    vec4 texel = texture2D(atlas, atlasUv);
    float alpha = texel.r;
    if (alpha < 0.1) discard;
    gl_FragColor = vec4(vec3(1.8), alpha);
  }
`

// ============================================================
//  Sun glow fragment shader (warm vintage tint)
// ============================================================

const SUN_FS = /* glsl */ `
  uniform sampler2D atlas;
  varying vec2 vUv;
  varying float vCharIndex;

  void main() {
    float idx = floor(clamp(vCharIndex, 0.0, 7.0));
    vec2 atlasUv = vec2((vUv.x + idx) / 8.0, vUv.y);
    vec4 texel = texture2D(atlas, atlasUv);
    float alpha = texel.r;
    if (alpha < 0.1) discard;
    vec3 warmGlow = vec3(1.0, 0.95, 0.85) * 1.6;
    gl_FragColor = vec4(warmGlow, alpha);
  }
`

// ============================================================
//  Shared material factory
// ============================================================

function createParticleMaterial(atlas: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { atlas: { value: atlas } },
    vertexShader: PARTICLE_VS,
    fragmentShader: PARTICLE_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

function createSunMaterial(atlas: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { atlas: { value: atlas } },
    vertexShader: PARTICLE_VS,
    fragmentShader: SUN_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

const SUN_SURFACE_COUNT = 5000
const SUN_FLARE_COUNT = 1500
const PARTICLE_SIZE = 0.55

function AsciiSun({ atlas }: { atlas: THREE.Texture }) {
  const surfaceMeshRef = useRef<THREE.InstancedMesh>(null)
  const flareMeshRef = useRef<THREE.InstancedMesh>(null)

  const surfaceMaterial = useMemo(() => createSunMaterial(atlas), [atlas])
  const flareMaterial = useMemo(() => createSunMaterial(atlas), [atlas])

  const surfacePositions = useMemo(() => fibonacciSphere(SUN_SURFACE_COUNT, SUN_R), [])

  const flareData = useMemo(() => {
    const dirs = new Float32Array(SUN_FLARE_COUNT * 3)
    const speeds = new Float32Array(SUN_FLARE_COUNT)
    const phases = new Float32Array(SUN_FLARE_COUNT)
    const maxHeights = new Float32Array(SUN_FLARE_COUNT)
    for (let i = 0; i < SUN_FLARE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      dirs[i * 3] = Math.sin(phi) * Math.cos(theta)
      dirs[i * 3 + 1] = Math.cos(phi)
      dirs[i * 3 + 2] = Math.sin(phi) * Math.sin(theta)
      speeds[i] = 0.3 + Math.random() * 0.9
      phases[i] = Math.random() * Math.PI * 2
      maxHeights[i] = (1.5 + Math.random() * 2.5) * SCALE
    }
    return { dirs, speeds, phases, maxHeights }
  }, [])

  const surfaceCharIndices = useMemo(() => {
    const arr = new Float32Array(SUN_SURFACE_COUNT)
    arr.fill(4)
    return arr
  }, [])
  const flareCharIndices = useMemo(() => new Float32Array(SUN_FLARE_COUNT), [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const mesh = surfaceMeshRef.current
    if (!mesh) return
    for (let i = 0; i < SUN_SURFACE_COUNT; i++) {
      dummy.position.set(
        surfacePositions[i * 3],
        surfacePositions[i * 3 + 1],
        surfacePositions[i * 3 + 2]
      )
      dummy.scale.setScalar(PARTICLE_SIZE)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute(
      'aCharIndex',
      new THREE.InstancedBufferAttribute(surfaceCharIndices, 1)
    )
  }, [surfacePositions, surfaceCharIndices, dummy])

  useEffect(() => {
    const mesh = flareMeshRef.current
    if (!mesh) return
    for (let i = 0; i < SUN_FLARE_COUNT; i++) {
      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(PARTICLE_SIZE)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute(
      'aCharIndex',
      new THREE.InstancedBufferAttribute(flareCharIndices, 1)
    )
  }, [flareCharIndices, dummy])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    const surfaceMesh = surfaceMeshRef.current
    if (surfaceMesh) {
      for (let i = 0; i < SUN_SURFACE_COUNT; i++) {
        const px = surfacePositions[i * 3]
        const py = surfacePositions[i * 3 + 1]
        const pz = surfacePositions[i * 3 + 2]
        const theta = Math.atan2(pz, px)
        const phi = Math.acos(Math.max(-1, Math.min(1, py / SUN_R)))
        const n1 = noise3d(theta * 2.0 + t * 0.3, phi * 2.0 + t * 0.2, t * 0.1)
        const n2 = noise3d(px * 0.3 + t * 0.15, py * 0.3 + t * 0.1, pz * 0.3 + 7.0)
        const n = n1 * 0.6 + n2 * 0.4
        surfaceCharIndices[i] = Math.max(1, Math.floor(n * (CHAR_COUNT - 1) + 0.5))
      }
      const attr = surfaceMesh.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
      attr.needsUpdate = true
    }

    const flareMesh = flareMeshRef.current
    if (flareMesh) {
      for (let i = 0; i < SUN_FLARE_COUNT; i++) {
        const lifetime = ((t * flareData.speeds[i] * 0.1 + flareData.phases[i]) % 1 + 1) % 1
        const dx = flareData.dirs[i * 3]
        const dy = flareData.dirs[i * 3 + 1]
        const dz = flareData.dirs[i * 3 + 2]
        const dist = SUN_R + lifetime * flareData.maxHeights[i]
        dummy.position.set(dx * dist, dy * dist, dz * dist)
        dummy.scale.setScalar(PARTICLE_SIZE * (1.0 - lifetime * 0.5))
        dummy.updateMatrix()
        flareMesh.setMatrixAt(i, dummy.matrix)
        flareCharIndices[i] = Math.max(1, Math.floor((1 - lifetime) * (CHAR_COUNT - 1)))
      }
      flareMesh.instanceMatrix.needsUpdate = true
      const attr = flareMesh.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
      if (attr) attr.needsUpdate = true
    }
  })

  const surfaceGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const flareGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  return (
    <>
      <instancedMesh
        ref={surfaceMeshRef}
        args={[surfaceGeo, surfaceMaterial, SUN_SURFACE_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={flareMeshRef}
        args={[flareGeo, flareMaterial, SUN_FLARE_COUNT]}
        frustumCulled={false}
      />
    </>
  )
}

// ============================================================
//  Orbital Wave Field
// ============================================================

const WAVE_RING_SPACING = 0.7
const WAVE_PARTICLE_SPACING = 1.0
const WAVE_PARTICLE_SIZE = 0.5
const WAVE_INNER_R = SUN_R + 3
const WAVE_OUTER_R = 22 * SCALE

const HOVER_RADIUS = 14

function OrbitalWaveField({ atlas, mouseWorld }: { atlas: THREE.Texture; mouseWorld: React.RefObject<THREE.Vector3 | null> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const material = useMemo(() => createParticleMaterial(atlas), [atlas])

  const { basePositions, count } = useMemo(() => {
    const positions: { x: number; z: number; dist: number }[] = []
    let r = WAVE_INNER_R
    while (r < WAVE_OUTER_R) {
      const circumference = 2 * Math.PI * r
      const particlesOnRing = Math.max(16, Math.floor(circumference / WAVE_PARTICLE_SPACING))
      for (let i = 0; i < particlesOnRing; i++) {
        const angle = (i / particlesOnRing) * Math.PI * 2
        positions.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          dist: r,
        })
      }
      r += WAVE_RING_SPACING
    }
    return { basePositions: positions, count: positions.length }
  }, [])

  const charIndices = useMemo(() => new Float32Array(count), [count])
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      const p = basePositions[i]
      dummy.position.set(p.x, 0, p.z)
      dummy.scale.setScalar(WAVE_PARTICLE_SIZE)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('aCharIndex', new THREE.InstancedBufferAttribute(charIndices, 1))
  }, [basePositions, count, charIndices, dummy])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const mesh = meshRef.current
    if (!mesh) return

    for (let i = 0; i < count; i++) {
      const p = basePositions[i]
      const y = waveY(p.dist, t)
      let yOffset = y
      let ci = waveCharIndex(y)

      if (mouseWorld.current) {
        const dx = p.x - mouseWorld.current.x
        const dz = p.z - mouseWorld.current.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < HOVER_RADIUS) {
          const t = 1 - dist / HOVER_RADIUS
          const smooth = t * t * (3 - 2 * t) // smoothstep for nice falloff
          yOffset += smooth * 2.5 // push particles up
          ci = Math.min(7, Math.round(ci + smooth * 3))
        }
      }

      dummy.position.set(p.x, yOffset, p.z)
      dummy.scale.setScalar(WAVE_PARTICLE_SIZE)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      charIndices[i] = ci
    }

    mesh.instanceMatrix.needsUpdate = true
    const attr = mesh.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
    if (attr) attr.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, material, count]}
      frustumCulled={false}
    />
  )
}

// ============================================================
//  Planet configs
// ============================================================

interface PlanetConfig {
  name: string
  radius: number
  orbitRadius: number
  speed: number
  rings?: { inner: number; outer: number }[]
  ringTilt?: number
  moonRadius?: number
  moonOrbit?: number
  moonSpeed?: number
}

const PLANETS: PlanetConfig[] = [
  { name: 'Mercury', radius: 0.25, orbitRadius: 4, speed: 0.8 },
  { name: 'Venus', radius: 0.4, orbitRadius: 5.5, speed: 0.6 },
  { name: 'Earth', radius: 0.45, orbitRadius: 7, speed: 0.5, moonRadius: 0.12, moonOrbit: 0.8, moonSpeed: 2.0 },
  { name: 'Mars', radius: 0.3, orbitRadius: 9, speed: 0.4 },
  { name: 'Jupiter', radius: 1.0, orbitRadius: 12, speed: 0.22 },
  {
    name: 'Saturn', radius: 0.85, orbitRadius: 15, speed: 0.17,
    ringTilt: Math.PI / 6,
    rings: [
      { inner: 1.3, outer: 1.6 },
      { inner: 1.7, outer: 1.9 },
      { inner: 2.0, outer: 2.5 },
    ],
  },
  {
    name: 'Uranus', radius: 0.6, orbitRadius: 18, speed: 0.12,
    ringTilt: 98 * Math.PI / 180,
    rings: [
      { inner: 1.4, outer: 1.6 },
      { inner: 1.7, outer: 2.0 },
    ],
  },
  { name: 'Neptune', radius: 0.55, orbitRadius: 21, speed: 0.09 },
]

// ============================================================
//  AsciiPlanet
// ============================================================

const _sunWorldPos = new THREE.Vector3()
const _planetWorldPos = new THREE.Vector3()
const _lightDir = new THREE.Vector3()

function AsciiPlanet({ config, atlas }: { config: PlanetConfig; atlas: THREE.Texture }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const moonMeshRef = useRef<THREE.InstancedMesh>(null)
  const moonGroupRef = useRef<THREE.Group>(null)

  const r = config.radius * SCALE
  const orb = config.orbitRadius * SCALE
  const particleCount = Math.max(200, Math.floor(config.radius * 1500))
  const particleSize = Math.max(0.2, r * 2 / Math.sqrt(particleCount) * 1.4)

  const material = useMemo(() => createParticleMaterial(atlas), [atlas])
  const moonMaterial = useMemo(() => config.moonRadius ? createParticleMaterial(atlas) : null, [atlas, config.moonRadius])

  const positions = useMemo(() => fibonacciSphere(particleCount, r), [particleCount, r])

  const ringData = useMemo(() => {
    if (!config.rings) return null
    const ringParticles: { x: number; y: number; z: number }[] = []
    const tiltAngle = config.ringTilt ?? Math.PI / 6
    const cosT = Math.cos(tiltAngle)
    const sinT = Math.sin(tiltAngle)
    for (const ring of config.rings) {
      const innerR = ring.inner * r
      const outerR = ring.outer * r
      const area = Math.PI * (outerR * outerR - innerR * innerR)
      const density = 120
      const ringCount = Math.max(60, Math.floor(area * density))
      for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const u = Math.random()
        const dist = Math.sqrt(innerR * innerR * (1 - u) + outerR * outerR * u)
        const lx = Math.cos(angle) * dist
        const lz = Math.sin(angle) * dist
        ringParticles.push({
          x: lx,
          y: lz * sinT,
          z: lz * cosT,
        })
      }
    }
    return { particles: ringParticles, count: ringParticles.length }
  }, [config.rings, r])

  const ringMeshRef = useRef<THREE.InstancedMesh>(null)
  const ringMaterial = useMemo(() => ringData ? createParticleMaterial(atlas) : null, [atlas, ringData])

  const moonR = config.moonRadius ? config.moonRadius * SCALE : 0
  const moonParticleCount = config.moonRadius ? Math.max(80, Math.floor(config.moonRadius * 1500)) : 0
  const moonPositions = useMemo(
    () => moonParticleCount > 0 ? fibonacciSphere(moonParticleCount, moonR) : null,
    [moonParticleCount, moonR]
  )

  const charIndices = useMemo(() => new Float32Array(particleCount), [particleCount])
  const ringCharIndices = useMemo(() => ringData ? new Float32Array(ringData.count) : null, [ringData])
  const moonCharIndices = useMemo(() => moonParticleCount > 0 ? new Float32Array(moonParticleCount) : null, [moonParticleCount])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const surfaceGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const ringGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const moonGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < particleCount; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      dummy.scale.setScalar(particleSize)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('aCharIndex', new THREE.InstancedBufferAttribute(charIndices, 1))
  }, [positions, charIndices, particleSize, particleCount, dummy])

  useEffect(() => {
    const mesh = ringMeshRef.current
    if (!mesh || !ringData || !ringCharIndices) return
    for (let i = 0; i < ringData.count; i++) {
      const p = ringData.particles[i]
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(particleSize * 0.5)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('aCharIndex', new THREE.InstancedBufferAttribute(ringCharIndices, 1))
  }, [ringData, ringCharIndices, particleSize, dummy])

  useEffect(() => {
    const mesh = moonMeshRef.current
    if (!mesh || !moonPositions || !moonCharIndices) return
    const moonPSize = Math.max(0.1, moonR * 2 / Math.sqrt(moonParticleCount) * 1.2)
    for (let i = 0; i < moonParticleCount; i++) {
      dummy.position.set(moonPositions[i * 3], moonPositions[i * 3 + 1], moonPositions[i * 3 + 2])
      dummy.scale.setScalar(moonPSize)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('aCharIndex', new THREE.InstancedBufferAttribute(moonCharIndices, 1))
  }, [moonPositions, moonCharIndices, moonParticleCount, moonR, dummy])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      const angle = t * config.speed
      const x = Math.cos(angle) * orb
      const z = Math.sin(angle) * orb
      const y = waveY(orb, t)
      groupRef.current.position.set(x, y, z)
    }

    if (moonGroupRef.current && config.moonSpeed && config.moonOrbit) {
      const mt = t * config.moonSpeed
      moonGroupRef.current.position.x = Math.cos(mt) * config.moonOrbit * SCALE
      moonGroupRef.current.position.z = Math.sin(mt) * config.moonOrbit * SCALE
    }

    if (groupRef.current?.parent) {
      _sunWorldPos.set(0, 0, 0)
      groupRef.current.parent.localToWorld(_sunWorldPos)

      _planetWorldPos.set(0, 0, 0)
      groupRef.current.localToWorld(_planetWorldPos)

      _lightDir.copy(_sunWorldPos).sub(_planetWorldPos).normalize()

      const mesh = meshRef.current
      if (mesh) {
        for (let i = 0; i < particleCount; i++) {
          const px = positions[i * 3]
          const py = positions[i * 3 + 1]
          const pz = positions[i * 3 + 2]
          const len = Math.sqrt(px * px + py * py + pz * pz)
          const nx = px / len, ny = py / len, nz = pz / len
          const dot = nx * _lightDir.x + ny * _lightDir.y + nz * _lightDir.z
          const brightness = Math.max(0.15, dot * 0.7 + 0.3 * Math.max(0, dot * 0.5 + 0.5))
          charIndices[i] = Math.max(2, Math.floor(brightness * (CHAR_COUNT - 1) + 0.5))
        }
        const attr = mesh.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }

      if (ringMeshRef.current && ringData && ringCharIndices) {
        for (let i = 0; i < ringData.count; i++) {
          const p = ringData.particles[i]
          const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
          const nx = p.x / len, ny = p.y / len, nz = p.z / len
          const dot = nx * _lightDir.x + ny * _lightDir.y + nz * _lightDir.z
          const brightness = dot * 0.5 + 0.5
          ringCharIndices[i] = 3 + Math.floor(brightness * 2.99)
        }
        const attr = ringMeshRef.current.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }

      if (moonMeshRef.current && moonPositions && moonCharIndices && moonGroupRef.current) {
        const moonWorld = new THREE.Vector3()
        moonGroupRef.current.getWorldPosition(moonWorld)
        const moonLightDir = _sunWorldPos.clone().sub(moonWorld).normalize()
        for (let i = 0; i < moonParticleCount; i++) {
          const px = moonPositions[i * 3]
          const py = moonPositions[i * 3 + 1]
          const pz = moonPositions[i * 3 + 2]
          const len = Math.sqrt(px * px + py * py + pz * pz)
          const nx = px / len, ny = py / len, nz = pz / len
          const dot = nx * moonLightDir.x + ny * moonLightDir.y + nz * moonLightDir.z
          const brightness = Math.max(0.15, dot * 0.7 + 0.3 * Math.max(0, dot * 0.5 + 0.5))
          moonCharIndices[i] = Math.max(2, Math.floor(brightness * (CHAR_COUNT - 1) + 0.5))
        }
        const attr = moonMeshRef.current.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }
    }
  })

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[surfaceGeo, material, particleCount]}
        frustumCulled={false}
      />
      {ringData && ringMaterial && (
        <instancedMesh
          ref={ringMeshRef}
          args={[ringGeo, ringMaterial, ringData.count]}
          frustumCulled={false}
        />
      )}
      {moonPositions && moonMaterial && (
        <group ref={moonGroupRef}>
          <instancedMesh
            ref={moonMeshRef}
            args={[moonGeo, moonMaterial, moonParticleCount]}
            frustumCulled={false}
          />
        </group>
      )}
    </group>
  )
}

// ============================================================
//  Scene (inner R3F tree)
// ============================================================

function Scene() {
  const ref = useRef<THREE.Group>(null)
  const atlas = useMemo(() => createAtlasTexture(), [])
  const mouseWorld = useRef<THREE.Vector3 | null>(null)
  const rayPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hitPoint = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05

    // Update raycaster from current pointer position
    state.raycaster.setFromCamera(state.pointer, state.camera)

    // Raycast against the y=0 plane to find mouse world position
    const hit = state.raycaster.ray.intersectPlane(rayPlane, hitPoint)
    if (hit) {
      // Transform from world space back into the rotating group's local space
      if (ref.current) {
        const local = ref.current.worldToLocal(hitPoint.clone())
        if (!mouseWorld.current) mouseWorld.current = new THREE.Vector3()
        mouseWorld.current.copy(local)
      }
    } else {
      mouseWorld.current = null
    }
  })

  return (
    <group ref={ref} position={[0, 6, 0]}>
      <AsciiSun atlas={atlas} />
      <OrbitalWaveField atlas={atlas} mouseWorld={mouseWorld} />
      {PLANETS.map((config) => (
        <AsciiPlanet key={config.name} config={config} atlas={atlas} />
      ))}
    </group>
  )
}

// ============================================================
//  Exported canvas wrapper
// ============================================================

function ReadySignal({ onReady }: { onReady: () => void }) {
  const called = useRef(false)
  useFrame(() => {
    if (!called.current) {
      called.current = true
      onReady()
    }
  })
  return null
}

function LoadingIndicator() {
  const frames = ['.', '*', '0']
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), 300)
    return () => clearInterval(id)
  }, [])
  return <>{frames[frame]}</>
}

export default function SolarSystem() {
  const [ready, setReady] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!ready && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          zIndex: 1,
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
          letterSpacing: '2px',
        }}>
          <LoadingIndicator />
        </div>
      )}
      <Canvas
        camera={{ position: [0, 12 * SCALE, 22 * SCALE], fov: 45, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0d0d0d']} />
        <OrbitControls />
        <Scene />
        <ReadySignal onReady={() => setReady(true)} />
      </Canvas>
    </div>
  )
}
