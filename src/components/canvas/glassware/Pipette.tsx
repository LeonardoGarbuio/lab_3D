// src/components/canvas/glassware/Pipette.tsx
// Pipeta volumétrica para transferência precisa
import { useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import * as THREE from 'three'

interface PipetteProps {
    position: [number, number, number]
    liquidColor?: string
    liquidLevel?: number    // 0 a 1
    volume?: number         // mL (1, 5, 10, 25)
    scale?: number
    isDispensing?: boolean  // Mostra líquido saindo
}

export default function Pipette({
    position,
    liquidColor = '#4ecdc4',
    liquidLevel = 0.7,
    volume = 10,
    scale = 1,
    isDispensing = false
}: PipetteProps) {
    const groupRef = useRef<Group>(null)

    const totalHeight = 0.6 * scale
    const bulbRadius = 0.018 * scale
    const tubeRadius = 0.006 * scale
    const tipRadius = 0.003 * scale

    return (
        <group ref={groupRef} position={position} raycast={null as any}>
            {/* Tubo superior (sucção) */}
            <mesh position={[0, totalHeight / 2 - 0.08, 0]} castShadow>
                <cylinderGeometry args={[tubeRadius * 1.2, tubeRadius, 0.16 * scale, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Bulbo central (expansão de volume) */}
            <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[bulbRadius, 24, 24]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                />
            </mesh>

            {/* Tubo principal graduado */}
            <mesh position={[0, -0.08, 0]} castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, 0.25 * scale, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Ponta afilada */}
            <mesh position={[0, -totalHeight / 2 + 0.06, 0]}>
                <coneGeometry args={[tubeRadius, 0.08 * scale, 12]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    roughness={0.02}
                />
            </mesh>

            {/* Líquido dentro da pipeta */}
            {liquidLevel > 0 && (
                <>
                    {/* Líquido no bulbo */}
                    <mesh position={[0, 0.08, 0]}>
                        <sphereGeometry args={[bulbRadius * 0.9 * Math.sqrt(liquidLevel), 16, 16]} />
                        <meshStandardMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.7}
                            roughness={0.1}
                        />
                    </mesh>

                    {/* Líquido no tubo */}
                    <mesh position={[0, -0.08, 0]}>
                        <cylinderGeometry args={[
                            tubeRadius * 0.8,
                            tubeRadius * 0.8,
                            0.24 * scale * liquidLevel,
                            12
                        ]} />
                        <meshStandardMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.7}
                            roughness={0.1}
                        />
                    </mesh>
                </>
            )}

            {/* Gota caindo */}
            {isDispensing && (
                <mesh position={[0, -totalHeight / 2 - 0.01, 0]}>
                    <sphereGeometry args={[tipRadius * 1.5, 8, 8]} />
                    <meshStandardMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.9}
                        roughness={0.1}
                    />
                </mesh>
            )}

            {/* Marca de aferição (linha) */}
            <mesh position={[tubeRadius + 0.001, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.001 * scale, 0.01 * scale, 0.001 * scale]} />
                <meshBasicMaterial color="#0066cc" />
            </mesh>

            {/* Label do volume */}
            <Text
                position={[tubeRadius + 0.015, 0.03, 0]}
                fontSize={0.012 * scale}
                color="#0066cc"
                anchorX="left"
            >
                {volume} mL
            </Text>

            {/* Indicador de precisão */}
            <Text
                position={[tubeRadius + 0.015, 0.01, 0]}
                fontSize={0.008 * scale}
                color="#666666"
                anchorX="left"
            >
                ±0.02
            </Text>
        </group>
    )
}
