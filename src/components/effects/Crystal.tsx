// src/components/effects/Crystal.tsx
// Componente 3D de cristal com diferentes formas geométricas

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CrystalType } from '../../systems/CrystallizationSystem'

interface CrystalProps {
    type: CrystalType
    position: [number, number, number]
    scale: number
    rotation: [number, number, number]
    growthProgress: number
    isGrowing: boolean
}

export function Crystal({
    type,
    position,
    scale,
    rotation,
    growthProgress,
    isGrowing
}: CrystalProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const glowRef = useRef<THREE.Mesh>(null)

    // Animação de crescimento
    useFrame((_, delta) => {
        if (!meshRef.current) return

        if (isGrowing) {
            // Leve pulsação durante crescimento
            const pulse = Math.sin(Date.now() * 0.005) * 0.02 + 1
            meshRef.current.scale.setScalar(scale * growthProgress * pulse)
        } else {
            meshRef.current.scale.setScalar(scale * growthProgress)
        }

        // Rotação lenta
        meshRef.current.rotation.y += delta * 0.1

        // Glow pulsando
        if (glowRef.current) {
            const glowIntensity = isGrowing ? 0.5 + Math.sin(Date.now() * 0.01) * 0.3 : 0.3
                ; (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity * type.transparency
        }
    })

    // Renderizar geometria baseada no tipo
    const renderGeometry = () => {
        switch (type.shape) {
            case 'cubic':
                return <boxGeometry args={[1, 1, 1]} />

            case 'hexagonal':
                return <cylinderGeometry args={[0.5, 0.5, 1, 6]} />

            case 'orthorhombic':
                return <boxGeometry args={[0.8, 1.2, 0.6]} />

            case 'monoclinic':
                // Prisma inclinado - aproximamos com box rotacionado
                return <boxGeometry args={[0.7, 1, 0.5]} />

            case 'tetragonal':
                return <boxGeometry args={[0.6, 1.2, 0.6]} />

            case 'triclinic':
                // Forma irregular - usamos icosaedro
                return <icosahedronGeometry args={[0.5, 0]} />

            default:
                return <octahedronGeometry args={[0.5]} />
        }
    }

    return (
        <group position={position} rotation={rotation}>
            {/* Cristal principal */}
            <mesh ref={meshRef} castShadow>
                {renderGeometry()}
                <meshPhysicalMaterial
                    color={type.color}
                    transparent
                    opacity={0.8}
                    roughness={0.1}
                    metalness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    transmission={type.transparency}
                    ior={1.5}
                />
            </mesh>

            {/* Glow effect */}
            <mesh ref={glowRef} scale={1.1}>
                {renderGeometry()}
                <meshBasicMaterial
                    color={type.color}
                    transparent
                    opacity={0.3}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Luz pontual para brilho */}
            {isGrowing && (
                <pointLight
                    color={type.color}
                    intensity={0.5}
                    distance={0.5}
                    decay={2}
                />
            )}
        </group>
    )
}
