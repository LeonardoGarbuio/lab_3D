// src/components/canvas/glassware/Burette.tsx
// Bureta para titulação com torneira
import { useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import * as THREE from 'three'

interface BuretteProps {
    position: [number, number, number]
    liquidColor?: string
    liquidLevel?: number    // 0 a 1
    maxVolume?: number      // em mL (25 ou 50)
    scale?: number
    isOpen?: boolean        // Torneira aberta/fechada
    isDripping?: boolean    // Mostra gotas caindo
}

export default function Burette({
    position,
    liquidColor = '#ff69b4',
    liquidLevel = 0.8,
    maxVolume = 50,
    scale = 1,
    isOpen = false,
    isDripping = false
}: BuretteProps) {
    const groupRef = useRef<Group>(null)

    const tubeHeight = 1.0 * scale
    const tubeRadius = 0.025 * scale
    const wallThickness = 0.002 * scale

    // Gerar graduações (invertida - 0 no topo, 50 embaixo)
    const graduations = []
    const majorTicks = 5
    for (let i = 0; i <= majorTicks; i++) {
        const y = tubeHeight / 2 - (tubeHeight * i) / majorTicks
        const vol = Math.round((maxVolume * i) / majorTicks)
        graduations.push({ y, vol, major: true })

        if (i < majorTicks) {
            for (let j = 1; j < 10; j++) {
                const minorY = y - (tubeHeight / majorTicks) * (j / 10)
                graduations.push({ y: minorY, vol: 0, major: j === 5 })
            }
        }
    }

    return (
        <group ref={groupRef} position={position}>
            {/* Tubo principal da bureta */}
            <mesh castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight, 24, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Topo fechado com reservatório */}
            <mesh position={[0, tubeHeight / 2 + 0.02, 0]}>
                <sphereGeometry args={[tubeRadius * 1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    transmission={0.95}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Corpo da torneira (stopcock) */}
            <group position={[0, -tubeHeight / 2 - 0.03, 0]}>
                {/* Corpo de vidro */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02 * scale, 0.02 * scale, 0.05 * scale, 16]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.25}
                        transmission={0.9}
                    />
                </mesh>

                {/* Torneira PTFE (branca) */}
                <mesh position={[0.03 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.008 * scale, 0.008 * scale, 0.04 * scale, 8]} />
                    <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
                </mesh>

                {/* Alça da torneira */}
                <mesh
                    position={[0.055 * scale, 0, 0]}
                    rotation={[0, 0, isOpen ? Math.PI / 4 : 0]}
                >
                    <boxGeometry args={[0.025 * scale, 0.006 * scale, 0.015 * scale]} />
                    <meshStandardMaterial color="#2196F3" roughness={0.4} />
                </mesh>
            </group>

            {/* Ponta de saída */}
            <mesh position={[0, -tubeHeight / 2 - 0.08, 0]}>
                <coneGeometry args={[tubeRadius * 0.6, 0.04 * scale, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    transmission={0.9}
                />
            </mesh>

            {/* Líquido dentro da bureta */}
            {liquidLevel > 0 && (
                <mesh position={[0, tubeHeight / 2 - (tubeHeight * liquidLevel) / 2, 0]}>
                    <cylinderGeometry args={[
                        tubeRadius - wallThickness,
                        tubeRadius - wallThickness,
                        tubeHeight * liquidLevel,
                        24
                    ]} />
                    <meshPhysicalMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.7}
                        roughness={0.1}
                        transmission={0.3}
                    />
                </mesh>
            )}

            {/* Gotas caindo (quando aberta) */}
            {isDripping && isOpen && (
                <group position={[0, -tubeHeight / 2 - 0.12, 0]}>
                    {[0, -0.03, -0.06].map((y, i) => (
                        <mesh key={i} position={[0, y, 0]}>
                            <sphereGeometry args={[0.004 * scale, 8, 8]} />
                            <meshPhysicalMaterial
                                color={liquidColor}
                                transparent
                                opacity={0.9}
                                roughness={0.1}
                            />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Marcações de graduação */}
            {graduations.map((grad, i) => (
                <group key={i}>
                    <mesh
                        position={[tubeRadius + 0.001, grad.y, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        <boxGeometry args={[
                            0.0008 * scale,
                            grad.major ? 0.01 * scale : 0.005 * scale,
                            0.0008 * scale
                        ]} />
                        <meshBasicMaterial color="#0066cc" />
                    </mesh>

                    {grad.major && grad.vol >= 0 && (
                        <Text
                            position={[tubeRadius + 0.018, grad.y, 0]}
                            fontSize={0.012 * scale}
                            color="#0066cc"
                            anchorX="left"
                        >
                            {grad.vol}
                        </Text>
                    )}
                </group>
            ))}
        </group>
    )
}
