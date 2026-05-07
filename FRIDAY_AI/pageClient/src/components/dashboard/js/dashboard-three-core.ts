import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

type DashboardThreeCore = {
  dispose: () => void
  setActive: (active: boolean) => void
  setCoreColor: (color: string) => void
  resize: () => void
}

type DashboardThreeCoreOptions = {
  canvas: HTMLCanvasElement
  coreColor?: string
  renderer: THREE.WebGLRenderer
}

type AudioState = {
  enabled: boolean
  level: number
  analyser: AnalyserNode | null
  data: Uint8Array<ArrayBuffer> | null
  stream: MediaStream | null
  context: AudioContext | null
}

function createCircleGeometry(radius: number, segments = 192) {
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

function createGlowTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext("2d")
  if (!context) return new THREE.CanvasTexture(canvas)

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, "rgba(255,255,255,1)")
  gradient.addColorStop(0.18, "rgba(255,218,132,0.96)")
  gradient.addColorStop(0.48, "rgba(255,140,0,0.44)")
  gradient.addColorStop(1, "rgba(255,140,0,0)")

  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)

  return new THREE.CanvasTexture(canvas)
}

function createCorePalette(colorValue: string) {
  const base = new THREE.Color(colorValue)
  const hot = base.clone().lerp(new THREE.Color(0xffffff), 0.58)
  const mid = base.clone().lerp(new THREE.Color(0xffc15a), 0.18)
  const deep = base.clone().lerp(new THREE.Color(0x120600), 0.46)
  return { base, hot, mid, deep }
}

