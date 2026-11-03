import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function Prism() {
  const ref = useRef<THREE.Mesh>(null)
  const target = useRef({ x: 0, y: 0 })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state) => {
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, target.current.x, 0.07)
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, target.current.y, 0.07)
    if (!ref.current) return
    ref.current.rotation.x = pointer.current.y * 0.5 + state.clock.elapsedTime * 0.12
    ref.current.rotation.y = pointer.current.x * 0.75 + state.clock.elapsedTime * 0.18
    ref.current.position.x = pointer.current.x * 0.45
    ref.current.position.y = 0.2 + pointer.current.y * 0.25
  })

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
      <mesh ref={ref} scale={1.45}>
        <octahedronGeometry args={[1.15, 0]} />
        <meshPhysicalMaterial
          color="#f4efe6"
          metalness={0.15}
          roughness={0.08}
          transmission={0.92}
          thickness={1.35}
          ior={1.45}
          transparent
          opacity={0.95}
          reflectivity={0.55}
          iridescence={0.5}
          iridescenceIOR={1.2}
          clearcoat={1}
          clearcoatRoughness={0.12}
          attenuationColor="#f0a04b"
          attenuationDistance={1.4}
        />
      </mesh>
    </Float>
  )
}

function OrbitRings() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.z = state.clock.elapsedTime * 0.08
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
  })

  return (
    <group ref={group}>
      {[1.85, 2.4, 3.0].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2.4, 0.2 * i, 0.4 * i]}>
          <torusGeometry args={[r, 0.012, 16, 140]} />
          <meshBasicMaterial
            color={i === 1 ? '#f0a04b' : '#7eb8c9'}
            transparent
            opacity={0.4 - i * 0.07}
          />
        </mesh>
      ))}
    </group>
  )
}

function DriftParticles() {
  const points = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const arr = new Float32Array(110 * 3)
    for (let i = 0; i < 110; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5.5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4.5
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.elapsedTime * 0.04
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.06
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.028} color="#f0a04b" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 2]} intensity={1.7} color="#fff2d8" />
      <directionalLight position={[-3, -2, -4]} intensity={0.7} color="#7eb8c9" />
      <pointLight position={[0, 1.2, 2]} intensity={1.1} color="#f0a04b" />
      <Prism />
      <OrbitRings />
      <DriftParticles />
    </>
  )
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function HeroScene() {
  const [ok, setOk] = useState(true)

  useEffect(() => {
    if (!supportsWebGL()) setOk(false)
  }, [])

  if (!ok) return <div className="m26-hero3d m26-hero3d--fallback" aria-hidden />

  return (
    <div className="m26-hero3d" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.15, 5.4], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
