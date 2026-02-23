// src/components/canvas/glassware/TestTube.tsx
// Tubo de ensaio 3D com suporte
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

interface TestTubeProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    liquidColor?: string
    liquidLevel?: number
    scale?: number
}

export default function TestTube({
    position,
    rotation = [0, 0, 0],
    liquidColor = '#ff6b6b',
    liquidLevel = 0.5,
    scale = 1
}: TestTubeProps) {
    const groupRef = useRef<Group>(null)

    const tubeHeight = 1.5 * scale
    const tubeRadius = 0.12 * scale
    const liquidHeight = tubeHeight * liquidLevel * 0.7

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            {/* Corpo do tubo (cilindro) */}
            <mesh castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight * 0.8, 16, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    roughness={0.02}
                    metalness={0}
                    transmission={0.95}
                    thickness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo arredondado do tubo */}
            <mesh position={[0, -tubeHeight * 0.4, 0]} castShadow>
                <sphereGeometry args={[tubeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.3}
                />
            </mesh>

            {/* Líquido */}
            {liquidLevel > 0 && (
                <mesh position={[0, -tubeHeight * 0.4 + liquidHeight / 2 + tubeRadius * 0.3, 0]}>
                    <cylinderGeometry args={[tubeRadius * 0.85, tubeRadius * 0.85, liquidHeight, 16]} />
                    <meshPhysicalMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.75}
                        roughness={0.1}
                        transmission={0.2}
                    />
                </mesh>
            )}

            {/* Borda superior do tubo */}
            <mesh position={[0, tubeHeight * 0.4, 0]}>
                <torusGeometry args={[tubeRadius, 0.015 * scale, 8, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.4}
                    roughness={0.02}
                />
            </mesh>
        </group>
    )
}
