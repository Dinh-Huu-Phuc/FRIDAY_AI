"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

import type { AIOrbState } from "./types"

interface AIOrbCanvasProps {
  state: AIOrbState
  audioLevel: number
  size: number
}

const PARTICLE_COUNT = 420
const RAY_COUNT = 92

const STATE_CONFIG: Record<
  AIOrbState,
  {
    orbitSpeed: number
    pulse: number
    glow: number
    particleSpread: number
    rayPower: number
    color: THREE.Color
    accent: THREE.Color
  }
> = {
  idle: {
    orbitSpeed: 0.18,
    pulse: 0.08,
    glow: 0.72,
    particleSpread: 1,
    rayPower: 0.34,
    color: new THREE.Color("#22d3ee"),
    accent: new THREE.Color("#2563eb"),
  },
  listening: {
    orbitSpeed: 0.34,
    pulse: 0.18,
    glow: 1,
    particleSpread: 1.12,
    rayPower: 0.48,
    color: new THREE.Color("#67e8f9"),
    accent: new THREE.Color("#14b8a6"),
  },
  thinking: {
    orbitSpeed: 0.72,
    pulse: 0.24,
    glow: 1.18,
    particleSpread: 1.18,
    rayPower: 0.55,
    color: new THREE.Color("#38bdf8"),
    accent: new THREE.Color("#0ea5e9"),
  },
  speaking: {
    orbitSpeed: 0.52,
    pulse: 0.32,
    glow: 1.36,
    particleSpread: 1.36,
    rayPower: 0.78,
    color: new THREE.Color("#7dd3fc"),
    accent: new THREE.Color("#22d3ee"),
  },
  error: {
    orbitSpeed: 0.42,
    pulse: 0.28,
    glow: 1.05,
    particleSpread: 1.08,
    rayPower: 0.58,
    color: new THREE.Color("#67e8f9"),
    accent: new THREE.Color("#fb7185"),
  },
}

function createCircleTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) return new THREE.CanvasTexture(canvas)

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, "rgba(255,255,255,1)")
  gradient.addColorStop(0.35, "rgba(125,211,252,0.9)")
  gradient.addColorStop(1, "rgba(34,211,238,0)")
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)

  return new THREE.CanvasTexture(canvas)
}

function createRing(radius: number, color: THREE.Color, opacity: number) {
  const geometry = new THREE.RingGeometry(radius * 0.985, radius, 160)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  return new THREE.Mesh(geometry, material)
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    mesh.geometry?.dispose()
    const material = mesh.material
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose())
    } else {
      material?.dispose()
    }
  })
}