export function createDashboardThreeCore({ canvas, coreColor = "#ffbd34", renderer }: DashboardThreeCoreOptions): DashboardThreeCore {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1000)
  const timer = new THREE.Timer()
  let palette = createCorePalette(coreColor)
  const amber = palette.mid.getHex()
  const amberHot = palette.hot.getHex()
  const deepAmber = palette.deep.getHex()
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let animationFrame = 0
  let disposed = false
  let active = false
  let lastTimestamp = 0

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.autoClear = false
  timer.connect(document)
  camera.position.set(0, 0, 34)

  const core = new THREE.Group()
  const ringGroup = new THREE.Group()
  const filamentGroup = new THREE.Group()
  const particleGroup = new THREE.Group()
  core.add(ringGroup, filamentGroup, particleGroup)
  scene.add(core)

  const renderPass = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5), 0.5, 0.14, 0.32)
  const composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  composer.addPass(bloomPass)

  const coreRadius = 4.15
  const rings: THREE.LineLoop[] = []
  const ringMaterial = new THREE.LineBasicMaterial({
    color: amberHot,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const sphereRingRadius = coreRadius * 1.22
  const sphereRingSegments = window.innerWidth < 720 ? 192 : 320
  const ringConfigs = [
    { x: 0, y: 0, z: 0, speed: 0.044 },
    { x: Math.PI * 0.5, y: 0, z: 0, speed: -0.038 },
    { x: 0, y: Math.PI * 0.5, z: 0, speed: 0.034 },
    { x: Math.PI * 0.34, y: 0, z: Math.PI * 0.18, speed: -0.028 },
    { x: -Math.PI * 0.34, y: 0, z: -Math.PI * 0.18, speed: 0.03 },
    { x: Math.PI * 0.5, y: Math.PI * 0.25, z: 0, speed: -0.026 },
    { x: Math.PI * 0.5, y: -Math.PI * 0.25, z: 0, speed: 0.024 },
    { x: Math.PI * 0.18, y: Math.PI * 0.5, z: Math.PI * 0.32, speed: -0.022 },
  ]

  ringConfigs.forEach((config) => {
    const ring = new THREE.LineLoop(createCircleGeometry(sphereRingRadius, sphereRingSegments), ringMaterial.clone())
    ring.rotation.set(config.x, config.y, config.z)
    ring.userData.baseRotation = new THREE.Euler(config.x, config.y, config.z)
    ring.userData.speed = config.speed
    ringGroup.add(ring)
    rings.push(ring)
  })

  const glowTexture = createGlowTexture()
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: amberHot,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  coreGlow.scale.set(9.5, 9.5, 1)
  core.add(coreGlow)

  const networkGroup = new THREE.Group()
  const nodeCount = window.innerWidth < 720 ? 2800 : 5600
  const coreNodeCount = Math.floor(nodeCount * 0.38)
  const outerNodeCount = nodeCount - coreNodeCount
  const nodePositions = new Float32Array(nodeCount * 3)
  const nodeColors = new Float32Array(nodeCount * 3)
  const nodeVectors: THREE.Vector3[] = new Array(nodeCount)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const nodeBands = new Float32Array(nodeCount)
  const nodeCoreFlags = new Uint8Array(nodeCount)

  for (let index = 0; index < nodeCount; index += 1) {
    const isCoreNode = index < coreNodeCount
    const localIndex = isCoreNode ? index : index - coreNodeCount
    const localCount = isCoreNode ? coreNodeCount : outerNodeCount
    const theta = localIndex * goldenAngle
    const phi = Math.acos(1 - (2 * (localIndex + 0.5)) / localCount)
    const band = localIndex / Math.max(1, localCount - 1)
    const fractalNoise =
      Math.sin(localIndex * 12.9898) * 0.08 +
      Math.sin(localIndex * 78.233 + band * 19.19) * 0.045
    const radius = isCoreNode
      ? coreRadius * Math.max(0.04, Math.pow(band, 2.35) * 0.42 + fractalNoise * 0.24)
      : coreRadius * Math.min(1, 0.32 + Math.pow(band, 0.62) * 0.68 + fractalNoise * 0.32)
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)
    const offset = index * 3
    const color = isCoreNode ? palette.hot : palette.mid.clone().lerp(palette.deep, Math.min(1, band * 0.7))

    nodePositions[offset] = x
    nodePositions[offset + 1] = y
    nodePositions[offset + 2] = z
    nodeColors[offset] = color.r
    nodeColors[offset + 1] = color.g
    nodeColors[offset + 2] = color.b
    nodeBands[index] = band
    nodeCoreFlags[index] = isCoreNode ? 1 : 0
    nodeVectors[index] = new THREE.Vector3(x, y, z)
  }

  const nodeGeometry = new THREE.BufferGeometry()
  nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3))
  nodeGeometry.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3))
  const nodes = new THREE.Points(
    nodeGeometry,
    new THREE.PointsMaterial({
      map: glowTexture,
      color: 0xffffff,
      size: window.innerWidth < 720 ? 0.058 : 0.046,
      transparent: true,
      opacity: 0.94,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  )
  networkGroup.add(nodes)

  const filamentLinksPerNode = window.innerWidth < 720 ? 3 : 4
  const filamentCount = nodeCount * filamentLinksPerNode
  const filamentPositions = new Float32Array(filamentCount * 6)
  const filamentColors = new Float32Array(filamentCount * 6)
  const linkOffsets = [1, 2, 5, 13, 34, 89, 144]
  let filamentOffset = 0

  for (let index = 0; index < nodeCount; index += 1) {
    const a = nodeVectors[index]
    const isCoreNode = index < coreNodeCount
    const localSpan = isCoreNode ? coreNodeCount : outerNodeCount
    const baseIndex = isCoreNode ? 0 : coreNodeCount

    for (let link = 0; link < filamentLinksPerNode; link += 1) {
      const linkedIndex = baseIndex + ((index - baseIndex + linkOffsets[(index + link) % linkOffsets.length] * (link + 1)) % localSpan)
      const b = nodeVectors[linkedIndex]
      const distance = a.distanceTo(b)
      if (distance > (isCoreNode ? coreRadius * 0.34 : coreRadius * 0.22)) continue

      const positionOffset = filamentOffset * 6
      const colorOffset = filamentOffset * 6
      const color = isCoreNode ? palette.hot : palette.mid
      filamentPositions[positionOffset] = a.x
      filamentPositions[positionOffset + 1] = a.y
      filamentPositions[positionOffset + 2] = a.z
      filamentPositions[positionOffset + 3] = b.x
      filamentPositions[positionOffset + 4] = b.y
      filamentPositions[positionOffset + 5] = b.z

      filamentColors[colorOffset] = color.r
      filamentColors[colorOffset + 1] = color.g
      filamentColors[colorOffset + 2] = color.b
      filamentColors[colorOffset + 3] = color.r
      filamentColors[colorOffset + 4] = color.g
      filamentColors[colorOffset + 5] = color.b
      filamentOffset += 1
    }
  }

  const filamentGeometry = new THREE.BufferGeometry()
  filamentGeometry.setAttribute("position", new THREE.BufferAttribute(filamentPositions.subarray(0, filamentOffset * 6), 3))
  filamentGeometry.setAttribute("color", new THREE.BufferAttribute(filamentColors.subarray(0, filamentOffset * 6), 3))
  const filamentMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.26,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  filamentGroup.add(new THREE.LineSegments(filamentGeometry, filamentMaterial))
  networkGroup.add(filamentGroup)
  core.add(networkGroup)

  function applyCoreColor(colorValue: string) {
    palette = createCorePalette(colorValue)
    ringMaterial.color.copy(palette.hot)
    coreGlow.material.color.copy(palette.hot)
    grid.material.color.copy(palette.mid)
    farGrid.material.color.copy(palette.deep)

    rings.forEach((ring) => {
      const material = ring.material
      if (!Array.isArray(material)) {
        ;(material as THREE.LineBasicMaterial).color.copy(palette.hot).lerp(palette.mid, 0.24)
      }
    })

    const nodeColorAttribute = nodeGeometry.getAttribute("color") as THREE.BufferAttribute
    for (let index = 0; index < nodeCount; index += 1) {
      const offset = index * 3
      const band = nodeBands[index]
      const color = nodeCoreFlags[index]
        ? palette.hot
        : palette.mid.clone().lerp(palette.deep, Math.min(1, band * 0.7))
      nodeColorAttribute.array[offset] = color.r
      nodeColorAttribute.array[offset + 1] = color.g
      nodeColorAttribute.array[offset + 2] = color.b
    }
    nodeColorAttribute.needsUpdate = true

    const filamentColorAttribute = filamentGeometry.getAttribute("color") as THREE.BufferAttribute
    for (let index = 0; index < filamentColorAttribute.count; index += 1) {
      const offset = index * 3
      const color = index % 6 < 2 ? palette.hot : palette.mid
      filamentColorAttribute.array[offset] = color.r
      filamentColorAttribute.array[offset + 1] = color.g
      filamentColorAttribute.array[offset + 2] = color.b
    }
    filamentColorAttribute.needsUpdate = true
  }

  const grid = new THREE.GridHelper(150, 34, deepAmber, amber)
  grid.position.set(0, -14, -16)
  grid.material.transparent = true
  grid.material.opacity = 0.12
  scene.add(grid)

  const farGrid = new THREE.GridHelper(220, 26, deepAmber, amber)
  farGrid.position.set(0, -16, -38)
  farGrid.material.transparent = true
  farGrid.material.opacity = 0.045
  scene.add(farGrid)

  applyCoreColor(coreColor)

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
    const renderScale = width < 720 ? 0.66 : 0.75
    const renderWidth = Math.max(1, Math.floor(width * renderScale))
    const renderHeight = Math.max(1, Math.floor(height * renderScale))
    const bloomWidth = Math.max(1, Math.floor(renderWidth * 0.5))
    const bloomHeight = Math.max(1, Math.floor(renderHeight * 0.5))

    canvas.style.width = "100vw"
    canvas.style.height = "100vh"
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    renderer.setSize(renderWidth, renderHeight, false)
    composer.setSize(renderWidth, renderHeight)
    bloomPass.resolution.set(bloomWidth, bloomHeight)
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
    const delta = timestamp === undefined || lastTimestamp === 0 ? 1 / 60 : Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    lastTimestamp = timestamp ?? lastTimestamp
    const frame = delta * 60

    updateAudioLevel()

    pointer.x += (pointer.targetX - pointer.x) * Math.min(1, 0.04 * frame)
    pointer.y += (pointer.targetY - pointer.y) * Math.min(1, 0.04 * frame)

    const audioBoost = THREE.MathUtils.clamp(active ? audioState.level * 5.2 : 0.34, 0.18, 1.65)
    const breathing = 0.5 + Math.sin(elapsed * 1.9) * 0.5
    const scale = 1 + breathing * 0.025 + audioBoost * 0.18

    core.scale.setScalar(scale)
    core.rotation.y += (0.0024 + audioBoost * 0.014) * frame
    core.rotation.x = pointer.y * 0.1
    core.rotation.z = pointer.x * 0.045
    camera.position.x = pointer.x * 2.8
    camera.position.y = -pointer.y * 1.8
    camera.position.z = 34 + pointer.y * 0.9
    camera.lookAt(scene.position)

    ringGroup.rotation.y += 0.0012 * (1 + audioBoost * 0.8) * frame
    ringGroup.rotation.z -= 0.00045 * (1 + audioBoost * 0.35) * frame

    rings.forEach((ring) => {
      ring.rotation.z += ring.userData.speed * 0.01 * (1 + audioBoost * 0.75) * frame

      const material = ring.material
      if (!Array.isArray(material)) {
        material.opacity = 0.13 + breathing * 0.07 + audioBoost * 0.055
      }
    })

    networkGroup.rotation.z -= 0.0009 * (1 + audioBoost * 1.4) * frame
    networkGroup.rotation.y += 0.0019 * (1 + audioBoost * 1.8) * frame
    filamentGroup.rotation.z -= 0.0012 * (1 + audioBoost * 1.6) * frame
    filamentGroup.rotation.y += 0.0008 * frame
    filamentMaterial.opacity = 0.11 + breathing * 0.045 + audioBoost * 0.06
    ;(nodes.material as THREE.PointsMaterial).opacity = 0.5 + breathing * 0.09 + audioBoost * 0.08
    ;(nodes.material as THREE.PointsMaterial).size = (window.innerWidth < 720 ? 0.05 : 0.04) + breathing * 0.004 + audioBoost * 0.007
    coreGlow.material.opacity = 0.055 + breathing * 0.03 + audioBoost * 0.04
    coreGlow.scale.setScalar(7.6 + breathing * 0.55 + audioBoost * 0.7)

    grid.position.z = Math.sin(elapsed * 0.45) * 2 - 2
    grid.position.x = pointer.x * -1.8
    grid.material.opacity = 0.09 + audioBoost * 0.05
    farGrid.position.x = pointer.x * -3.2
    farGrid.material.opacity = 0.035 + audioBoost * 0.035

    bloomPass.strength = 0.42 + breathing * 0.08 + audioBoost * 0.2
    bloomPass.radius = 0.14 + audioBoost * 0.035
    bloomPass.threshold = 0.3
    renderer.clear()
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
        resize()
        void startMicrophone()
      } else {
        stopMicrophone()
      }
    },
    setCoreColor: applyCoreColor,
    resize,
    dispose() {
      disposed = true
      cancelAnimationFrame(animationFrame)
      stopMicrophone()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
      timer.dispose()
      glowTexture.dispose()

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
    },
  }
}
