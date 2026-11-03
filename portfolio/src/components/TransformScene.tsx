import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function VortexCore() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = t * 1.4
      group.current.rotation.x = t * 0.55
      group.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08)
    }
    if (inner.current) {
      inner.current.rotation.z = -t * 2.2
    }
  })

  return (
    <group ref={group}>
      <mesh scale={1.4}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1.4}
          chromaticAberration={0.22}
          distortion={0.35}
          distortionScale={0.5}
          temporalDistortion={0.2}
          color="#ffffff"
          attenuationColor="#f0a04b"
          attenuationDistance={0.9}
          roughness={0.08}
        />
      </mesh>
      <mesh ref={inner} scale={2.1}>
        <torusGeometry args={[1.1, 0.02, 12, 80]} />
        <meshBasicMaterial color="#f0a04b" transparent opacity={0.7} />
      </mesh>
      <mesh scale={2.7} rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[1.1, 0.015, 12, 80]} />
        <meshBasicMaterial color="#7eb8c9" transparent opacity={0.45} />
      </mesh>
    </group>
  )
}

export function TransformScene() {
  return (
    <div className="sos-transform3d" aria-hidden>
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.5} />
        <VortexCore />
      </Canvas>
    </div>
  )
}
