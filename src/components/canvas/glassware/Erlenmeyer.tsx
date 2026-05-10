// src/components/canvas/glassware/Erlenmeyer.tsx
// Frasco Erlenmeyer 3D
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

interface ErlenmeyerProps {
    position: [number, number, number]
    liquidColor?: string
    liquidLevel?: number
    scale?: number
}

export default function Erlenmeyer({
    position,
    liquidColor = '#90EE90',
    liquidLevel = 0.4,
    scale = 1
}: ErlenmeyerProps) {
    const groupRef = useRef<Group>(null)

    const baseRadius = 0.5 * scale
    const neckRadius = 0.1 * scale
    const bodyHeight = 0.8 * scale
    const neckHeight = 0.5 * scale

    return (
        <group ref={groupRef} position={position}>
            {/* Base cônica do Erlenmeyer */}
            <mesh castShadow>
                <coneGeometry args={[baseRadius, bodyHeight, 32, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    roughness={0.02}
                    metalness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo plano */}
            <mesh position={[0, -bodyHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[baseRadius, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0.02}
                />
            </mesh>

            {/* Gargalo (pescoço) */}
            <mesh position={[0, bodyHeight / 2 + neckHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[neckRadius, neckRadius * 1.5, neckHeight, 16, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Líquido (cone preenchido) */}
            {liquidLevel > 0 && (
                <mesh position={[0, -bodyHeight / 2 + (bodyHeight * liquidLevel) / 2, 0]}>
                    <coneGeometry args={[baseRadius * liquidLevel * 0.9, bodyHeight * liquidLevel, 32]} />
                    <meshStandardMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.7}
                        roughness={0.1}
                    />
                </mesh>
            )}

            {/* Borda do gargalo */}
            <mesh position={[0, bodyHeight / 2 + neckHeight, 0]}>
                <torusGeometry args={[neckRadius, 0.01 * scale, 8, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </group>
    )
}
