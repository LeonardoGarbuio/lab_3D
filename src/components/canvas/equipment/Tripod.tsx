// src/components/canvas/equipment/Tripod.tsx
// Tripé de laboratório com tela de amianto para aquecimento
import { useRef } from 'react'
import type { Group } from 'three'

interface TripodProps {
    position: [number, number, number]
    scale?: number
    hasWireGauze?: boolean  // Tela de amianto
    isHeating?: boolean     // Efeito visual de calor
}

export default function Tripod({
    position,
    scale = 1,
    hasWireGauze = true,
    isHeating = false
}: TripodProps) {
    const groupRef = useRef<Group>(null)

    const legLength = 0.35 * scale
    const legRadius = 0.008 * scale
    const ringRadius = 0.12 * scale
    const ringTube = 0.008 * scale

    // Ângulos para as 3 pernas
    const legAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]

    return (
        <group ref={groupRef} position={position}>
            {/* Anel superior do tripé */}
            <mesh position={[0, legLength * 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[ringRadius, ringTube, 8, 32]} />
                <meshStandardMaterial
                    color="#2a2a2a"
                    roughness={0.6}
                    metalness={0.8}
                />
            </mesh>

            {/* 3 Pernas do tripé */}
            {legAngles.map((angle, i) => {
                const x = Math.sin(angle) * ringRadius
                const z = Math.cos(angle) * ringRadius

                return (
                    <mesh
                        key={i}
                        position={[x * 0.5, legLength * 0.4, z * 0.5]}
                        rotation={[
                            Math.cos(angle) * -0.35,
                            0,
                            Math.sin(angle) * 0.35
                        ]}
                        castShadow
                    >
                        <cylinderGeometry args={[legRadius, legRadius * 1.2, legLength, 8]} />
                        <meshStandardMaterial
                            color="#333333"
                            roughness={0.5}
                            metalness={0.9}
                        />
                    </mesh>
                )
            })}

            {/* Pés estabilizadores */}
            {legAngles.map((angle, i) => {
                const x = Math.sin(angle) * ringRadius * 1.1
                const z = Math.cos(angle) * ringRadius * 1.1

                return (
                    <mesh key={`foot-${i}`} position={[x, 0.01, z]}>
                        <sphereGeometry args={[0.015 * scale, 8, 8]} />
                        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
                    </mesh>
                )
            })}

            {/* Tela de amianto (wire gauze) */}
            {hasWireGauze && (
                <group position={[0, legLength * 0.88, 0]}>
                    {/* Base cerâmica */}
                    <mesh>
                        <cylinderGeometry args={[ringRadius * 0.95, ringRadius * 0.95, 0.005 * scale, 32]} />
                        <meshStandardMaterial
                            color={isHeating ? "#3a2a20" : "#d4c8b8"}
                            roughness={0.9}
                            emissive={isHeating ? "#ff4400" : "#000000"}
                            emissiveIntensity={isHeating ? 0.3 : 0}
                        />
                    </mesh>

                    {/* Grade metálica por cima */}
                    <mesh position={[0, 0.004 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[ringRadius * 1.8, ringRadius * 1.8]} />
                        <meshStandardMaterial
                            color="#555555"
                            roughness={0.7}
                            metalness={0.6}
                            wireframe
                            transparent
                            opacity={0.9}
                        />
                    </mesh>

                    {/* Brilho de calor quando aquecendo */}
                    {isHeating && (
                        <pointLight
                            position={[0, 0.05, 0]}
                            color="#ff6600"
                            intensity={0.5}
                            distance={1}
                            decay={2}
                        />
                    )}
                </group>
            )}
        </group>
    )
}
