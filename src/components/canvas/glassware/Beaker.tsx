// src/components/canvas/glassware/Beaker.tsx
// Béquer 3D com líquido interno (sem física por enquanto)
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

interface BeakerProps {
    position: [number, number, number]
    liquidColor?: string
    liquidLevel?: number // 0 a 1
    scale?: number
}

export default function Beaker({
    position,
    liquidColor = '#4a90d9',
    liquidLevel = 0.6,
    scale = 1
}: BeakerProps) {
    const groupRef = useRef<Group>(null)

    const glassHeight = 1.2 * scale
    const glassRadius = 0.4 * scale
    const wallThickness = 0.03 * scale
    const liquidHeight = glassHeight * liquidLevel * 0.85

    return (
        <group ref={groupRef} position={position}>
            {/* Parede externa do béquer (vidro) */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[glassRadius, glassRadius * 0.95, glassHeight, 32, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0.05}
                    metalness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo do béquer */}
            <mesh position={[0, -glassHeight / 2 + wallThickness / 2, 0]} receiveShadow>
                <cylinderGeometry args={[glassRadius * 0.95, glassRadius * 0.95, wallThickness, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.4}
                    roughness={0.05}
                />
            </mesh>

            {/* Líquido */}
            {liquidLevel > 0 && (
                <mesh position={[0, -glassHeight / 2 + liquidHeight / 2 + wallThickness, 0]}>
                    <cylinderGeometry args={[glassRadius * 0.9, glassRadius * 0.85, liquidHeight, 32]} />
                    <meshStandardMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.7}
                        roughness={0.1}
                    />
                </mesh>
            )}

            {/* Marcações de medida (linhas brancas) */}
            {[0.25, 0.5, 0.75].map((mark, i) => (
                <mesh
                    key={i}
                    position={[glassRadius * 0.96, -glassHeight / 2 + glassHeight * mark, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                >
                    <boxGeometry args={[0.01, 0.15 * scale, 0.01]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
            ))}

            {/* Borda superior engrossada */}
            <mesh position={[0, glassHeight / 2 - 0.02, 0]}>
                <torusGeometry args={[glassRadius, 0.02 * scale, 8, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.5}
                    roughness={0.05}
                />
            </mesh>
        </group>
    )
}
