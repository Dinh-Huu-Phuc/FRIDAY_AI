import * as THREE from "three"

type DashboardBackgroundCore = {
  canvas: HTMLCanvasElement
  dispose: () => void
  renderer: THREE.WebGLRenderer
  resize: (width: number, height: number) => void
  setPaused: (paused: boolean) => void
  setScrollProgress: (progress: number) => void
  start: () => void
  stop: () => void
}

function createRing(radius: number, color: number, opacity: number) {
  const points: THREE.Vector3[] = []
  const segments = 256

  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  return new THREE.Line(geometry, material)
}

function createRail(color: number, opacity: number) {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []

  for (let index = 0; index < 28; index += 1) {
    const z = 18 - index * 10
    positions.push(-82, -20, z, -18, -20, z - 46)
    positions.push(82, -20, z, 18, -20, z - 46)
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
}

export function createDashboardBackgroundCore(canvas: HTMLCanvasElement): DashboardBackgroundCore {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 9000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
  const timer = new THREE.Timer()
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let scrollProgress = 0
  let animationFrame = 0
  let disposed = false
  let paused = false
  let running = false

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  timer.connect(document)
  camera.position.set(0, 92, 210)
  camera.lookAt(0, 0, 0)

  const root = new THREE.Group()
  scene.add(root)

  const floorGroup = new THREE.Group()
  root.add(floorGroup)

  const worldGrid = new THREE.GridHelper(6000, 220, 0x00f5ff, 0x0a3340)
  worldGrid.position.set(0, -92, -1450)
  worldGrid.material.transparent = true
  worldGrid.material.opacity = 0.3
  floorGroup.add(worldGrid)

  const nearGrid = new THREE.GridHelper(1600, 96, 0x00f5ff, 0x11505a)
  nearGrid.position.set(0, -58, -160)
  nearGrid.material.transparent = true
  nearGrid.material.opacity = 0.36
  floorGroup.add(nearGrid)

  const floorGrids = [
    new THREE.GridHelper(900, 72, 0x00f5ff, 0x123f48),
    new THREE.GridHelper(900, 72, 0x00f5ff, 0x123f48),
    new THREE.GridHelper(1200, 86, 0xff2b3d, 0x2d1522),
    new THREE.GridHelper(1200, 86, 0xffb83d, 0x33200d),
    new THREE.GridHelper(1400, 96, 0x00f5ff, 0x0a2d36),
  ]

  floorGrids.forEach((grid, index) => {
    grid.position.set(0, -66 - index * 4, 360 - index * 310)
    grid.rotation.x = 0
    grid.material.transparent = true
    grid.material.opacity = index < 2 ? 0.3 : 0.18
    floorGroup.add(grid)
  })

  const ceilingGroup = new THREE.Group()
  ceilingGroup.position.y = 220
  ceilingGroup.rotation.x = Math.PI
  root.add(ceilingGroup)

  const ceilingGrid = new THREE.GridHelper(3000, 96, 0x00f5ff, 0x082b33)
  ceilingGrid.position.set(0, 0, -1200)
  ceilingGrid.material.transparent = true
  ceilingGrid.material.opacity = 0.08
  ceilingGroup.add(ceilingGrid)

  const rails = createRail(0x00f5ff, 0.42)
  rails.scale.set(9, 1.8, 6)
  rails.position.y = -28
  rails.position.z = 220
  const amberRails = createRail(0xffb83d, 0.2)
  amberRails.scale.set(9, 1.8, 6)
  amberRails.position.y = -14
  amberRails.position.z = -140
  floorGroup.add(rails, amberRails)

  const horizonGeometry = new THREE.BufferGeometry()
  const horizonPositions: number[] = []
  for (let index = 0; index < 18; index += 1) {
    const y = -19 + index * 2.8
    const z = -230 + index * 5
    horizonPositions.push(-120, y, z, 120, y, z)
  }
  horizonGeometry.setAttribute("position", new THREE.Float32BufferAttribute(horizonPositions, 3))
  const horizon = new THREE.LineSegments(
    horizonGeometry,
    new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  floorGroup.add(horizon)

  const wallGroup = new THREE.Group()
  root.add(wallGroup)

  const leftWall = new THREE.GridHelper(2600, 74, 0x00f5ff, 0x08333d)
  leftWall.position.set(-1050, 210, -1200)
  leftWall.rotation.z = Math.PI / 2
  leftWall.material.transparent = true
  leftWall.material.opacity = 0.08
  wallGroup.add(leftWall)

  const rightWall = leftWall.clone()
  rightWall.position.x = 1050
  rightWall.material = leftWall.material.clone()
  rightWall.material.opacity = 0.08
  wallGroup.add(rightWall)

  const starCount = window.innerWidth < 720 ? 1000 : 2200
  const starPositions = new Float32Array(starCount * 3)
  const starColors = new Float32Array(starCount * 3)
  const colorA = new THREE.Color(0x00f5ff)
  const colorB = new THREE.Color(0xff2b3d)
  const colorC = new THREE.Color(0xffb83d)

  for (let index = 0; index < starCount; index += 1) {
    const spread = Math.pow(Math.random(), 0.62)
    starPositions[index * 3] = (Math.random() - 0.5) * 2400
    starPositions[index * 3 + 1] = -180 + Math.random() * 560
    starPositions[index * 3 + 2] = 420 - spread * 4200

    const color = index % 9 === 0 ? colorC : index % 3 === 0 ? colorB : colorA
    starColors[index * 3] = color.r
    starColors[index * 3 + 1] = color.g
    starColors[index * 3 + 2] = color.b
  }

  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3))
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      size: 0.72,
      transparent: true,
      opacity: 0.88,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  root.add(stars)

  const ringGroup = new THREE.Group()
  ringGroup.position.set(280, 70, -720)
  ringGroup.rotation.x = 1.2
  ringGroup.rotation.y = -0.42
  root.add(ringGroup)

  ;[
    createRing(9, 0x00f5ff, 0.5),
    createRing(15, 0x00f5ff, 0.32),
    createRing(23, 0xff2b3d, 0.22),
    createRing(32, 0xffb83d, 0.18),
  ].forEach((ring, index) => {
    ring.position.z = index * -3
    ringGroup.add(ring)
  })

  const tunnel = new THREE.Group()
  tunnel.position.set(-420, -18, -760)
  tunnel.rotation.x = 1.35
  tunnel.rotation.y = 0.3
  root.add(tunnel)

  for (let index = 0; index < 26; index += 1) {
    const ring = createRing(42 + index * 18, index % 3 === 0 ? 0xff2b3d : 0x00f5ff, index < 12 ? 0.2 : 0.1)
    ring.position.z = -index * 34
    tunnel.add(ring)
  }

  const scanGeometry = new THREE.PlaneGeometry(1800, 1.8)
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f5ff,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const scanBeam = new THREE.Mesh(scanGeometry, scanMaterial)
  scanBeam.position.set(0, -62, -260)
  scene.add(scanBeam)

  const lowerScan = new THREE.Mesh(
    new THREE.PlaneGeometry(2200, 1.2),
    new THREE.MeshBasicMaterial({
      color: 0xff2b3d,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  lowerScan.position.set(0, -82, -620)
  lowerScan.rotation.x = -0.34
  scene.add(lowerScan)

  const deepScan = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 1),
    new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  deepScan.position.set(0, -92, -1500)
  deepScan.rotation.x = -0.28
  scene.add(deepScan)

  function resize(width = window.innerWidth, height = window.innerHeight) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    renderer.setSize(width, height)
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
    if (disposed || paused) {
      running = false
      return
    }

    timer.update(timestamp)
    const elapsed = timer.getElapsed()
    pointer.x += (pointer.targetX - pointer.x) * 0.045
    pointer.y += (pointer.targetY - pointer.y) * 0.045

    camera.position.x = pointer.x * 72
    camera.position.y = 92 - pointer.y * 36 + scrollProgress * 18
    camera.position.z = 210 - scrollProgress * 36
    camera.lookAt(pointer.x * 86, -94 + scrollProgress * 18, -1250)

    root.rotation.y = pointer.x * 0.035
    root.rotation.x = -pointer.y * 0.025
    stars.rotation.y += 0.00055
    stars.rotation.x = Math.sin(elapsed * 0.18) * 0.012
    stars.position.z = (elapsed * 3.8) % 42

    worldGrid.position.z = -1450 + ((elapsed * 90 + scrollProgress * 1800) % 220)
    worldGrid.position.x = -pointer.x * 42
    nearGrid.position.z = -160 + ((elapsed * 118 + scrollProgress * 1200) % 120)
    nearGrid.position.x = -pointer.x * 26

    const corridorOffset = (elapsed * 98 + scrollProgress * 2200) % 310
    floorGrids.forEach((grid, index) => {
      grid.position.z = 360 - index * 310 + corridorOffset
      grid.position.x = -pointer.x * (30 + index * 18)
      grid.material.opacity = index < 2 ? 0.28 + Math.sin(elapsed * 0.7 + index) * 0.05 : 0.16
    })

    ceilingGrid.position.z = -1200 + ((elapsed * 50 + scrollProgress * 900) % 180)
    wallGroup.position.z = ((elapsed * 36 + scrollProgress * 900) % 160) - 80
    rails.position.z = 220 + ((elapsed * 80 + scrollProgress * 1800) % 260)
    amberRails.position.z = -140 + ((elapsed * 58 + scrollProgress * 1400) % 300)
    horizon.position.x = -pointer.x * 90

    ringGroup.rotation.z += 0.0035
    ringGroup.rotation.y = -0.42 + pointer.x * 0.12
    ringGroup.position.y = 8 + Math.sin(elapsed * 0.8) * 2

    tunnel.rotation.z -= 0.0028
    tunnel.position.x = -420 - pointer.x * 70
    tunnel.position.y = -18 + pointer.y * 24 + Math.sin(elapsed * 0.5) * 12

    scanBeam.position.y = -62 + Math.sin(elapsed * 1.2) * 170
    scanBeam.position.x = pointer.x * 140
    scanBeam.material.opacity = 0.16 + Math.sin(elapsed * 2.4) * 0.08
    lowerScan.position.y = -82 + Math.sin(elapsed * 0.8 + scrollProgress * 4) * 72
    lowerScan.position.x = -pointer.x * 160
    lowerScan.material.opacity = 0.1 + Math.sin(elapsed * 1.7) * 0.05
    deepScan.position.y = -92 + Math.sin(elapsed * 0.58 + scrollProgress * 5) * 54
    deepScan.position.x = pointer.x * 190
    deepScan.material.opacity = 0.08 + Math.sin(elapsed * 1.2) * 0.035

    renderer.clear()
    renderer.render(scene, camera)

    animationFrame = requestAnimationFrame(animate)
  }

  function start() {
    if (disposed || paused || running) return
    running = true
    animationFrame = requestAnimationFrame(animate)
  }

  function stop() {
    if (!running && !animationFrame) return
    running = false
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }

  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerleave", handlePointerLeave)
  resize()
  start()

  return {
    canvas,
    renderer,
    resize(width, height) {
      resize(width, height)
    },
    setPaused(nextPaused) {
      paused = nextPaused
      if (nextPaused) {
        stop()
      } else {
        start()
      }
    },
    setScrollProgress(progress) {
      scrollProgress = THREE.MathUtils.clamp(progress, 0, 1)
    },
    start,
    stop,
    dispose() {
      disposed = true
      stop()
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

      renderer.dispose()
    },
  }
}
