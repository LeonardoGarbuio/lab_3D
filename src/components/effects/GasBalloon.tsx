// src/components/effects/GasBalloon.tsx
// Balão de gás que infla/desinfla com temperatura

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
    updateBalloon,
    createBalloon,
    type BalloonState
} from '../../systems/GasPhysics'

interface GasBalloonProps {
    id: string
    position: [number, number, number]
    gasFormula: string
    mols: number
    temperature: number         // Celsius
    maxRadius?: number
    color?: string
    onPop?: () => void
}

export function GasBalloon({
    id,
    position,
    gasFormula,
    mols,
    temperature,
    maxRadius = 0.15,
    color = '#ff6b6b',
    onPop
}: GasBalloonProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [balloon, setBalloon] = useState<BalloonState>(() =>
        createBalloon(id, gasFormula, mols, 25, maxRadius, color)
    )
    const [showParticles, setShowParticles] = useState(false)

    // Atualizar balão quando temperatura muda
    useEffect(() => {
        if (balloon.isPopped) return

        const newBalloon = updateBalloon(balloon, temperature)
        setBalloon(newBalloon)

        if (newBalloon.isPopped && onPop) {
            setShowParticles(true)
            onPop()

            // Esconder partículas após animação
            setTimeout(() => setShowParticles(false), 2000)
        }
    }, [temperature])

    // Animação de flutuação
    useFrame((state) => {
        if (!meshRef.current || balloon.isPopped) return

        // Flutuação suave
        const time = state.clock.elapsedTime
        meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02

        // Rotação suave
        meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1
        meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.05

        // Escala suave (respiração)
        const breathe = 1 + Math.sin(time * 3) * 0.02
        meshRef.current.scale.setScalar(balloon.radius * 10 * breathe)
    })

    if (balloon.isPopped && !showParticles) {
        return null
    }

    if (balloon.isPopped && showParticles) {
        // Renderizar partículas de estouro
        return (
            <group position={position}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            (Math.random() - 0.5) * 0.3,
                            (Math.random() - 0.5) * 0.3,
                            (Math.random() - 0.5) * 0.3
                        ]}
                    >
                        <sphereGeometry args={[0.01, 8, 8]} />
                        <meshBasicMaterial color={color} transparent opacity={0.7} />
                    </mesh>
                ))}
            </group>
        )
    }

    return (
        <group position={position}>
            {/* Balão */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    roughness={0.3}
                    metalness={0}
                    clearcoat={0.5}
                />
            </mesh>

            {/* Nó do balão */}
            <mesh position={[0, -balloon.radius * 10 - 0.02, 0]}>
                <coneGeometry args={[0.015, 0.03, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Fio */}
            <mesh position={[0, -balloon.radius * 10 - 0.1, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.15, 8]} />
                <meshBasicMaterial color="#888888" />
            </mesh>

            {/* Reflexo (highlight) */}
            <mesh position={[balloon.radius * 3, balloon.radius * 3, balloon.radius * 3]} scale={balloon.radius * 5}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Info de temperatura/volume (debug) */}
            {/* 
            <Html position={[0, balloon.radius * 12, 0]}>
                <div style={{ color: 'white', fontSize: 10 }}>
                    T: {temperature}°C | V: {balloon.gasState.volume.toFixed(2)}L
                </div>
            </Html>
            */}
        </group>
    )
}
