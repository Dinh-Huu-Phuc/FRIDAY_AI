import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

type DashboardThreeCore = {
  dispose: () => void
  setActive: (active: boolean) => void
  setColor: (color: DashboardCoreColor) => void
}

type AudioState = {
  enabled: boolean
  level: number
  analyser: AnalyserNode | null
  data: Uint8Array<ArrayBuffer> | null
  stream: MediaStream | null
  context: AudioContext | null
}

export type DashboardCoreColor = {
  r: number
  g: number
  b: number
  a: number
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

function randomPointOnSphere(radius: number) {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(Math.random() * 2 - 1)
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
    Math.cos(phi) * radius
  )
}

function clampColorChannel(value: number) {
  return THREE.MathUtils.clamp(Math.round(value), 0, 255)
}

function clampAlpha(value: number) {
  return THREE.MathUtils.clamp(value, 0.08, 1)
}

export function createDashboardThreeCore(
  canvas: HTMLCanvasElement,
  initialColor: DashboardCoreColor = { r: 255, g: 193, b: 90, a: 1 }
): DashboardThreeCore {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  const timer = new THREE.Timer()
  const coreColor = new THREE.Color()
  const coreHotColor = new THREE.Color()
  const coreDeepColor = new THREE.Color()
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let animationFrame = 0
  let disposed = false
  let active = false
  let coreAlpha = clampAlpha(initialColor.a)

  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ReinhardToneMapping
  timer.connect(document)
  camera.position.set(0, 0, 34)

  const core = new THREE.Group()
  const sphereGroup = new THREE.Group()
  const filamentGroup = new THREE.Group()
  const particleGroup = new THREE.Group()
  core.add(sphereGroup, filamentGroup, particleGroup)
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

  const sphereRadius = window.innerWidth < 720 ? 7.4 : 8.7
  const sphereLines: Array<THREE.LineLoop | THREE.Mesh> = []
  const circleMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  circleMaterial.userData.tone = "hot"
  const hotCircleMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  hotCircleMaterial.userData.tone = "hot"

  for (let index = 0; index < 34; index += 1) {
    const ring = new THREE.LineLoop(
      createCircleGeometry(sphereRadius * (0.985 + Math.random() * 0.035), 420),
      (index % 7 === 0 ? hotCircleMaterial : circleMaterial).clone()
    )
    ring.rotation.x = Math.random() * Math.PI
    ring.rotation.y = Math.random() * Math.PI
    ring.rotation.z = Math.random() * Math.PI
    ring.userData.speed = (Math.random() - 0.5) * 0.52
    sphereGroup.add(ring)
    sphereLines.push(ring)
  }

  const torusMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  torusMaterial.userData.tone = "hot"

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius * 1.006, 64, 36),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.07,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  shell.material.userData.tone = "base"
  sphereGroup.add(shell)
  sphereLines.push(shell)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(sphereRadius * 1.018, 0.045, 16, 420),
    torusMaterial.clone()
  )
  rim.userData.speed = 0.18
  sphereGroup.add(rim)
  sphereLines.push(rim)

  const nucleusCount = 480
  const nucleusPositions = new Float32Array(nucleusCount * 3)

  for (let index = 0; index < nucleusCount; index += 1) {
    const point = randomPointOnSphere(sphereRadius * (0.18 + Math.random() * 0.78))
    nucleusPositions[index * 3] = point.x
    nucleusPositions[index * 3 + 1] = point.y
    nucleusPositions[index * 3 + 2] = point.z
  }

  const nucleusGeometry = new THREE.BufferGeometry()
  nucleusGeometry.setAttribute("position", new THREE.BufferAttribute(nucleusPositions, 3))
  const nucleus = new THREE.Points(
    nucleusGeometry,
    new THREE.PointsMaterial({
      size: 0.09,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  nucleus.material.userData.tone = "hot"
  core.add(nucleus)

  const nodeCount = window.innerWidth < 720 ? 240 : 380
  const nodes: THREE.Vector3[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const point = randomPointOnSphere(sphereRadius * (0.86 + Math.random() * 0.18))
    nodes.push(point)
  }

  const filamentPositions: number[] = []

  for (let index = 0; index < nodes.length; index += 1) {
    const a = nodes[index]

    for (let inner = index + 1; inner < nodes.length; inner += 1) {
      const b = nodes[inner]

      if (a.distanceTo(b) < 3.25 && Math.random() > 0.28) {
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
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  filamentMaterial.userData.tone = "hot"
  filamentGroup.add(new THREE.LineSegments(filamentGeometry, filamentMaterial))

  const nodeGeometry = new THREE.BufferGeometry()
  nodeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(nodes.flatMap((node) => [node.x, node.y, node.z]), 3))
  const nodePoints = new THREE.Points(
    nodeGeometry,
    new THREE.PointsMaterial({
      size: 0.18,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  nodePoints.material.userData.tone = "hot"
  filamentGroup.add(nodePoints)

  const particleCount = window.innerWidth < 720 ? 2200 : 4200
  const particlePositions = new Float32Array(particleCount * 3)

  for (let index = 0; index < particleCount; index += 1) {
    const radius = sphereRadius + 2 + Math.pow(Math.random(), 0.62) * 24
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
      size: 0.036,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  particles.material.userData.tone = "base"
  particleGroup.add(particles)

  const reflection = sphereGroup.clone(true)
  reflection.scale.y = -0.28
  reflection.position.y = -sphereRadius * 2.42
  reflection.traverse((object) => {
    if ("material" in object) {
      const material = object.material
      if (Array.isArray(material)) {
        object.material = material.map((item) => item.clone())
      } else if (material instanceof THREE.Material) {
        object.material = material.clone()
      }

      const clonedMaterial = object.material
      if (Array.isArray(clonedMaterial)) {
        clonedMaterial.forEach((item) => {
          item.opacity *= 0.18
        })
      } else if (clonedMaterial instanceof THREE.Material) {
        clonedMaterial.opacity *= 0.18
      }
    }
  })
  core.add(reflection)

  const grid = new THREE.GridHelper(150, 54, 0x7a2d00, 0xff8c00)
  grid.position.set(0, -12.8, -14)
  grid.material.transparent = true
  grid.material.opacity = 0.12
  if (!Array.isArray(grid.material)) grid.material.userData.tone = "deep"
  scene.add(grid)

  const farGrid = new THREE.GridHelper(220, 44, 0x7a2d00, 0xff8c00)
  farGrid.position.set(0, -16, -38)
  farGrid.material.transparent = true
  farGrid.material.opacity = 0.045
  if (!Array.isArray(farGrid.material)) farGrid.material.userData.tone = "deep"
  scene.add(farGrid)

  function applyCoreColor(nextColor: DashboardCoreColor) {
    const r = clampColorChannel(nextColor.r) / 255
    const g = clampColorChannel(nextColor.g) / 255
    const b = clampColorChannel(nextColor.b) / 255
    coreAlpha = clampAlpha(nextColor.a)
    coreColor.setRGB(r, g, b)
    coreHotColor.copy(coreColor).lerp(new THREE.Color(1, 0.92, 0.62), 0.42)
    coreDeepColor.copy(coreColor).lerp(new THREE.Color(0, 0, 0), 0.68)

    scene.traverse((object) => {
      if (!("material" in object)) return

      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.Material) || !("color" in material)) return

        const coloredMaterial = material as THREE.Material & { color: THREE.Color }
        const tone = coloredMaterial.userData.tone

        if (tone === "hot") {
          coloredMaterial.color.copy(coreHotColor)
        } else if (tone === "deep") {
          coloredMaterial.color.copy(coreDeepColor)
        } else {
          coloredMaterial.color.copy(coreColor)
        }
      })
    })
  }

  applyCoreColor(initialColor)

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

    sphereLines.forEach((ring, index) => {
      ring.rotation.z += ring.userData.speed * 0.01 * (1 + audioBoost * 2.7)

      if (index % 2 === 0) {
        ring.rotation.x += 0.0009 * (1 + audioBoost)
      } else {
        ring.rotation.y -= 0.0008 * (1 + audioBoost)
      }

      const material = ring.material
      if (!Array.isArray(material)) {
        material.opacity = Math.min(0.98, 0.2 + breathing * 0.34 + audioBoost * 0.14) * coreAlpha
      }
    })

    filamentGroup.rotation.z -= 0.0017 * (1 + audioBoost * 2.1)
    filamentGroup.rotation.y += 0.0011
    filamentMaterial.opacity = (0.22 + breathing * 0.22 + audioBoost * 0.32) * coreAlpha
    nodePoints.material.opacity = (0.64 + breathing * 0.24 + audioBoost * 0.3) * coreAlpha

    nucleus.rotation.z += 0.006 * (1 + audioBoost * 2.4)
    nucleus.material.opacity = (0.62 + breathing * 0.3 + audioBoost * 0.26) * coreAlpha
    reflection.rotation.y = sphereGroup.rotation.y
    reflection.rotation.z = sphereGroup.rotation.z

    particleGroup.rotation.y -= 0.0008 * (1 + audioBoost)
    particleGroup.rotation.x += 0.00035
    particles.material.opacity = (0.38 + audioBoost * 0.32) * coreAlpha

    grid.position.z = Math.sin(elapsed * 0.45) * 2 - 2
    grid.position.x = pointer.x * -1.8
    grid.material.opacity = (0.09 + audioBoost * 0.05) * coreAlpha
    farGrid.position.x = pointer.x * -3.2
    farGrid.material.opacity = (0.035 + audioBoost * 0.035) * coreAlpha

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
    setColor(nextColor) {
      applyCoreColor(nextColor)
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
