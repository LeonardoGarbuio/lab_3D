// src/components/canvas/effects/QuantumZoom.tsx
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  formula: string | null
}

export function QuantumZoom({ formula }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const nucleusRef = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Points>(null)
  const electronsGroup = useRef<THREE.Group>(null)
  const [leaping, setLeaping] = useState(false)

  // Generate probability cloud points
  const particleCount = 10000
  const cloudParticles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const color = new THREE.Color()

    for (let i = 0; i < particleCount; i++) {
      // Use spherical distribution with higher density near the center
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = Math.pow(Math.random(), 0.5) * 8 // radius

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Color depends on radius (purple-ish inner, blue-ish outer)
      color.setHSL(0.6 + (r / 8) * 0.2, 0.8, 0.5)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    return { positions, colors }
  }, [])

  // Quantum leap effect state
  const leapProgress = useRef(0)
  const photonRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    // Listen for custom event or state to trigger leap
    const handleLeap = () => {
      setLeaping(true)
      leapProgress.current = 0
    }
    window.addEventListener('trigger-quantum-leap', handleLeap)
    return () => window.removeEventListener('trigger-quantum-leap', handleLeap)
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.1
      groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.1
    }

    if (nucleusRef.current) {
      // Subtle pulse on nucleus
      const scale = 1 + Math.sin(t * 5) * 0.05
      nucleusRef.current.scale.set(scale, scale, scale)
    }

    if (cloudRef.current) {
      const material = cloudRef.current.material as THREE.PointsMaterial
      material.size = 0.05 + Math.sin(t * 2) * 0.02
      // Rotate cloud slowly
      cloudRef.current.rotation.y = -t * 0.05
    }

    if (electronsGroup.current) {
      electronsGroup.current.children.forEach((el, i) => {
        // Orbit electrons
        const speed = 2 + i * 0.5
        const radius = 3 + i * 1.5
        el.position.x = Math.cos(t * speed + i) * radius
        el.position.z = Math.sin(t * speed + i) * radius
        el.position.y = Math.sin(t * speed * 0.5 + i) * (radius * 0.5)
      })
    }

    // Quantum leap logic
    if (leaping && photonRef.current) {
      leapProgress.current += delta * 2
      
      const p = leapProgress.current
      if (p < 1) {
        // Electron jumping (just visual representation using the photon mesh for now)
        photonRef.current.visible = true
        // Move from inner shell to outer shell and eject
        const startRadius = 3
        const ejectRadius = 15
        const r = startRadius + (ejectRadius - startRadius) * Math.pow(p, 2)
        photonRef.current.position.set(r, 0, 0)
        
        // Photon emission color pulse
        const mat = photonRef.current.material as THREE.MeshBasicMaterial
        mat.color.setHSL(p * 2, 1, 0.5)
        photonRef.current.scale.setScalar(1 + Math.sin(p * Math.PI) * 2)
      } else {
        setLeaping(false)
        photonRef.current.visible = false
      }
    }
  })

  // Determine atom color based on formula
  const baseColor = formula === 'O2' ? '#ff0000' : formula === 'H2' ? '#ffffff' : '#00f7ff'

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial 
          color={baseColor} 
          emissive={baseColor} 
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.8}
        />
        <pointLight color={baseColor} intensity={5} distance={10} />
      </mesh>

      {/* Probability Cloud */}
      <points ref={cloudRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            args={[cloudParticles.positions, 3]}
            count={particleCount}
          />
          <bufferAttribute 
            attach="attributes-color"
            args={[cloudParticles.colors, 3]}
            count={particleCount}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.05} 
          vertexColors 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Orbiting Electrons */}
      <group ref={electronsGroup}>
        {[0, 1, 2].map((i) => (
          <mesh key={`electron-${i}`}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
            <pointLight color="#ffffff" intensity={0.5} distance={2} />
          </mesh>
        ))}
      </group>

      {/* Photon / Leap Emission */}
      <mesh ref={photonRef} visible={false}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        <pointLight color="#06b6d4" intensity={2} distance={5} />
      </mesh>

      {/* Hologram / Transition grid sphere */}
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial 
          color="#00ffff" 
          wireframe 
          transparent 
          opacity={0.05} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
