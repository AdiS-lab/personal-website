import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Billboard } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
//  Constants
// ============================================================

const SCALE = 3
const SUN_R = 2 * SCALE
const CHARS = [' ', '.', ':', '-', '+', '=', 'X', '#']
const CHAR_COUNT = CHARS.length
const CELL_SIZE = 64

// ============================================================
//  Texture Atlas — 8 glyphs in a 512×64 canvas
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
//  JS-side 3D noise for charIndex computation
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
//  Shared shader code
// ============================================================

const PARTICLE_VS = /* glsl */ `
  attribute float aCharIndex;
  varying vec2 vUv;
  varying float vCharIndex;

  void main() {
    vCharIndex = aCharIndex;
    vUv = uv;

    // Extract instance position and scale from instance matrix
    vec3 instancePos = vec3(
      instanceMatrix[3][0],
      instanceMatrix[3][1],
      instanceMatrix[3][2]
    );
    float scaleX = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));

    // Transform instance position to world space via modelMatrix (carries group transform)
    vec3 worldInstancePos = (modelMatrix * vec4(instancePos, 1.0)).xyz;

    // Billboard: compute camera-facing basis vectors in world space
    vec3 toCamera = normalize(cameraPosition - worldInstancePos);
    // Robust up vector: avoid degenerate cross when camera looks straight down/up
    vec3 refUp = abs(toCamera.y) > 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(refUp, toCamera));
    vec3 up = cross(toCamera, right);

    // Transform local quad vertex using billboard basis (world space)
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
    gl_FragColor = vec4(vec3(1.0), alpha);
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

// ============================================================
//  Planet name label — canvas texture with Playfair Display
// ============================================================

function createLabelTexture(name: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const fontSize = 64
  const ctx = canvas.getContext('2d')!
  ctx.font = `italic ${fontSize}px 'Playfair Display', serif`
  const metrics = ctx.measureText(name)
  const width = Math.ceil(metrics.width) + 20
  const height = fontSize + 20
  canvas.width = width
  canvas.height = height
  ctx.font = `italic ${fontSize}px 'Playfair Display', serif`
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#aaaaaa'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, width / 2, height / 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

function PlanetLabel({ name, offset }: { name: string; offset: number }) {
  const tex = useMemo(() => createLabelTexture(name), [name])
  const aspect = tex.image.width / tex.image.height
  const labelHeight = offset * 0.6
  const labelWidth = labelHeight * aspect

  return (
    <Billboard position={[0, offset, 0]}>
      <mesh>
        <planeGeometry args={[labelWidth, labelHeight]} />
        <meshBasicMaterial
          map={tex}
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </Billboard>
  )
}

// ============================================================
//  AsciiSun — surface + flare particles
// ============================================================

const SUN_SURFACE_COUNT = 5000
const SUN_FLARE_COUNT = 1500
const PARTICLE_SIZE = 0.55

function AsciiSun({ atlas }: { atlas: THREE.Texture }) {
  const surfaceMeshRef = useRef<THREE.InstancedMesh>(null)
  const flareMeshRef = useRef<THREE.InstancedMesh>(null)

  const surfaceMaterial = useMemo(() => createParticleMaterial(atlas), [atlas])
  const flareMaterial = useMemo(() => createParticleMaterial(atlas), [atlas])

  // Surface positions (static, on sphere)
  const surfacePositions = useMemo(() => fibonacciSphere(SUN_SURFACE_COUNT, SUN_R), [])

  // Flare per-particle data
  const flareData = useMemo(() => {
    const dirs = new Float32Array(SUN_FLARE_COUNT * 3)
    const speeds = new Float32Array(SUN_FLARE_COUNT)
    const phases = new Float32Array(SUN_FLARE_COUNT)
    const maxHeights = new Float32Array(SUN_FLARE_COUNT)
    for (let i = 0; i < SUN_FLARE_COUNT; i++) {
      // Random direction
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

  // CharIndex buffer attributes — init to mid-density so first frame isn't blank
  const surfaceCharIndices = useMemo(() => {
    const arr = new Float32Array(SUN_SURFACE_COUNT)
    arr.fill(4)
    return arr
  }, [])
  const flareCharIndices = useMemo(() => new Float32Array(SUN_FLARE_COUNT), [])

  // Initialize instance matrices
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
    // Attach charIndex attribute
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

    // Update surface charIndices via noise
    const surfaceMesh = surfaceMeshRef.current
    if (surfaceMesh) {
      for (let i = 0; i < SUN_SURFACE_COUNT; i++) {
        const px = surfacePositions[i * 3]
        const py = surfacePositions[i * 3 + 1]
        const pz = surfacePositions[i * 3 + 2]
        // Use spherical UV so noise covers the full sphere uniformly
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

    // Update flare positions + charIndices
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

  // Each InstancedMesh MUST have its own geometry — shared geometry causes
  // aCharIndex attribute overwrites (last setAttribute wins, truncating the buffer)
  const surfaceGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const flareGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  return (
    <>
      <PlanetLabel name="Sun" offset={SUN_R + PARTICLE_SIZE * 6} />
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
//  Planet configs
// ============================================================

interface PlanetConfig {
  name: string
  radius: number
  orbitRadius: number
  speed: number
  rings?: { inner: number; outer: number }[]
  ringTilt?: number // radians — axial tilt of ring plane (default ~30° for Saturn)
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
    ringTilt: Math.PI / 6, // ~30° tilt
    rings: [
      { inner: 1.3, outer: 1.6 },
      { inner: 1.7, outer: 1.9 },
      { inner: 2.0, outer: 2.5 },
    ],
  },
  {
    name: 'Uranus', radius: 0.6, orbitRadius: 18, speed: 0.12,
    ringTilt: 98 * Math.PI / 180, // ~98° axial tilt — nearly on its side
    rings: [
      { inner: 1.4, outer: 1.6 },
      { inner: 1.7, outer: 2.0 },
    ],
  },
  { name: 'Neptune', radius: 0.55, orbitRadius: 21, speed: 0.09 },
]

// ============================================================
//  AsciiPlanet — instanced ASCII particles per planet
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

  // Surface positions
  const positions = useMemo(() => fibonacciSphere(particleCount, r), [particleCount, r])

  // Ring particles — area-weighted distribution for uniform density
  const ringData = useMemo(() => {
    if (!config.rings) return null
    const ringParticles: { x: number; y: number; z: number }[] = []
    const tiltAngle = config.ringTilt ?? Math.PI / 6
    const cosT = Math.cos(tiltAngle)
    const sinT = Math.sin(tiltAngle)
    for (const ring of config.rings) {
      const innerR = ring.inner * r
      const outerR = ring.outer * r
      // Area of annulus = π(outer² - inner²); scale particle count by area
      const area = Math.PI * (outerR * outerR - innerR * innerR)
      const density = 120 // particles per square world-unit
      const ringCount = Math.max(60, Math.floor(area * density))
      for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2
        // Area-weighted radial sampling: sqrt(lerp(inner², outer², rand))
        const u = Math.random()
        const dist = Math.sqrt(innerR * innerR * (1 - u) + outerR * outerR * u)
        const lx = Math.cos(angle) * dist
        const lz = Math.sin(angle) * dist
        // Tilt ring plane around X axis
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

  // Moon particles
  const moonR = config.moonRadius ? config.moonRadius * SCALE : 0
  const moonParticleCount = config.moonRadius ? Math.max(80, Math.floor(config.moonRadius * 1500)) : 0
  const moonPositions = useMemo(
    () => moonParticleCount > 0 ? fibonacciSphere(moonParticleCount, moonR) : null,
    [moonParticleCount, moonR]
  )

  // Char index buffers
  const charIndices = useMemo(() => new Float32Array(particleCount), [particleCount])
  const ringCharIndices = useMemo(() => ringData ? new Float32Array(ringData.count) : null, [ringData])
  const moonCharIndices = useMemo(() => moonParticleCount > 0 ? new Float32Array(moonParticleCount) : null, [moonParticleCount])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  // Each InstancedMesh MUST have its own geometry to avoid aCharIndex overwrites
  const surfaceGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const ringGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const moonGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  // Init planet surface instances
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

  // Init ring instances
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

  // Init moon instances
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

    // Orbital motion
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t * config.speed) * orb
      groupRef.current.position.z = Math.sin(t * config.speed) * orb
    }

    // Moon orbital motion
    if (moonGroupRef.current && config.moonSpeed && config.moonOrbit) {
      const mt = t * config.moonSpeed
      moonGroupRef.current.position.x = Math.cos(mt) * config.moonOrbit * SCALE
      moonGroupRef.current.position.z = Math.sin(mt) * config.moonOrbit * SCALE
    }

    // Sun is at the world origin of the parent group
    if (groupRef.current?.parent) {
      _sunWorldPos.set(0, 0, 0)
      groupRef.current.parent.localToWorld(_sunWorldPos)

      // Planet world position
      _planetWorldPos.set(0, 0, 0)
      groupRef.current.localToWorld(_planetWorldPos)

      _lightDir.copy(_sunWorldPos).sub(_planetWorldPos).normalize()

      // Update planet surface char indices based on lighting
      const mesh = meshRef.current
      if (mesh) {
        for (let i = 0; i < particleCount; i++) {
          const px = positions[i * 3]
          const py = positions[i * 3 + 1]
          const pz = positions[i * 3 + 2]
          const len = Math.sqrt(px * px + py * py + pz * pz)
          const nx = px / len, ny = py / len, nz = pz / len
          const dot = nx * _lightDir.x + ny * _lightDir.y + nz * _lightDir.z
          const brightness = Math.max(0, dot * 0.85 + 0.15 * Math.max(0, dot * 0.5 + 0.5))
          charIndices[i] = Math.max(1, Math.floor(brightness * (CHAR_COUNT - 1) + 0.5))
        }
        const attr = mesh.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }

      // Update ring char indices — medium-density glyphs (indices 3-5: - + =)
      if (ringMeshRef.current && ringData && ringCharIndices) {
        for (let i = 0; i < ringData.count; i++) {
          const p = ringData.particles[i]
          const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
          const nx = p.x / len, ny = p.y / len, nz = p.z / len
          const dot = nx * _lightDir.x + ny * _lightDir.y + nz * _lightDir.z
          const brightness = dot * 0.5 + 0.5 // 0..1 remapped, always positive
          // Map to indices 3(-), 4(+), 5(=) for distinct ring texture
          ringCharIndices[i] = 3 + Math.floor(brightness * 2.99)
        }
        const attr = ringMeshRef.current.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }

      // Update moon char indices
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
          const brightness = Math.max(0, dot * 0.85 + 0.15 * Math.max(0, dot * 0.5 + 0.5))
          moonCharIndices[i] = Math.max(1, Math.floor(brightness * (CHAR_COUNT - 1) + 0.5))
        }
        const attr = moonMeshRef.current.geometry.getAttribute('aCharIndex') as THREE.InstancedBufferAttribute
        attr.needsUpdate = true
      }
    }
  })

  return (
    <group ref={groupRef}>
      <PlanetLabel name={config.name} offset={r + particleSize * 4} />
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
//  OrbitLine — kept from original
// ============================================================

function OrbitLine({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const r = radius * SCALE
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
    }
    return pts
  }, [radius])
  const lineRef = useRef<THREE.Line>(null)

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(points)
    }
  }, [points])

  return (
    <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#333333' }))} ref={lineRef} />
  )
}

// ============================================================
//  Scene
// ============================================================

function Scene() {
  const ref = useRef<THREE.Group>(null)
  const atlas = useMemo(() => createAtlasTexture(), [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={ref}>
      <AsciiSun atlas={atlas} />
      {PLANETS.map((config) => (
        <OrbitLine key={config.name + '-orbit'} radius={config.orbitRadius} />
      ))}
      {PLANETS.map((config) => (
        <AsciiPlanet key={config.name} config={config} atlas={atlas} />
      ))}
    </group>
  )
}

// ============================================================
//  App — split layout: sidebar left, canvas right
// ============================================================

const FILES = [
  'about_me.txt',
  'thinking_in_motion.crx',
  '3d_bookshelf.dev',
  'custom_scale.io',
  'un_sospiro.midi',
  'obsidian_vault.md',
]

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-name">Adi Shankar</div>
          <div className="sidebar-subtitle">systems / studio / signal</div>
        </div>

        <div className="sidebar-bio">
          <span>Building at the intersection of</span><br />
          hardware, software, and physical systems.<br /><br />
          Obsessed with first-principles design,<br />
          real-time computation, and tools that<br />
          think with you — not for you.
        </div>

        <nav className="sidebar-files">
          {FILES.map((f) => (
            <a key={f} className="sidebar-file">{f}</a>
          ))}
        </nav>
      </aside>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 60 * SCALE, 50 * SCALE], fov: 35, near: 0.1, far: 1000 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#111111']} />
          <OrbitControls />
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}

export default App
