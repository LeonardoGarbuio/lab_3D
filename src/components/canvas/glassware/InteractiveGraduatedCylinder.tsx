// src/components/canvas/glassware/InteractiveGraduatedCylinder.tsx
// Proveta graduada INTERATIVA - pode receber líquidos e medir volumes
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveGraduatedCylinderProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    temperature: number
    ph: number
    volume: number
    maxVolume?: number
    scale?: number
}

export default function InteractiveGraduatedCylinder({
    id,
    position,
    formula,
    fillLevel,
    color,
    temperature,
    ph,
    volume,
    maxVolume = 100,
    scale = 1,
}: InteractiveGraduatedCylinderProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)

    const { selectedId, pouringFromId, selectObject, pourInto } = useLabStore()

    const isSelected = selectedId === id
    const isPouringTarget = pouringFromId !== null && pouringFromId !== id

    // Animações
    useFrame((state) => {
        if (outlineRef.current) {
            const t = state.clock.elapsedTime
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered || isPouringTarget
            if (isSelected || isPouringTarget) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.03)
            }
        }
    })

    const height = 0.8 * scale
    const radius = 0.06 * scale
    const baseRadius = 0.1 * scale
    const wallThickness = 0.003 * scale

    // Graduações
    const graduations = []
    const majorTicks = 5
    for (let i = 0; i <= majorTicks; i++) {
        const y = (height * i) / majorTicks - height / 2
        const vol = Math.round((maxVolume * i) / majorTicks)
        graduations.push({ y, vol, major: true })
    }

    const handleClick = (e: any) => {
        e.stopPropagation()
        if (pouringFromId && pouringFromId !== id) {
            pourInto(id)
            return
        }
        selectObject(isSelected ? null : id)
    }

    let outlineColor = '#4ecdc4'
    if (isPouringTarget) outlineColor = '#90EE90'
    if (temperature > 50) outlineColor = '#ff6600'

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
                <cylinderGeometry args={[0.12 * scale, 0.12 * scale, height * 1.2, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Outline de seleção */}
            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[radius * 1.3, radius * 1.3, height * 1.05, 24]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Base alargada */}
            <mesh position={[0, -height / 2 - 0.015, 0]} castShadow>
                <cylinderGeometry args={[baseRadius, baseRadius * 1.1, 0.03 * scale, 24]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.3} metalness={0.1} />
            </mesh>

            {/* Tubo cilíndrico principal - MENOS TRANSPARENTE */}
            <mesh castShadow>
                <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.5 : 0.35}
                    roughness={0.02}
                    transmission={0.85}
                    thickness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo do tubo */}
            <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius - wallThickness, 32]} />
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <>
                    <mesh position={[0, -height / 2 + (height * fillLevel) / 2, 0]}>
                        <cylinderGeometry args={[
                            radius - wallThickness * 2,
                            radius - wallThickness * 2,
                            height * fillLevel,
                            32
                        ]} />
                        <meshPhysicalMaterial
                            color={color}
                            transparent
                            opacity={0.8}
                            roughness={0.1}
                        />
                    </mesh>

                    {/* Menisco */}
                    <mesh
                        position={[0, -height / 2 + height * fillLevel, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <circleGeometry args={[radius - wallThickness * 2, 32]} />
                        <meshPhysicalMaterial color={color} transparent opacity={0.95} />
                    </mesh>
                </>
            )}

            {/* Marcações de graduação */}
            {graduations.map((grad, i) => (
                <group key={i}>
                    <mesh position={[radius + 0.001, grad.y, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <boxGeometry args={[0.001 * scale, 0.015 * scale, 0.001 * scale]} />
                        <meshBasicMaterial color="#1a1a1a" />
                    </mesh>
                    {grad.major && grad.vol > 0 && (
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

            {/* Info de volume e pH quando selecionado */}
            {isSelected && (
                <group position={[0, height / 2 + 0.15, 0]}>
                    <Text fontSize={0.04} color="#ffffff" anchorX="center">
                        {formula || 'Vazio'} | {volume.toFixed(0)}mL | pH {ph.toFixed(1)}
                    </Text>
                </group>
            )}

            {/* Indicador de target para pouring */}
            {isPouringTarget && (
                <mesh position={[0, height / 2 + 0.05, 0]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshBasicMaterial color="#90EE90" />
                </mesh>
            )}
        </group>
    )
}
