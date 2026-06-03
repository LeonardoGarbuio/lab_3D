// src/components/effects/HazardEffects3D.tsx
// Renderização 3D dos efeitos de perigo

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type {
    HazardEffect
} from '../../systems/HazardEffects'

interface HazardEffects3DProps {
    effects: HazardEffect[]
}

export function HazardEffects3D({ effects }: HazardEffects3DProps) {
    return (
        <group>
            {effects.map((effect, index) => (
                <EffectRenderer key={`${effect.type}-${index}`} effect={effect} />
            ))}
        </group>
    )
}

function EffectRenderer({ effect }: { effect: HazardEffect }) {
    switch (effect.type) {
        case 'explosion':
            return <ExplosionEffect effect={effect} />
        case 'fire':
            return <FireEffect effect={effect} />
        case 'corrosion':
            return <CorrosionEffect effect={effect} />
        case 'broken-glass':
            return <GlassShatterEffect effect={effect} />
        case 'toxic-gas':
            return <ToxicGasEffect effect={effect} />
        case 'chemical-spill':
            return <ChemicalSpillEffect effect={effect} />
        case 'smoke':
            return <SmokeEffect effect={effect} />
        default:
            return null
    }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPLOSÃO
// ═══════════════════════════════════════════════════════════════════════

function ExplosionEffect({ effect }: { effect: HazardEffect }) {
    const groupRef = useRef<THREE.Group>(null)
    const particlesRef = useRef<THREE.Points>(null)

    const phase = effect.data?.currentPhase || 0
    const color = effect.data?.color || '#ff6600'
    const progress = 1 - effect.intensity

    // Partículas de debris
    const particleCount = 100
    const particles = useMemo(() => {
        const positions = new Float32Array(particleCount * 3)
        const velocities = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI
            const speed = 1 + Math.random() * 3

            positions[i3] = 0
            positions[i3 + 1] = 0
            positions[i3 + 2] = 0

            velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed
            velocities[i3 + 1] = Math.cos(phi) * speed
            velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
        }

        return { positions, velocities }
    }, [])

    useFrame(() => {
        if (!particlesRef.current) return

        const posAttr = particlesRef.current.geometry.attributes.position
        const posArray = posAttr.array as Float32Array

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            posArray[i3] += particles.velocities[i3] * 0.05 * effect.intensity
            posArray[i3 + 1] += (particles.velocities[i3 + 1] - 0.1) * 0.05 * effect.intensity
            posArray[i3 + 2] += particles.velocities[i3 + 2] * 0.05 * effect.intensity
        }

        posAttr.needsUpdate = true
    })

    return (
        <group ref={groupRef} position={effect.position}>
            {/* Flash inicial */}
            {phase === 0 && (
                <mesh>
                    <sphereGeometry args={[effect.radius * 0.5, 16, 16]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={effect.intensity} />
                </mesh>
            )}

            {/* Bola de fogo */}
            {(phase === 1 || phase === 0) && (
                <>
                    <mesh scale={1 + progress * 2}>
                        <sphereGeometry args={[effect.radius * 0.7, 32, 32]} />
                        <meshBasicMaterial color={color} transparent opacity={effect.intensity * 0.8} />
                    </mesh>
                    <mesh scale={1 + progress * 1.5}>
                        <sphereGeometry args={[effect.radius * 0.5, 32, 32]} />
                        <meshBasicMaterial color="#ffff00" transparent opacity={effect.intensity * 0.9} />
                    </mesh>

                    <pointLight color={color} intensity={effect.intensity * 10} distance={effect.radius * 5} />
                </>
            )}

            {/* Fumaça */}
            {phase >= 2 && (
                <mesh scale={1 + progress * 3}>
                    <sphereGeometry args={[effect.radius, 32, 32]} />
                    <meshBasicMaterial color="#333333" transparent opacity={effect.intensity * 0.5} />
                </mesh>
            )}

            {/* Debris */}
            {phase >= 1 && (
                <points ref={particlesRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[particles.positions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        color="#ff4400"
                        size={0.02}
                        transparent
                        opacity={effect.intensity}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            )}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// FOGO
// ═══════════════════════════════════════════════════════════════════════

function FireEffect({ effect }: { effect: HazardEffect }) {
    const flameRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)

    const color = effect.data?.color || '#ff4400'

    useFrame((_, delta) => {
        if (!flameRef.current) return
        timeRef.current += delta * 10

        // Animação de chama
        flameRef.current.children.forEach((child, i) => {
            const mesh = child as THREE.Mesh
            const scale = 0.8 + Math.sin(timeRef.current + i) * 0.2
            mesh.scale.set(scale, 1 + Math.sin(timeRef.current * 2 + i) * 0.3, scale)
        })
    })

    return (
        <group position={effect.position}>
            <group ref={flameRef}>
                {/* Camadas de chama */}
                {[0.3, 0.5, 0.7].map((height, i) => (
                    <mesh key={i} position={[0, height * effect.radius, 0]}>
                        <coneGeometry args={[effect.radius * (1 - height * 0.5), effect.radius * 0.8, 8]} />
                        <meshBasicMaterial
                            color={i === 0 ? '#ffff00' : i === 1 ? '#ff8800' : color}
                            transparent
                            opacity={0.8 - i * 0.2}
                        />
                    </mesh>
                ))}
            </group>

            <pointLight color={color} intensity={effect.intensity * 5} distance={effect.radius * 3} />

            {/* Partículas de fagulha */}
            <SparkParticles position={[0, effect.radius, 0]} intensity={effect.intensity} />
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// CORROSÃO
// ═══════════════════════════════════════════════════════════════════════

function CorrosionEffect({ effect }: { effect: HazardEffect }) {
    const bubblesRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)

    const damageProgress = effect.data?.damageProgress || 0
    const bubbling = effect.data?.bubbling || false

    useFrame((_, delta) => {
        if (!bubblesRef.current) return
        timeRef.current += delta

        // Animar bolhas
        bubblesRef.current.children.forEach((child, i) => {
            child.position.y = Math.sin(timeRef.current * 3 + i) * 0.02 + 0.05
            child.scale.setScalar(0.8 + Math.sin(timeRef.current * 5 + i * 0.5) * 0.2)
        })
    })

    return (
        <group position={effect.position}>
            {/* Área de corrosão */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[effect.radius, 16]} />
                <meshStandardMaterial
                    color="#8B4513"
                    transparent
                    opacity={0.5 + damageProgress * 0.3}
                    roughness={1}
                />
            </mesh>

            {/* Bolhas de ácido */}
            {bubbling && (
                <group ref={bubblesRef}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <mesh
                            key={i}
                            position={[
                                (Math.random() - 0.5) * effect.radius,
                                0.05,
                                (Math.random() - 0.5) * effect.radius
                            ]}
                        >
                            <sphereGeometry args={[0.01 + Math.random() * 0.01, 8, 8]} />
                            <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Fumaça de reação */}
            {bubbling && (
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
                </mesh>
            )}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// VIDRO QUEBRADO
// ═══════════════════════════════════════════════════════════════════════

function GlassShatterEffect({ effect }: { effect: HazardEffect }) {
    const fragments = effect.data?.fragments || []

    return (
        <group position={effect.position}>
            {fragments.map((fragment: any) => (
                <mesh
                    key={fragment.id}
                    position={[fragment.position.x - effect.position.x, fragment.position.y, fragment.position.z - effect.position.z]}
                    rotation={[fragment.rotation.x, fragment.rotation.y, fragment.rotation.z]}
                >
                    <tetrahedronGeometry args={[fragment.size]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.4}
                        roughness={0}
                        metalness={0.1}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// GÁS TÓXICO
// ═══════════════════════════════════════════════════════════════════════

function ToxicGasEffect({ effect }: { effect: HazardEffect }) {
    const cloudRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)

    const color = effect.data?.color || '#90EE90'

    useFrame((_, delta) => {
        if (!cloudRef.current) return
        timeRef.current += delta

        // Movimento ondulante
        cloudRef.current.children.forEach((child, i) => {
            child.position.x = Math.sin(timeRef.current + i) * 0.05
            child.position.z = Math.cos(timeRef.current * 0.7 + i) * 0.05
            child.rotation.y += delta * 0.2
        })
    })

    return (
        <group position={effect.position}>
            <group ref={cloudRef}>
                {/* Múltiplas esferas para aparência de nuvem */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            (Math.random() - 0.5) * effect.radius,
                            i * 0.1,
                            (Math.random() - 0.5) * effect.radius
                        ]}
                        scale={0.6 + Math.random() * 0.4}
                    >
                        <sphereGeometry args={[effect.radius * 0.5, 16, 16]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={effect.intensity * 0.3}
                        />
                    </mesh>
                ))}
            </group>

            {/* Partículas de gás */}
            <GasParticles radius={effect.radius} color={color} intensity={effect.intensity} />
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// DERRAMAMENTO QUÍMICO
// ═══════════════════════════════════════════════════════════════════════

function ChemicalSpillEffect({ effect }: { effect: HazardEffect }) {
    const spreadProgress = effect.data?.spreadProgress || 0
    const color = effect.data?.color || '#ff0000'

    return (
        <group position={effect.position}>
            {/* Poça principal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                <circleGeometry args={[effect.radius * spreadProgress, 32]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.7}
                    roughness={0.1}
                    metalness={0.3}
                />
            </mesh>

            {/* Borda da poça */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
                <ringGeometry args={[effect.radius * spreadProgress * 0.9, effect.radius * spreadProgress, 32]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.4}
                    roughness={0.1}
                />
            </mesh>

            {/* Reflexo */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
                <circleGeometry args={[effect.radius * spreadProgress * 0.3, 16]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                />
            </mesh>
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// FUMAÇA
// ═══════════════════════════════════════════════════════════════════════

function SmokeEffect({ effect }: { effect: HazardEffect }) {
    const smokeRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)

    useFrame((_, delta) => {
        if (!smokeRef.current) return
        timeRef.current += delta

        // Movimento ascendente e expansivo
        smokeRef.current.children.forEach((child, _i) => {
            child.position.y += delta * 0.1
            let scale = child.scale.x + delta * 0.05
            
            // Reset particles that have grown/moved too much
            if (child.position.y > effect.radius * 2 || scale > 3) {
                child.position.y = 0
                scale = 1
            }
            
            child.scale.set(scale, scale, scale)
            child.rotation.y += delta * 0.2
        })
    })

    return (
        <group position={effect.position} ref={smokeRef}>
            {Array.from({ length: 6 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        (Math.random() - 0.5) * effect.radius * 0.5,
                        i * 0.1,
                        (Math.random() - 0.5) * effect.radius * 0.5
                    ]}
                >
                    <sphereGeometry args={[effect.radius * 0.3, 12, 12]} />
                    <meshBasicMaterial
                        color="#444444"
                        transparent
                        opacity={effect.intensity * 0.3 * (1 - i / 6)}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

function SparkParticles({ position, intensity }: { position: number[]; intensity: number }) {
    const pointsRef = useRef<THREE.Points>(null)

    const particles = useMemo(() => {
        const count = 30
        const positions = new Float32Array(count * 3)
        const velocities: number[][] = []

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0
            positions[i * 3 + 1] = 0
            positions[i * 3 + 2] = 0

            velocities.push([
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            ])
        }

        return { positions, velocities, count }
    }, [])

    useFrame(() => {
        if (!pointsRef.current) return

        const posAttr = pointsRef.current.geometry.attributes.position
        const posArray = posAttr.array as Float32Array

        for (let i = 0; i < particles.count; i++) {
            const i3 = i * 3

            // Mover
            posArray[i3] += particles.velocities[i][0] * 0.02
            posArray[i3 + 1] += (particles.velocities[i][1] - 0.05) * 0.02
            posArray[i3 + 2] += particles.velocities[i][2] * 0.02

            // Reset se sair
            if (posArray[i3 + 1] < -0.5 || posArray[i3 + 1] > 1) {
                posArray[i3] = 0
                posArray[i3 + 1] = 0
                posArray[i3 + 2] = 0
            }
        }

        posAttr.needsUpdate = true
    })

    return (
        <points ref={pointsRef} position={position as [number, number, number]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffaa00"
                size={0.01}
                transparent
                opacity={intensity}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

function GasParticles({ radius, color, intensity }: { radius: number; color: string; intensity: number }) {
    const pointsRef = useRef<THREE.Points>(null)

    const count = 50
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2
            const r = Math.random() * radius
            const y = Math.random() * radius

            pos[i * 3] = Math.cos(theta) * r
            pos[i * 3 + 1] = y
            pos[i * 3 + 2] = Math.sin(theta) * r
        }
        return pos
    }, [radius])

    useFrame(() => {
        if (!pointsRef.current) return

        const posAttr = pointsRef.current.geometry.attributes.position
        const posArray = posAttr.array as Float32Array

        for (let i = 0; i < count; i++) {
            posArray[i * 3 + 1] += 0.002 // Subir

            // Reset
            if (posArray[i * 3 + 1] > radius * 1.5) {
                posArray[i * 3 + 1] = 0
            }
        }

        posAttr.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={color}
                size={0.02}
                transparent
                opacity={intensity * 0.5}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
