// src/components/canvas/glassware/InteractiveBurette.tsx
// Bureta INTERATIVA para titulação - goteja líquido
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveBuretteProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    ph: number
    maxVolume?: number
    scale?: number
    isOpen?: boolean
}

export default function InteractiveBurette({
    id,
    position,
    formula,
    fillLevel,
    color,
    ph,
    maxVolume = 50,
    scale = 1,
    isOpen = false,
}: InteractiveBuretteProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [localOpen, setLocalOpen] = useState(isOpen)
    const [dripPhase, setDripPhase] = useState(0)

    const { selectedId, selectObject, setLastReaction } = useLabStore()
    const isSelected = selectedId === id

    // Animação de gotejamento
    useFrame((state) => {
        const t = state.clock.elapsedTime

        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered
            if (isSelected) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.02)
            }
        }

        // Animação de gotas
        if (localOpen && fillLevel > 0) {
            setDripPhase((t * 3) % 1)
        }
    })

    const tubeHeight = 1.0 * scale
    const tubeRadius = 0.025 * scale

    const handleClick = (e: any) => {
        e.stopPropagation()
        selectObject(isSelected ? null : id)
    }

    const toggleStopcock = (e: any) => {
        e.stopPropagation()
        setLocalOpen(!localOpen)
        setLastReaction(localOpen ? '🔒 Torneira fechada' : '💧 Gotejando...')
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
                <boxGeometry args={[0.15 * scale, tubeHeight * 1.2, 0.15 * scale]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[tubeRadius * 1.5, tubeRadius * 1.5, tubeHeight * 1.1, 16]} />
                <meshBasicMaterial color="#ff69b4" transparent opacity={0.4} wireframe />
            </mesh>

            {/* Tubo principal - MENOS TRANSPARENTE */}
            <mesh castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight, 24, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.45 : 0.3}
                    roughness={0.02}
                    transmission={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Topo */}
            <mesh position={[0, tubeHeight / 2 + 0.02, 0]}>
                <sphereGeometry args={[tubeRadius * 1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>

            {/* Torneira - CLICÁVEL */}
            <group
                position={[0, -tubeHeight / 2 - 0.03, 0]}
                onClick={toggleStopcock}
            >
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02 * scale, 0.02 * scale, 0.05 * scale, 16]} />
                    <meshStandardMaterial color={localOpen ? "#4CAF50" : "#f44336"} roughness={0.4} />
                </mesh>
                <mesh position={[0.04 * scale, 0, 0]} rotation={[0, 0, localOpen ? Math.PI / 4 : 0]}>
                    <boxGeometry args={[0.03 * scale, 0.008 * scale, 0.02 * scale]} />
                    <meshStandardMaterial color={localOpen ? "#4CAF50" : "#f44336"} />
                </mesh>
            </group>

            {/* Ponta */}
            <mesh position={[0, -tubeHeight / 2 - 0.08, 0]}>
                <coneGeometry args={[tubeRadius * 0.6, 0.04 * scale, 16]} />
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.35} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <mesh position={[0, tubeHeight / 2 - (tubeHeight * fillLevel) / 2, 0]}>
                    <cylinderGeometry args={[tubeRadius * 0.9, tubeRadius * 0.9, tubeHeight * fillLevel, 24]} />
                    <meshPhysicalMaterial color={color} transparent opacity={0.8} />
                </mesh>
            )}

            {/* Gotas caindo quando aberta */}
            {localOpen && fillLevel > 0 && (
                <group position={[0, -tubeHeight / 2 - 0.12, 0]}>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[0, -(dripPhase + i * 0.33) % 1 * 0.15, 0]}>
                            <sphereGeometry args={[0.006 * scale, 8, 8]} />
                            <meshPhysicalMaterial color={color} transparent opacity={0.9} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Volume lido (invertido - 0 no topo) */}
            <Text
                position={[tubeRadius + 0.04, 0, 0]}
                fontSize={0.02 * scale}
                color="#0066cc"
                anchorX="left"
            >
                {((1 - fillLevel) * maxVolume).toFixed(1)} mL
            </Text>

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, tubeHeight / 2 + 0.2, 0]}>
                    <Text fontSize={0.035} color="#ffffff" anchorX="center">
                        BURETA | {formula || 'Vazio'} | pH {ph.toFixed(1)}
                    </Text>
                    <Text fontSize={0.025} color="#90EE90" anchorX="center" position={[0, -0.05, 0]}>
                        Clique na torneira para {localOpen ? 'fechar' : 'abrir'}
                    </Text>
                </group>
            )}
        </group>
    )
}
