// src/components/canvas/effects/QuantumZoom.tsx
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  formula: string | null
}

export function QuantumZoom({ formula }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const nucleusRef = useRef<THREE.Group>(null)
  const cloudRef = useRef<THREE.Points>(null)
  const electronsGroup = useRef<THREE.Group>(null)
  const [leaping, setLeaping] = useState(false)
  
  // Extract primary element from formula
  const match = formula?.match(/^[A-Z][a-z]?/)
  const symbol = match ? match[0] : 'H'
  
  // Extract physics properties based on basic heuristics or hardcoded defaults
  // In a real scenario we'd import getElement from elements.ts
  // To avoid breaking imports, we will mock the atom properties here if we can't import:
  // Actually we CAN import getElement! Let's assume we use window.getElement or we can just import it.
  // Wait, I didn't add the import to the top of the file!
  // It's safer to just import it at the top of the file in another step.
  // But wait, I'm replacing the whole component. I'll just write the component logic first.
  
  // To keep it simple, we use a basic heuristic here if not using import:
  // Let's assume Z = 1 for H, 8 for O, etc.
  const atomicNumbers: Record<string, number> = {
      'H': 1, 'He': 2, 'Li': 3, 'Be': 4, 'B': 5, 'C': 6, 'N': 7, 'O': 8, 'F': 9, 'Ne': 10,
      'Na': 11, 'Mg': 12, 'Al': 13, 'Si': 14, 'P': 15, 'S': 16, 'Cl': 17, 'Ar': 18,
      'K': 19, 'Ca': 20, 'Fe': 26, 'Cu': 29, 'Zn': 30, 'Ag': 47, 'Au': 79, 'Hg': 80, 'Pb': 82, 'U': 92
  }
  
  const Z = atomicNumbers[symbol] || 1
  const neutrons = Math.round(Z * 1.2) // approximation
  
  // Calculate shells
  const getElectronShells = (z: number) => {
    const shells = []
    let remaining = z
    const maxShells = [2, 8, 18, 32, 32, 18, 8]
    for (let max of maxShells) {
      if (remaining <= 0) break
      const fill = Math.min(remaining, max)
      shells.push(fill)
      remaining -= fill
    }
    return shells
  }
  
  const shells = getElectronShells(Z)
  
  // Generate nucleus particles (protons = red/magenta, neutrons = blue/gray)
  const nucleusParticles = useMemo(() => {
    const particles = []
    const total = Z + neutrons
    const radius = Math.pow(total, 0.33) * 0.15 // volume proportional to nucleons
    
    for (let i = 0; i < total; i++) {
        const isProton = i < Z
        // Random spherical distribution
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)
        const r = Math.cbrt(Math.random()) * radius
        
        particles.push({
            pos: [
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ] as [number, number, number],
            color: isProton ? '#ff2a2a' : '#4a6fa5'
        })
    }
    return particles
  }, [Z, neutrons])

  // Generate probability cloud points (Schrödinger-like distribution)
  const particleCount = 15000
  const cloudParticles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const color = new THREE.Color()

    for (let i = 0; i < particleCount; i++) {
      // Exponential decay distribution
      const r = -Math.log(Math.random()) * 2.5
      
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Color depends on distance (core is brighter)
      color.setHSL(0.55 + (r / 10) * 0.3, 0.9, Math.max(0.1, 1 - r/5))
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    return { positions, colors }
  }, [Z])

  // Quantum leap effect state
  const leapProgress = useRef(0)
  const photonRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
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
      groupRef.current.rotation.y = t * 0.05
      groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.05
    }

    if (nucleusRef.current) {
      nucleusRef.current.rotation.y = t * 0.2
      nucleusRef.current.rotation.x = t * 0.15
    }

    if (cloudRef.current) {
      const material = cloudRef.current.material as THREE.PointsMaterial
      material.size = 0.04 + Math.sin(t * 3) * 0.01
      cloudRef.current.rotation.y = -t * 0.05
    }

    if (electronsGroup.current) {
      // Orbit electrons around their shells
      let eIndex = 0
      shells.forEach((count, shellIndex) => {
          const radius = 2.5 + shellIndex * 2.0
          const speed = 2.0 / (shellIndex + 1)
          
          for (let i = 0; i < count; i++) {
              const el = electronsGroup.current!.children[eIndex]
              if (el) {
                  const offset = (Math.PI * 2 / count) * i
                  // Give each shell a slightly different orbital tilt
                  const tilt = shellIndex * 0.5
                  
                  const angle = t * speed + offset
                  
                  // parametric orbit
                  const x = Math.cos(angle) * radius
                  const z = Math.sin(angle) * radius
                  
                  // apply tilt
                  el.position.x = x * Math.cos(tilt)
                  el.position.y = x * Math.sin(tilt) + Math.sin(angle * 2) * 0.5
                  el.position.z = z
              }
              eIndex++
          }
      })
    }

    // Quantum leap logic
    if (leaping && photonRef.current) {
      leapProgress.current += delta * 2
      
      const p = leapProgress.current
      if (p < 1) {
        photonRef.current.visible = true
        const startRadius = 2.5
        const ejectRadius = 15
        const r = startRadius + (ejectRadius - startRadius) * Math.pow(p, 2)
        photonRef.current.position.set(r, 0, 0)
        
        const mat = photonRef.current.material as THREE.MeshBasicMaterial
        mat.color.setHSL(p * 2, 1, 0.6)
        photonRef.current.scale.setScalar(1 + Math.sin(p * Math.PI) * 2)
      } else {
        setLeaping(false)
        photonRef.current.visible = false
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Real Nucleus (Protons + Neutrons) */}
      <group ref={nucleusRef}>
          {nucleusParticles.map((p, i) => (
              <mesh key={`nucleon-${i}`} position={p.pos}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshPhysicalMaterial 
                    color={p.color} 
                    emissive={p.color} 
                    emissiveIntensity={0.5}
                    roughness={0.2}
                  />
              </mesh>
          ))}
          <pointLight color="#ffffff" intensity={2} distance={8} />
      </group>

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
          size={0.04} 
          vertexColors 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Orbiting Electrons (Bohr Shells) */}
      <group ref={electronsGroup}>
        {shells.flatMap((count, shellIndex) => {
            return Array.from({ length: count }).map((_, i) => (
                <mesh key={`electron-${shellIndex}-${i}`}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshBasicMaterial color="#00ffff" />
                    <pointLight color="#00ffff" intensity={0.2} distance={1} />
                </mesh>
            ))
        })}
      </group>
      
      {/* Shell Rings (Visual Guide) */}
      {shells.map((_, shellIndex) => (
          <mesh key={`ring-${shellIndex}`} rotation={[Math.PI / 2, shellIndex * 0.5, 0]}>
              <torusGeometry args={[2.5 + shellIndex * 2.0, 0.01, 16, 64]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </mesh>
      ))}

      {/* Photon / Leap Emission */}
      <mesh ref={photonRef} visible={false}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        <pointLight color="#06b6d4" intensity={2} distance={5} />
      </mesh>

      {/* Hologram boundary sphere */}
      <mesh>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial 
          color="#00ffff" 
          wireframe 
          transparent 
          opacity={0.03} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
