// src/components/canvas/equipment/InteractiveTripod.tsx
// Tripé INTERATIVO - coloque béqueres para aquecer
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveTripodProps {
    id: string
    position: [number, number, number]
    scale?: number
    isHeating?: boolean
}

export default function InteractiveTripod({
    id,
    position,
    scale = 1,
    isHeating = false,
}: InteractiveTripodProps) {
    const groupRef = useRef<Group>(null)
    const gauzeRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [localHeating, setLocalHeating] = useState(isHeating)

    const { selectedId, selectObject, setLastReaction } = useLabStore()
    const isSelected = selectedId === id

    // Animação de calor
    useFrame((state) => {
        if (gauzeRef.current && localHeating) {
            const t = state.clock.elapsedTime
            const mat = gauzeRef.current.material as any
            const glow = Math.sin(t * 4) * 0.3 + 0.7
            mat.emissiveIntensity = glow
        }
    })

    const legHeight = 0.4 * scale
    const legSpread = 0.15 * scale

    const handleClick = (e: any) => {
        e.stopPropagation()
        selectObject(isSelected ? null : id)
    }

    const toggleHeat = (e: any) => {
        e.stopPropagation()
        setLocalHeating(!localHeating)
        setLastReaction(localHeating ? '🔥 Aquecimento desligado' : '🔥 Aquecendo tripé...')
    }

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={handleClick}
            onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer' }}
            onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'default' }}
        >
            {/* HITBOX INVISÍVEL - área grande para facilitar clique */}
            <mesh visible={false}>
                <cylinderGeometry args={[0.2 * scale, 0.2 * scale, 0.5 * scale, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Pernas do tripé */}
            {[0, 1, 2].map((i) => {
                const angle = (i * Math.PI * 2) / 3
                return (
                    <mesh
                        key={i}
                        position={[
                            Math.sin(angle) * legSpread,
                            legHeight / 2,
                            Math.cos(angle) * legSpread
                        ]}
                        rotation={[Math.cos(angle) * 0.2, 0, Math.sin(angle) * -0.2]}
                    >
                        <cylinderGeometry args={[0.008 * scale, 0.01 * scale, legHeight, 8]} />
                        <meshStandardMaterial
                            color={isHovered || isSelected ? "#666666" : "#444444"}
                            metalness={0.8}
                            roughness={0.3}
                        />
                    </mesh>
                )
            })}

            {/* Anel superior */}
            <mesh position={[0, legHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.1 * scale, 0.008 * scale, 8, 24]} />
                <meshStandardMaterial
                    color={isHovered || isSelected ? "#555555" : "#333333"}
                    metalness={0.9}
                    roughness={0.2}
                />
            </mesh>

            {/* Tela de amianto - CLICÁVEL para aquecer */}
            <mesh
                ref={gauzeRef}
                position={[0, legHeight + 0.005, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                onClick={toggleHeat}
            >
                <circleGeometry args={[0.09 * scale, 24]} />
                <meshStandardMaterial
                    color={localHeating ? "#ff6600" : "#c0c0c0"}
                    roughness={0.6}
                    emissive={localHeating ? "#ff4400" : "#000000"}
                    emissiveIntensity={localHeating ? 0.5 : 0}
                />
            </mesh>

            {/* Luz de aquecimento */}
            {localHeating && (
                <pointLight position={[0, legHeight, 0]} color="#ff6600" intensity={1} distance={0.5} />
            )}

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, legHeight + 0.2, 0]}>
                    <Text fontSize={0.035} color="#ffffff" anchorX="center">
                        TRIPÉ | {localHeating ? '🔥 Aquecendo' : '❄️ Frio'}
                    </Text>
                    <Text fontSize={0.025} color="#90EE90" anchorX="center" position={[0, -0.05, 0]}>
                        Clique na tela para {localHeating ? 'esfriar' : 'aquecer'}
                    </Text>
                </group>
            )}

            {/* Indicador visual de calor */}
            {localHeating && (
                <group position={[0, legHeight + 0.08, 0]}>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} position={[(i - 1.5) * 0.03, 0, 0]}>
                            <coneGeometry args={[0.01, 0.04, 6]} />
                            <meshStandardMaterial
                                color="#ff4400"
                                transparent
                                opacity={0.6}
                                emissive="#ff2200"
                                emissiveIntensity={1}
                            />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    )
}
