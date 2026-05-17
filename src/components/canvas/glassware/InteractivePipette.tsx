// src/components/canvas/glassware/InteractivePipette.tsx
// Pipeta INTERATIVA — sugar líquido de um recipiente e dispensar em outro
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractivePipetteProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    ph: number
    volume?: number
    scale?: number
}

export default function InteractivePipette({
    id,
    position,
    formula,
    fillLevel,
    color,
    ph,
    volume = 10,
    scale = 1,
}: InteractivePipetteProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isDispensing, setIsDispensing] = useState(false)

    const { selectedId, pouringFromId, selectObject, startPouring, pourInto, cancelPouring, setLastReaction } = useLabStore()
    const isSelected = selectedId === id
    const isPouringSource = pouringFromId === id
    const isPouringTarget = pouringFromId !== null && pouringFromId !== id

    useFrame((state) => {
        const t = state.clock.elapsedTime

        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered
            if (isSelected) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.02)
            }
        }
    })

    const totalHeight = 0.6 * scale
    const bulbRadius = 0.018 * scale
    const tubeRadius = 0.006 * scale
    const tipRadius = 0.003 * scale

    const handleClick = (e: any) => {
        e.stopPropagation()

        // Se um pouring está ativo, ser alvo
        if (pouringFromId && pouringFromId !== id) {
            pourInto(id)
            return
        }
        if (isPouringSource) {
            cancelPouring()
            return
        }

        // Se vazia e selecionada, entrar em modo "sugar" (= espera pouring reverso)
        if (isSelected && fillLevel <= 0) {
            setLastReaction('🫗 Pipeta vazia — clique em um béquer para sugar líquido')
        }

        // Se cheia e selecionada, iniciar dispensar
        if (isSelected && fillLevel > 0) {
            startPouring(id)
            setIsDispensing(true)
            setTimeout(() => setIsDispensing(false), 2000)
            return
        }

        selectObject(isSelected ? null : id)
    }

    const handleDoubleClick = (e: any) => {
        e.stopPropagation()
        if (fillLevel > 0 && !pouringFromId) {
            startPouring(id)
            selectObject(id)
            setIsDispensing(true)
            setTimeout(() => setIsDispensing(false), 2000)
        }
    }

    let outlineColor = '#87CEEB'
    if (isPouringSource) outlineColor = '#ff6b6b'
    if (isPouringTarget) outlineColor = '#90EE90'

    const liquidColor = color || '#4ecdc4'

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX */}
            <mesh
                visible={false}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'default' }}
            >
                <boxGeometry args={[0.08 * scale, totalHeight * 1.3, 0.08 * scale]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, totalHeight / 2 + 0.12, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Pipeta Volumetrica
                    </div>
                </Html>
            )}

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[bulbRadius * 2, bulbRadius * 2, totalHeight * 1.1, 12]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Tubo superior */}
            <mesh position={[0, totalHeight / 2 - 0.08, 0]} castShadow>
                <cylinderGeometry args={[tubeRadius * 1.2, tubeRadius, 0.16 * scale, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.35 : 0.2}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Bulbo central */}
            <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[bulbRadius, 24, 24]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.35 : 0.2}
                    roughness={0.02}
                />
            </mesh>

            {/* Tubo principal */}
            <mesh position={[0, -0.08, 0]} castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, 0.25 * scale, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.35 : 0.2}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Ponta */}
            <mesh position={[0, -totalHeight / 2 + 0.06, 0]}>
                <coneGeometry args={[tubeRadius, 0.08 * scale, 12]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <>
                    <mesh position={[0, 0.08, 0]}>
                        <sphereGeometry args={[bulbRadius * 0.9 * Math.sqrt(fillLevel), 16, 16]} />
                        <meshStandardMaterial color={liquidColor} transparent opacity={0.7} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, -0.08, 0]}>
                        <cylinderGeometry args={[tubeRadius * 0.8, tubeRadius * 0.8, 0.24 * scale * fillLevel, 12]} />
                        <meshStandardMaterial color={liquidColor} transparent opacity={0.7} roughness={0.1} />
                    </mesh>
                </>
            )}

            {/* Gota dispensando */}
            {isDispensing && fillLevel > 0 && (
                <mesh position={[0, -totalHeight / 2 - 0.01, 0]}>
                    <sphereGeometry args={[tipRadius * 1.5, 8, 8]} />
                    <meshStandardMaterial color={liquidColor} transparent opacity={0.9} roughness={0.1} />
                </mesh>
            )}

            {/* Marca de aferição */}
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

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, totalHeight / 2 + 0.12, 0]}>
                    <Text fontSize={0.025} color="#ffffff" anchorX="center">
                        PIPETA | {formula || 'Vazia'} | pH {ph.toFixed(1)}
                    </Text>
                    <Text fontSize={0.018} color="#90EE90" anchorX="center" position={[0, -0.035, 0]}>
                        {fillLevel > 0 ? 'Duplo-clique para dispensar' : 'Receba líquido de um béquer'}
                    </Text>
                </group>
            )}
        </group>
    )
}
