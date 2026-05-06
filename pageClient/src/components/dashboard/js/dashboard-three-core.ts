import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

type DashboardThreeCore = {
  dispose: () => void
  setActive: (active: boolean) => void
}

type AudioState = {
  enabled: boolean
  level: number
  analyser: AnalyserNode | null
  data: Uint8Array<ArrayBuffer> | null
  stream: MediaStream | null
  context: AudioContext | null
}

function createCircleGeometry(radius: number, segments = 384) {
  const positions = new Float32Array(segments * 3)

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    positions[index * 3] = Math.cos(angle) * radius
    positions[index * 3 + 1] = Math.sin(angle) * radius
    positions[index * 3 + 2] = 0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  return geometry
}

export function createDashboardThreeCore(canvas: HTMLCanvasElement): DashboardThreeCore {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  const timer = new THREE.Timer()
  const amber = 0xff8c00
  const amberHot = 0xffc15a
  const deepAmber = 0x7a2d00
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let animationFrame = 0
  let disposed = false
  let active = false

  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ReinhardToneMapping
  timer.connect(document)
  camera.position.set(0, 0, 34)

  const core = new THREE.Group()
  const ringGroup = new THREE.Group()
  const filamentGroup = new THREE.Group()
  const particleGroup = new THREE.Group()
  core.add(ringGroup, filamentGroup, particleGroup)
  scene.add(core)

  const renderPass = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.55,
    0.22,
    0.18
  )
  const composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  composer.addPass(bloomPass)

  const rings: Array<THREE.LineLoop | THREE.Mesh> = []
  const circleMaterial = new THREE.LineBasicMaterial({
    color: amber,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const hotCircleMaterial = new THREE.LineBasicMaterial({
    color: amberHot,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const ringConfigs = [
    { radius: 3.6, z: 0.36, x: 0, y: 0, speed: 0.38, material: hotCircleMaterial },
    { radius: 4.75, z: 0.1, x: 0.1, y: 0.16, speed: -0.24, material: circleMaterial },
    { radius: 5.9, z: -0.18, x: -0.12, y: 0.08, speed: 0.18, material: circleMaterial },
    { radius: 7.15, z: 0.22, x: 0.22, y: -0.14, speed: -0.15, material: hotCircleMaterial },
    { radius: 8.45, z: -0.32, x: -0.18, y: -0.2, speed: 0.11, material: circleMaterial },
    { radius: 9.9, z: 0.02, x: Math.PI * 0.5, y: 0, speed: -0.07, material: circleMaterial },
    { radius: 9.9, z: 0.02, x: 0, y: Math.PI * 0.5, speed: 0.085, material: circleMaterial },
  ]

  ringConfigs.forEach((config) => {
    const ring = new THREE.LineLoop(createCircleGeometry(config.radius), config.material.clone())
    ring.position.z = config.z
    ring.rotation.x = config.x
    ring.rotation.y = config.y
    ring.userData.speed = config.speed
    ringGroup.add(ring)
    rings.push(ring)
  })

  const torusMaterial = new THREE.MeshBasicMaterial({
    color: amber,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  ;[
    { radius: 2.15, tube: 0.035, z: 0.04, speed: 0.42 },
    { radius: 6.45, tube: 0.026, z: -0.08, speed: -0.2 },
    { radius: 8.85, tube: 0.02, z: 0.16, speed: 0.13 },
  ].forEach((config) => {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(config.radius, config.tube, 12, 384), torusMaterial.clone())
    torus.position.z = config.z
    torus.userData.speed = config.speed
    ringGroup.add(torus)
    rings.push(torus)
  })

  const nucleusCount = 480
  const nucleusPositions = new Float32Array(nucleusCount * 3)

  for (let index = 0; index < nucleusCount; index += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = 1.1 + Math.random() * 1.55
    nucleusPositions[index * 3] = Math.cos(angle) * radius
    nucleusPositions[index * 3 + 1] = Math.sin(angle) * radius
    nucleusPositions[index * 3 + 2] = (Math.random() - 0.5) * 1.15
  }

  const nucleusGeometry = new THREE.BufferGeometry()
  nucleusGeometry.setAttribute("position", new THREE.BufferAttribute(nucleusPositions, 3))
  const nucleus = new THREE.Points(
    nucleusGeometry,
    new THREE.PointsMaterial({
      color: amberHot,
      size: 0.09,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  core.add(nucleus)

  const nodeCount = window.innerWidth < 720 ? 240 : 380
  const nodes: THREE.Vector3[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = 2.4 + Math.random() * 8.8
    const z = (Math.random() - 0.5) * 5.2 + Math.sin(angle * 3 + radius) * 0.9
    nodes.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z))
  }

  const filamentPositions: number[] = []

  for (let index = 0; index < nodes.length; index += 1) {
    const a = nodes[index]

    for (let inner = index + 1; inner < nodes.length; inner += 1) {
      const b = nodes[inner]

      if (a.distanceTo(b) < 2.75 && Math.random() > 0.42) {
        filamentPositions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }

    if (Math.random() > 0.62) {
      const b = nodes[Math.floor(Math.random() * nodes.length)]
      filamentPositions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }

  const filamentGeometry = new THREE.BufferGeometry()
  filamentGeometry.setAttribute("position", new THREE.Float32BufferAttribute(filamentPositions, 3))
  const filamentMaterial = new THREE.LineBasicMaterial({
    color: amber,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  filamentGroup.add(new THREE.LineSegments(filamentGeometry, filamentMaterial))

  const particleCount = window.innerWidth < 720 ? 2200 : 4200
  const particlePositions = new Float32Array(particleCount * 3)

  for (let index = 0; index < particleCount; index += 1) {
    const radius = 4 + Math.pow(Math.random(), 0.62) * 28
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    particlePositions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius
    particlePositions[index * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.66
    particlePositions[index * 3 + 2] = Math.cos(phi) * radius * 0.58
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: amber,
      size: 0.036,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  particleGroup.add(particles)

  const grid = new THREE.GridHelper(150, 54, deepAmber, amber)
  grid.position.set(0, -14, -16)
  grid.material.transparent = true
  grid.material.opacity = 0.12
  scene.add(grid)

  const farGrid = new THREE.GridHelper(220, 44, deepAmber, amber)
  farGrid.position.set(0, -16, -38)
  farGrid.material.transparent = true
  farGrid.material.opacity = 0.045
  scene.add(farGrid)

  const audioState: AudioState = {
    enabled: false,
    level: 0,
    analyser: null,
    data: null,
    stream: null,
    context: null,
  }

  function updateAudioLevel() {
    if (!audioState.analyser || !audioState.data) {
      audioState.level *= 0.94
      return
    }

    audioState.analyser.getByteFrequencyData(audioState.data)

    let sum = 0
    for (let index = 0; index < audioState.data.length; index += 1) {
      sum += audioState.data[index]
    }

    const average = sum / audioState.data.length / 255
    audioState.level += (average - audioState.level) * 0.22
  }

  async function startMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia || audioState.enabled) return

    try {
      audioState.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      audioState.context = new AudioContext()
      const source = audioState.context.createMediaStreamSource(audioState.stream)
      audioState.analyser = audioState.context.createAnalyser()
      audioState.analyser.fftSize = 512
      audioState.analyser.smoothingTimeConstant = 0.78
      audioState.data = new Uint8Array(audioState.analyser.frequencyBinCount)
      source.connect(audioState.analyser)
      audioState.enabled = true
    } catch {
      audioState.level = 0.24
    }
  }

  function stopMicrophone() {
    audioState.stream?.getTracks().forEach((track) => track.stop())
    void audioState.context?.close().catch(() => null)
    audioState.enabled = false
    audioState.analyser = null
    audioState.data = null
    audioState.stream = null
    audioState.context = null
    audioState.level = 0
  }

  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(width, height)
    composer.setSize(width, height)
    bloomPass.resolution.set(width, height)
  }

  function handlePointerMove(event: PointerEvent) {
    pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2
    pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2
  }

  function handlePointerLeave() {
    pointer.targetX = 0
    pointer.targetY = 0
  }

  function animate(timestamp?: number) {
    if (disposed) return

    animationFrame = requestAnimationFrame(animate)
    timer.update(timestamp)
    const elapsed = timer.getElapsed()

    updateAudioLevel()

    pointer.x += (pointer.targetX - pointer.x) * 0.04
    pointer.y += (pointer.targetY - pointer.y) * 0.04

    const audioBoost = THREE.MathUtils.clamp(active ? audioState.level * 5.2 : 0.34, 0.18, 1.65)
    const breathing = 0.5 + Math.sin(elapsed * 1.9) * 0.5
    const scale = 1 + breathing * 0.025 + audioBoost * 0.18

    core.scale.setScalar(scale)
    core.rotation.y += 0.0024 + audioBoost * 0.014
    core.rotation.x = pointer.y * 0.1
    core.rotation.z = pointer.x * 0.045
    camera.position.x = pointer.x * 2.8
    camera.position.y = -pointer.y * 1.8
    camera.position.z = 34 + pointer.y * 0.9
    camera.lookAt(scene.position)

    rings.forEach((ring, index) => {
      ring.rotation.z += ring.userData.speed * 0.01 * (1 + audioBoost * 2.7)

      if (index % 2 === 0) {
        ring.rotation.x += 0.0009 * (1 + audioBoost)
      } else {
        ring.rotation.y -= 0.0008 * (1 + audioBoost)
      }

      const material = ring.material
      if (!Array.isArray(material)) {
        material.opacity = 0.42 + breathing * 0.42 + audioBoost * 0.18
      }
    })

    filamentGroup.rotation.z -= 0.0017 * (1 + audioBoost * 2.1)
    filamentGroup.rotation.y += 0.0011
    filamentMaterial.opacity = 0.22 + breathing * 0.22 + audioBoost * 0.32

    nucleus.rotation.z += 0.006 * (1 + audioBoost * 2.4)
    nucleus.material.opacity = 0.62 + breathing * 0.3 + audioBoost * 0.26

    particleGroup.rotation.y -= 0.0008 * (1 + audioBoost)
    particleGroup.rotation.x += 0.00035
    particles.material.opacity = 0.38 + audioBoost * 0.32

    grid.position.z = Math.sin(elapsed * 0.45) * 2 - 2
    grid.position.x = pointer.x * -1.8
    grid.material.opacity = 0.09 + audioBoost * 0.05
    farGrid.position.x = pointer.x * -3.2
    farGrid.material.opacity = 0.035 + audioBoost * 0.035

    bloomPass.strength = 1.55 + breathing * 0.22 + audioBoost * 1.85
    bloomPass.radius = 0.18 + audioBoost * 0.08
    bloomPass.threshold = 0.16
    composer.render()
  }

  window.addEventListener("resize", resize)
  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerleave", handlePointerLeave)
  resize()
  animate()

  return {
    setActive(nextActive) {
      active = nextActive

      if (nextActive) {
        void startMicrophone()
      } else {
        stopMicrophone()
      }
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(animationFrame)
      stopMicrophone()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
      timer.dispose()

      scene.traverse((object) => {
        if ("geometry" in object && object.geometry instanceof THREE.BufferGeometry) {
          object.geometry.dispose()
        }

        if ("material" in object) {
          const material = object.material
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose())
          } else if (material instanceof THREE.Material) {
            material.dispose()
          }
        }
      })

      composer.dispose()
      renderer.dispose()
    },
  }
}