export function AIOrbCanvas({ state, audioLevel, size }: AIOrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef(state)
  const audioLevelRef = useRef(audioLevel)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    audioLevelRef.current = audioLevel
  }, [audioLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.z = 7

    const group = new THREE.Group()
    scene.add(group)

    const coreGeometry = new THREE.SphereGeometry(0.72, 64, 64)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: STATE_CONFIG.idle.color,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    group.add(core)

    const glowTexture = createCircleTexture()
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: STATE_CONFIG.idle.color,
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glow = new THREE.Sprite(glowMaterial)
    glow.scale.set(4.1, 4.1, 1)
    group.add(glow)

    const ringInner = createRing(1.35, new THREE.Color("#67e8f9"), 0.34)
    const ringOuter = createRing(2.08, new THREE.Color("#0ea5e9"), 0.24)
    group.add(ringInner, ringOuter)

    const orbitGroup = new THREE.Group()
    group.add(orbitGroup)
    const orbitA = createRing(2.45, new THREE.Color("#22d3ee"), 0.52)
    const orbitB = createRing(2.18, new THREE.Color("#60a5fa"), 0.42)
    const orbitC = createRing(2.75, new THREE.Color("#14b8a6"), 0.28)
    orbitA.scale.y = 0.34
    orbitB.scale.y = 0.42
    orbitC.scale.y = 0.28
    orbitA.rotation.x = 0.72
    orbitB.rotation.x = -0.58
    orbitB.rotation.z = 1.1
    orbitC.rotation.x = 0.38
    orbitC.rotation.z = -0.8
    orbitGroup.add(orbitA, orbitB, orbitC)

    const scanArc = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.018, 8, 96, Math.PI * 1.25),
      new THREE.MeshBasicMaterial({
        color: "#a5f3fc",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    scanArc.scale.y = 0.52
    group.add(scanArc)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const basePositions = new Float32Array(PARTICLE_COUNT * 3)
    const particleSeeds = new Float32Array(PARTICLE_COUNT)
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const radius = 1.05 + Math.random() * 2.25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi) * 0.45
      const offset = index * 3
      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = z
      basePositions[offset] = x
      basePositions[offset + 1] = y
      basePositions[offset + 2] = z
      particleSeeds[index] = Math.random() * 100
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: "#67e8f9",
      size: 0.034,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    group.add(particles)

    const rayPositions = new Float32Array(RAY_COUNT * 6)
    const raySeeds = new Float32Array(RAY_COUNT)
    const rayDirections = new Float32Array(RAY_COUNT * 3)
    for (let index = 0; index < RAY_COUNT; index += 1) {
      const angle = (index / RAY_COUNT) * Math.PI * 2
      const wobble = (Math.random() - 0.5) * 0.24
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      rayDirections[index * 3] = dx
      rayDirections[index * 3 + 1] = dy
      rayDirections[index * 3 + 2] = wobble
      raySeeds[index] = Math.random() * 100
    }

    const rayGeometry = new THREE.BufferGeometry()
    rayGeometry.setAttribute("position", new THREE.BufferAttribute(rayPositions, 3))
    const rayMaterial = new THREE.LineBasicMaterial({
      color: "#22d3ee",
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const rays = new THREE.LineSegments(rayGeometry, rayMaterial)
    group.add(rays)

    const clock = new THREE.Clock()
    let animationFrame = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const animate = () => {
      const elapsed = clock.getElapsedTime()
      const currentState = stateRef.current
      const config = STATE_CONFIG[currentState]
      const rawLevel = audioLevelRef.current
      const fakeLevel =
        currentState === "speaking"
          ? 0.35 + Math.abs(Math.sin(elapsed * 8)) * 0.45 + Math.sin(elapsed * 23) * 0.06
          : 0
      const reactiveLevel = Math.min(1, Math.max(rawLevel, fakeLevel))
      const pulse = 1 + Math.sin(elapsed * 2.4) * config.pulse + reactiveLevel * 0.24
      const shake = currentState === "error" ? Math.sin(elapsed * 42) * 0.018 : 0

      group.position.set(shake, -shake * 0.5, 0)
      group.rotation.z = elapsed * 0.05

      coreMaterial.color.lerp(config.color, 0.08)
      glowMaterial.color.lerp(config.color, 0.08)
      particleMaterial.color.lerp(config.color, 0.08)
      rayMaterial.color.lerp(config.accent, 0.08)

      core.scale.setScalar(pulse)
      coreMaterial.opacity = 0.72 + config.glow * 0.13 + reactiveLevel * 0.16
      glow.scale.setScalar(3.65 + config.glow * 0.58 + reactiveLevel * 1.2)
      glowMaterial.opacity = 0.34 + config.glow * 0.15 + reactiveLevel * 0.28

      ringInner.scale.setScalar(1 + reactiveLevel * 0.18 + Math.sin(elapsed * 3.2) * config.pulse * 0.3)
      ringOuter.scale.setScalar(1 + reactiveLevel * 0.3 + Math.cos(elapsed * 2.1) * config.pulse * 0.4)
      ringInner.rotation.z = -elapsed * (0.18 + config.orbitSpeed)
      ringOuter.rotation.z = elapsed * (0.14 + config.orbitSpeed * 0.75)

      orbitGroup.rotation.y = elapsed * config.orbitSpeed
      orbitGroup.rotation.z = elapsed * config.orbitSpeed * 0.46
      orbitA.rotation.z += 0.004 + reactiveLevel * 0.006
      orbitB.rotation.z -= 0.003 + reactiveLevel * 0.005
      orbitC.rotation.z += 0.002

      scanArc.rotation.z = elapsed * (1.35 + config.orbitSpeed)
      scanArc.rotation.y = Math.sin(elapsed * 0.8) * 0.32
      ;(scanArc.material as THREE.MeshBasicMaterial).opacity =
        currentState === "thinking" ? 0.72 : currentState === "error" ? 0.36 : 0

      const positionAttribute = particleGeometry.getAttribute("position") as THREE.BufferAttribute
      for (let index = 0; index < PARTICLE_COUNT; index += 1) {
        const offset = index * 3
        const seed = particleSeeds[index]
        const drift = Math.sin(elapsed * (0.8 + seed * 0.012) + seed) * 0.08
        const burst = 1 + config.particleSpread * 0.08 + reactiveLevel * 0.24
        positionAttribute.array[offset] = basePositions[offset] * burst + drift
        positionAttribute.array[offset + 1] =
          basePositions[offset + 1] * burst + Math.cos(elapsed * 0.9 + seed) * 0.08
        positionAttribute.array[offset + 2] =
          basePositions[offset + 2] * (0.8 + burst * 0.16) + Math.sin(elapsed + seed) * 0.05
      }
      positionAttribute.needsUpdate = true
      particles.rotation.z = elapsed * (0.025 + config.orbitSpeed * 0.08)
      particleMaterial.size = 0.026 + config.glow * 0.006 + reactiveLevel * 0.028
      particleMaterial.opacity = 0.52 + config.glow * 0.18 + reactiveLevel * 0.18

      const raysAttribute = rayGeometry.getAttribute("position") as THREE.BufferAttribute
      for (let index = 0; index < RAY_COUNT; index += 1) {
        const seed = raySeeds[index]
        const directionOffset = index * 3
        const offset = index * 6
        const flicker = 0.5 + Math.abs(Math.sin(elapsed * (1.8 + seed * 0.018) + seed)) * 0.5
        const startRadius = 1.05 + flicker * 0.24
        const endRadius = 1.72 + config.rayPower * flicker + reactiveLevel * 0.92
        const dx = rayDirections[directionOffset]
        const dy = rayDirections[directionOffset + 1]
        const dz = rayDirections[directionOffset + 2] * Math.sin(elapsed + seed)
        raysAttribute.array[offset] = dx * startRadius
        raysAttribute.array[offset + 1] = dy * startRadius
        raysAttribute.array[offset + 2] = dz
        raysAttribute.array[offset + 3] = dx * endRadius
        raysAttribute.array[offset + 4] = dy * endRadius
        raysAttribute.array[offset + 5] = dz * 1.6
      }
      raysAttribute.needsUpdate = true
      rayMaterial.opacity = 0.14 + config.rayPower * 0.22 + reactiveLevel * 0.24

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      disposeObject(scene)
      glowTexture.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="ai-orb__canvas" style={{ width: size, height: size }} />
}

