// src/components/effects/ExplosionEffect.tsx
// Efeito visual de explosão com partículas

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ExplosionEffectProps {
    position: [number, number, number]
    power: number
    color?: string
    onComplete?: () => void
}

export function ExplosionEffect({
    position,
    power,
    color = '#ff6600',
    onComplete
}: ExplosionEffectProps) {
    const particlesRef = useRef<THREE.Points>(null)
    const velocitiesRef = useRef<Float32Array | null>(null)
    const lifeRef = useRef(1.0)

    useEffect(() => {
        if (!particlesRef.current) return

        const count = Math.floor(power * 100)
        const positions = new Float32Array(count * 3)
        const velocities = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Posição inicial (centro da explosão)
            positions[i3] = 0
            positions[i3 + 1] = 0
            positions[i3 + 2] = 0

            // Velocidade aleatória em todas direções
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI
            const speed = (Math.random() * 0.5 + 0.5) * power * 0.1

            velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed
            velocities[i3 + 1] = Math.cos(phi) * speed * 1.5 // Mais para cima
            velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
        }

        const geometry = particlesRef.current.geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

        velocitiesRef.current = velocities
    }, [power])

    useFrame((_, delta) => {
        if (!particlesRef.current || !velocitiesRef.current) return

        // Animar partículas
        const geometry = particlesRef.current.geometry
        const positions = geometry.attributes.position.array as Float32Array
        const velocities = velocitiesRef.current

        for (let i = 0; i < positions.length; i += 3) {
            // Aplicar velocidade
            positions[i] += velocities[i]
            positions[i + 1] += velocities[i + 1]
            positions[i + 2] += velocities[i + 2]

            // Aplicar gravidade
            velocities[i + 1] -= 0.01
        }

        geometry.attributes.position.needsUpdate = true

        // Fade out
        lifeRef.current -= delta * 0.8
        const material = particlesRef.current.material as THREE.PointsMaterial
        material.opacity = Math.max(0, lifeRef.current)

        if (lifeRef.current <= 0 && onComplete) {
            onComplete()
        }
    })

    return (
        <points ref={particlesRef} position={position}>
            <bufferGeometry />
            <pointsMaterial
                color={color}
                size={0.08}
                transparent
                opacity={1}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}
