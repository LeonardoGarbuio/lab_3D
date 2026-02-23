// src/components/canvas/effects/ParticleSystem.tsx
// Sistema de partículas para efeitos visuais de reações
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════
// BOLHAS (Efervescência)
// ═══════════════════════════════════════════════════════════════════════
interface BubblesProps {
    position: [number, number, number]
    color?: string
    count?: number
    intensity?: number
    active?: boolean
}

export function Bubbles({
    position,
    color = '#ffffff',
    count = 30,
    intensity = 1,
    active = true
}: BubblesProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const particlesRef = useRef<Array<{ y: number; speed: number; x: number; z: number; size: number }>>([])

    // Inicializar partículas
    useMemo(() => {
        particlesRef.current = Array.from({ length: count }, () => ({
            y: Math.random() * 0.5,
            speed: 0.5 + Math.random() * 1.5 * intensity,
            x: (Math.random() - 0.5) * 0.3,
            z: (Math.random() - 0.5) * 0.3,
            size: 0.02 + Math.random() * 0.03,
        }))
    }, [count, intensity])

    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame((_, delta) => {
        if (!meshRef.current || !active) return

        particlesRef.current.forEach((particle, i) => {
            // Subir
            particle.y += particle.speed * delta

            // Movimento lateral ondulante
            const wobble = Math.sin(particle.y * 10 + i) * 0.02

            // Reset quando sai do líquido
            if (particle.y > 1) {
                particle.y = 0
                particle.x = (Math.random() - 0.5) * 0.3
                particle.z = (Math.random() - 0.5) * 0.3
            }

            dummy.position.set(
                position[0] + particle.x + wobble,
                position[1] + particle.y - 0.3,
                position[2] + particle.z
            )
            dummy.scale.setScalar(particle.size * (1 - particle.y * 0.3))
            dummy.updateMatrix()
            meshRef.current!.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    if (!active) return null

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </instancedMesh>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// FUMAÇA / VAPOR
// ═══════════════════════════════════════════════════════════════════════
interface SmokeProps {
    position: [number, number, number]
    color?: string
    count?: number
    active?: boolean
}

export function Smoke({
    position,
    color = '#888888',
    count = 20,
    active = true
}: SmokeProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const particlesRef = useRef<Array<{ y: number; x: number; z: number; life: number; maxLife: number }>>([])

    useMemo(() => {
        particlesRef.current = Array.from({ length: count }, () => ({
            y: Math.random() * 0.5,
            x: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2,
            life: Math.random(),
            maxLife: 2 + Math.random() * 2,
        }))
    }, [count])

    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame((_, delta) => {
        if (!meshRef.current || !active) return

        particlesRef.current.forEach((particle, i) => {
            particle.life += delta
            particle.y += delta * 0.3
            particle.x += (Math.random() - 0.5) * delta * 0.2
            particle.z += (Math.random() - 0.5) * delta * 0.2

            const lifeRatio = particle.life / particle.maxLife

            if (lifeRatio > 1) {
                particle.life = 0
                particle.y = 0
                particle.x = (Math.random() - 0.5) * 0.2
                particle.z = (Math.random() - 0.5) * 0.2
            }

            const scale = 0.05 + lifeRatio * 0.15
            // const opacity = 1 - lifeRatio

            dummy.position.set(
                position[0] + particle.x,
                position[1] + particle.y + 0.5,
                position[2] + particle.z
            )
            dummy.scale.setScalar(scale)
            dummy.updateMatrix()
            meshRef.current!.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    if (!active) return null

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
        </instancedMesh>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// PRECIPITADO (Partículas caindo)
// ═══════════════════════════════════════════════════════════════════════
interface PrecipitateProps {
    position: [number, number, number]
    color?: string
    count?: number
    active?: boolean
}

export function Precipitate({
    position,
    color = '#ffffff',
    count = 40,
    active = true
}: PrecipitateProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const particlesRef = useRef<Array<{ y: number; x: number; z: number; settled: boolean }>>([])

    useMemo(() => {
        particlesRef.current = Array.from({ length: count }, () => ({
            y: 0.3 + Math.random() * 0.5,
            x: (Math.random() - 0.5) * 0.3,
            z: (Math.random() - 0.5) * 0.3,
            settled: false,
        }))
    }, [count])

    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame((_, delta) => {
        if (!meshRef.current || !active) return

        particlesRef.current.forEach((particle, i) => {
            if (!particle.settled) {
                particle.y -= delta * 0.2
                particle.x += (Math.random() - 0.5) * delta * 0.1

                if (particle.y < -0.3) {
                    particle.settled = true
                    particle.y = -0.3 + Math.random() * 0.05
                }
            }

            dummy.position.set(
                position[0] + particle.x,
                position[1] + particle.y,
                position[2] + particle.z
            )
            dummy.scale.setScalar(0.015)
            dummy.updateMatrix()
            meshRef.current!.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    if (!active) return null

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={color} />
        </instancedMesh>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// EXPLOSÃO (Flash + partículas)
// ═══════════════════════════════════════════════════════════════════════
interface ExplosionProps {
    position: [number, number, number]
    color?: string
    active?: boolean
    onComplete?: () => void
}

export function Explosion({
    position,
    color = '#ff6600',
    active = true,
    onComplete
}: ExplosionProps) {
    const timeRef = useRef(0)
    const lightRef = useRef<THREE.PointLight>(null)
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const particlesRef = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number }>>([])

    const count = 50

    useMemo(() => {
        particlesRef.current = Array.from({ length: count }, () => {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI
            const speed = 2 + Math.random() * 3
            return {
                x: 0, y: 0, z: 0,
                vx: Math.sin(phi) * Math.cos(theta) * speed,
                vy: Math.cos(phi) * speed + 2,
                vz: Math.sin(phi) * Math.sin(theta) * speed,
            }
        })
    }, [])

    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame((_, delta) => {
        if (!active) return

        timeRef.current += delta

        // Luz do flash
        if (lightRef.current) {
            const flashIntensity = Math.max(0, 10 - timeRef.current * 15)
            lightRef.current.intensity = flashIntensity
        }

        // Partículas
        if (meshRef.current) {
            particlesRef.current.forEach((particle, i) => {
                particle.x += particle.vx * delta
                particle.y += particle.vy * delta
                particle.z += particle.vz * delta
                particle.vy -= 5 * delta // Gravidade

                const scale = Math.max(0, 0.05 - timeRef.current * 0.02)

                dummy.position.set(
                    position[0] + particle.x,
                    position[1] + particle.y,
                    position[2] + particle.z
                )
                dummy.scale.setScalar(scale)
                dummy.updateMatrix()
                meshRef.current!.setMatrixAt(i, dummy.matrix)
            })

            meshRef.current.instanceMatrix.needsUpdate = true
        }

        // Completar após 2 segundos
        if (timeRef.current > 2 && onComplete) {
            onComplete()
        }
    })

    if (!active) return null

    return (
        <group position={position}>
            <pointLight ref={lightRef} color={color} intensity={10} distance={5} />
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                <sphereGeometry args={[1, 4, 4]} />
                <meshBasicMaterial color={color} />
            </instancedMesh>
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// BRILHO / GLOW (Para reações luminescentes)
// ═══════════════════════════════════════════════════════════════════════
interface GlowProps {
    position: [number, number, number]
    color?: string
    intensity?: number
    active?: boolean
}

export function Glow({
    position,
    color = '#4ecdc4',
    intensity = 1,
    active = true
}: GlowProps) {
    const lightRef = useRef<THREE.PointLight>(null)

    useFrame((state) => {
        if (lightRef.current && active) {
            const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7
            lightRef.current.intensity = intensity * 2 * pulse
        }
    })

    if (!active) return null

    return (
        <pointLight
            ref={lightRef}
            position={position}
            color={color}
            intensity={intensity * 2}
            distance={2}
            decay={2}
        />
    )
}
