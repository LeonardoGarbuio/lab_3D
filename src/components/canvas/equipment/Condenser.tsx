// src/components/canvas/equipment/Condenser.tsx
// Condensador de Liebig para destilação
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'

interface CondenserProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    scale?: number
    isActive?: boolean
    hasVapor?: boolean
    vaporColor?: string
}

export default function Condenser({
    position,
    rotation = [-0.3, 0, 0],
    scale = 1,
    isActive = true,
    hasVapor = false,
    vaporColor = '#e8e8e8'
}: CondenserProps) {
    const groupRef = useRef<Group>(null)
    const waterRef = useRef<Mesh>(null)

    const outerLength = 0.5 * scale
    const outerRadius = 0.04 * scale
    const innerRadius = 0.015 * scale

    useFrame((state) => {
        if (waterRef.current && isActive) {
            const mat = waterRef.current.material as THREE.MeshPhysicalMaterial
            mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        }
    })

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            <mesh castShadow>
                <cylinderGeometry args={[outerRadius, outerRadius, outerLength, 24, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.15}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {[-1, 1].map((dir) => (
                <mesh
                    key={dir}
                    position={[0, dir * outerLength / 2, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <ringGeometry args={[innerRadius * 1.5, outerRadius, 24]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.25}
                        transmission={0.9}
                    />
                </mesh>
            ))}

            <mesh>
                <cylinderGeometry args={[innerRadius, innerRadius, outerLength + 0.1 * scale, 16, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.15}
                    roughness={0.02}
                    transmission={0.95}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <group position={[outerRadius, -outerLength / 2 + 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.04 * scale, 12]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} transmission={0.9} />
                </mesh>
                <mesh position={[0, 0.025, 0]}>
                    <cylinderGeometry args={[0.008 * scale, 0.012 * scale, 0.015 * scale, 8]} />
                    <meshStandardMaterial color="#333333" roughness={0.8} />
                </mesh>
            </group>

            <group position={[outerRadius, outerLength / 2 - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.04 * scale, 12]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} transmission={0.9} />
                </mesh>
                <mesh position={[0, 0.025, 0]}>
                    <cylinderGeometry args={[0.008 * scale, 0.012 * scale, 0.015 * scale, 8]} />
                    <meshStandardMaterial color="#333333" roughness={0.8} />
                </mesh>
            </group>

            {isActive && (
                <mesh ref={waterRef}>
                    <cylinderGeometry args={[outerRadius * 0.9, outerRadius * 0.9, outerLength * 0.9, 24]} />
                    <meshPhysicalMaterial color="#4da6ff" transparent opacity={0.4} roughness={0.1} transmission={0.5} />
                </mesh>
            )}

            {hasVapor && (
                <group position={[0, outerLength / 2 + 0.03, 0]}>
                    {[0, 0.015, 0.03].map((y, i) => (
                        <mesh key={i} position={[0, y, 0]}>
                            <sphereGeometry args={[0.008 * scale * (1 - i * 0.2), 8, 8]} />
                            <meshStandardMaterial color={vaporColor} transparent opacity={0.4 - i * 0.1} />
                        </mesh>
                    ))}
                </group>
            )}

            <mesh position={[0, outerLength / 2 + 0.04, 0]}>
                <coneGeometry args={[innerRadius * 1.5, 0.05 * scale, 12]} />
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} transmission={0.9} />
            </mesh>

            <mesh position={[0, -outerLength / 2 - 0.04, 0]}>
                <coneGeometry args={[innerRadius, 0.05 * scale, 12]} />
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} transmission={0.9} />
            </mesh>

            {isActive && (
                <pointLight position={[0, 0, outerRadius + 0.02]} color="#4da6ff" intensity={0.3} distance={0.5} />
            )}
        </group>
    )
}
