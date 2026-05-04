"use client"

import { useEffect, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { Mesh } from "three"

import { useModelManipulator } from "@/hooks/use-model-manipulator"
import type { SpatialGestureEvent } from "@/lib/spatial-types"

function DemoCube({ event }: { event: SpatialGestureEvent | null }) {
  const meshRef = useRef<Mesh>(null)
  const manipulator = useModelManipulator(event)

  useEffect(() => {
    if (manipulator.resetSignal && meshRef.current) {
      meshRef.current.position.set(0, 0, 0)
      meshRef.current.rotation.set(0, 0, 0)
      meshRef.current.scale.set(1, 1, 1)
    }
  }, [manipulator.resetSignal])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (manipulator.holding) {
      meshRef.current.rotation.y += delta * 2
      meshRef.current.position.x = (manipulator.position.x - 0.5) * 3
      meshRef.current.position.y = (0.5 - manipulator.position.y) * 2
    } else if (manipulator.selected) {
      meshRef.current.scale.setScalar(1.18)
    } else {
      meshRef.current.rotation.y += delta * 0.35
      const nextScale = meshRef.current.scale.x + (1 - meshRef.current.scale.x) * 0.1
      meshRef.current.scale.setScalar(nextScale)
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial
        color={manipulator.holding ? "#34d399" : manipulator.selected ? "#38bdf8" : "#a1a1aa"}
        metalness={0.35}
        roughness={0.32}
      />
    </mesh>
  )
}

export function SpatialScene({ event }: { event: SpatialGestureEvent | null }) {
  return (
    <div className="relative h-[520px] overflow-hidden border border-white/10 bg-[#080c12]">
      <Canvas camera={{ position: [0, 1.6, 4.5], fov: 50 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <pointLight position={[-4, 2, -2]} intensity={1.1} color="#38bdf8" />
        <DemoCube event={event} />
        <gridHelper args={[8, 8, "#1f2937", "#111827"]} position={[0, -1.2, 0]} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  )
}
