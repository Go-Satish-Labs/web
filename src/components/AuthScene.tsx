import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Particles() {
  const ref = useRef<THREE.Points>(null!)
  const count = 3000

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // distribute on a large sphere shell
      const r = 10 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.03
    ref.current.rotation.x += delta * 0.008
  })

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        color="#ffffff"
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </Points>
  )
}

function Grid() {
  const ref = useRef<THREE.LineSegments>(null!)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const verts: number[] = []
    const size = 20, step = 2
    for (let i = -size; i <= size; i += step) {
      verts.push(i, -6, -size, i, -6, size)
      verts.push(-size, -6, i, size, -6, i)
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return geo
  }, [])

  useFrame((state) => {
    ref.current.position.z = (state.clock.elapsedTime * 0.4) % 2
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#333333" transparent opacity={0.35} />
    </lineSegments>
  )
}

function FloatingOrb() {
  const mesh = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    mesh.current.rotation.x = t * 0.12
    mesh.current.rotation.y = t * 0.18
    mesh.current.position.y = Math.sin(t * 0.5) * 0.4
  })
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <icosahedronGeometry args={[2.8, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        wireframe
        transparent
        opacity={0.06}
      />
    </mesh>
  )
}

export default function AuthScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 14], fov: 55 }}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor('#0a0a0a')}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 10, 5]} intensity={1} color="#ffffff" />
      <Particles />
      <Grid />
      <FloatingOrb />
    </Canvas>
  )
}
