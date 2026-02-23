// src/components/canvas/glassware/SeparatingFunnel.tsx
// Funil de separação para misturas heterogêneas
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

interface SeparatingFunnelProps {
    position: [number, number, number]
    upperLiquidColor?: string   // Líquido menos denso (topo)
    lowerLiquidColor?: string   // Líquido mais denso (fundo)
    upperLevel?: number         // 0 a 0.5
    lowerLevel?: number         // 0 a 0.5
    scale?: number
    isOpen?: boolean            // Torneira aberta
}

export default function SeparatingFunnel({
    position,
    upperLiquidColor = '#ffe066',  // Óleo (amarelo)
    lowerLiquidColor = '#4ecdc4',   // Água (azul)
    upperLevel = 0.3,
    lowerLevel = 0.4,
    scale = 1,
    isOpen = false
}: SeparatingFunnelProps) {
    const groupRef = useRef<Group>(null)

    const bulbRadius = 0.12 * scale
    const neckHeight = 0.2 * scale
    const neckRadius = 0.025 * scale
    const stemLength = 0.15 * scale

    return (
        <group ref={groupRef} position={position}>
            {/* Bulbo principal (forma de pêra) */}
            <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[bulbRadius, 32, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Pescoço superior */}
            <mesh position={[0, bulbRadius + neckHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[neckRadius, neckRadius * 1.5, neckHeight, 16, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0.02}
                    transmission={0.95}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Tampa/Rolha */}
            <mesh position={[0, bulbRadius + neckHeight + 0.02, 0]}>
                <cylinderGeometry args={[neckRadius * 1.2, neckRadius, 0.04 * scale, 16]} />
                <meshStandardMaterial color="#b8860b" roughness={0.8} />
            </mesh>

            {/* Cone inferior (transição para torneira) */}
            <mesh position={[0, -bulbRadius - 0.03, 0]}>
                <coneGeometry args={[bulbRadius * 0.3, 0.06 * scale, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    transmission={0.95}
                />
            </mesh>

            {/* Corpo da torneira */}
            <group position={[0, -bulbRadius - 0.08, 0]}>
                {/* Vidro da torneira */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025 * scale, 0.025 * scale, 0.06 * scale, 16]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.25}
                        transmission={0.9}
                    />
                </mesh>

                {/* Torneira PTFE */}
                <mesh position={[0.04 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.05 * scale, 8]} />
                    <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
                </mesh>

                {/* Alça */}
                <mesh
                    position={[0.07 * scale, 0, 0]}
                    rotation={[0, 0, isOpen ? Math.PI / 4 : 0]}
                >
                    <boxGeometry args={[0.03 * scale, 0.008 * scale, 0.02 * scale]} />
                    <meshStandardMaterial color="#4CAF50" roughness={0.4} />
                </mesh>
            </group>

            {/* Stem de saída */}
            <mesh position={[0, -bulbRadius - 0.08 - stemLength / 2 - 0.03, 0]}>
                <cylinderGeometry args={[0.01 * scale, 0.008 * scale, stemLength, 12]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.25}
                    transmission={0.9}
                />
            </mesh>

            {/* Líquido inferior (mais denso) */}
            {lowerLevel > 0 && (
                <mesh position={[0, -bulbRadius * lowerLevel, 0]}>
                    <sphereGeometry args={[
                        bulbRadius * 0.95 * Math.sqrt(lowerLevel),
                        24, 24,
                        0, Math.PI * 2,
                        Math.PI / 2, Math.PI / 2
                    ]} />
                    <meshPhysicalMaterial
                        color={lowerLiquidColor}
                        transparent
                        opacity={0.7}
                        roughness={0.1}
                        transmission={0.25}
                    />
                </mesh>
            )}

            {/* Interface entre líquidos */}
            {lowerLevel > 0 && upperLevel > 0 && (
                <mesh
                    position={[0, bulbRadius * (lowerLevel - 0.5) * 2, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <circleGeometry args={[bulbRadius * 0.9, 32]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.3}
                        roughness={0.05}
                    />
                </mesh>
            )}

            {/* Líquido superior (menos denso) */}
            {upperLevel > 0 && (
                <mesh position={[0, bulbRadius * (lowerLevel + upperLevel / 2), 0]}>
                    <sphereGeometry args={[
                        bulbRadius * 0.9 * Math.sqrt(upperLevel),
                        24, 24,
                        0, Math.PI * 2,
                        0, Math.PI / 2
                    ]} />
                    <meshPhysicalMaterial
                        color={upperLiquidColor}
                        transparent
                        opacity={0.6}
                        roughness={0.1}
                        transmission={0.3}
                    />
                </mesh>
            )}

            {/* Suporte/anel */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[bulbRadius * 1.15, 0.008 * scale, 8, 24]} />
                <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    )
}
