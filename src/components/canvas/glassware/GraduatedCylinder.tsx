// src/components/canvas/glassware/GraduatedCylinder.tsx
// Proveta graduada com marcações de volume
import { useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import * as THREE from 'three'

interface GraduatedCylinderProps {
    position: [number, number, number]
    liquidColor?: string
    liquidLevel?: number  // 0 a 1
    maxVolume?: number    // em mL (50, 100, 250, etc)
    scale?: number
    showLabels?: boolean
}

export default function GraduatedCylinder({
    position,
    liquidColor = '#4ecdc4',
    liquidLevel = 0.5,
    maxVolume = 100,
    scale = 1,
    showLabels = true
}: GraduatedCylinderProps) {
    const groupRef = useRef<Group>(null)

    const height = 0.8 * scale
    const radius = 0.06 * scale
    const baseRadius = 0.1 * scale
    const wallThickness = 0.003 * scale

    // Gerar marcações de volume
    const graduations = []
    const majorTicks = 5 // Número de divisões principais 
    for (let i = 0; i <= majorTicks; i++) {
        const y = (height * i) / majorTicks - height / 2
        const vol = Math.round((maxVolume * i) / majorTicks)
        graduations.push({ y, vol, major: true })

        // Marcações menores
        if (i < majorTicks) {
            for (let j = 1; j < 5; j++) {
                const minorY = y + (height / majorTicks) * (j / 5)
                graduations.push({ y: minorY, vol: 0, major: false })
            }
        }
    }

    return (
        <group ref={groupRef} position={position}>
            {/* Base alargada */}
            <mesh position={[0, -height / 2 - 0.015, 0]} castShadow>
                <cylinderGeometry args={[baseRadius, baseRadius * 1.1, 0.03 * scale, 24]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0.02}
                    transmission={0.9}
                />
            </mesh>

            {/* Tubo cilíndrico principal (vidro) */}
            <mesh castShadow>
                <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    metalness={0}
                    transmission={0.95}
                    thickness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo do tubo */}
            <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius - wallThickness, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0.02}
                    transmission={0.9}
                />
            </mesh>

            {/* Bico de derramamento */}
            <mesh position={[radius * 0.8, height / 2 + 0.015, 0]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.02 * scale, 0.04 * scale, 8, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    transmission={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Líquido */}
            {liquidLevel > 0 && (
                <>
                    <mesh position={[0, -height / 2 + (height * liquidLevel) / 2, 0]}>
                        <cylinderGeometry args={[
                            radius - wallThickness * 2,
                            radius - wallThickness * 2,
                            height * liquidLevel,
                            32
                        ]} />
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.7}
                            roughness={0.1}
                            transmission={0.3}
                        />
                    </mesh>

                    {/* Superfície do líquido (menisco) */}
                    <mesh
                        position={[0, -height / 2 + height * liquidLevel, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <circleGeometry args={[radius - wallThickness * 2, 32]} />
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.9}
                            roughness={0.05}
                        />
                    </mesh>
                </>
            )}

            {/* Marcações de graduação */}
            {graduations.map((grad, i) => (
                <group key={i}>
                    {/* Linha de marcação */}
                    <mesh
                        position={[radius + 0.001, grad.y, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        <boxGeometry args={[
                            0.001 * scale,
                            grad.major ? 0.015 * scale : 0.008 * scale,
                            0.001 * scale
                        ]} />
                        <meshBasicMaterial color="#1a1a1a" />
                    </mesh>

                    {/* Labels de volume (apenas nas marcações principais) */}
                    {showLabels && grad.major && grad.vol > 0 && (
                        <Text
                            position={[radius + 0.025, grad.y, 0]}
                            fontSize={0.018 * scale}
                            color="#333333"
                            anchorX="left"
                        >
                            {grad.vol}
                        </Text>
                    )}
                </group>
            ))}

            {/* Label "mL" no topo */}
            {showLabels && (
                <Text
                    position={[radius + 0.025, height / 2 - 0.03, 0]}
                    fontSize={0.015 * scale}
                    color="#555555"
                    anchorX="left"
                >
                    mL
                </Text>
            )}
        </group>
    )
}
