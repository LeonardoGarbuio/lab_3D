// src/components/canvas/glassware/InteractiveErlenmeyer.tsx
// Erlenmeyer INTERATIVO — recebe líquido da bureta, suporta pouring
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveErlenmeyerProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    ph: number
    scale?: number
}

export default function InteractiveErlenmeyer({
    id,
    position,
    formula,
    fillLevel,
    color,
    ph,
    scale = 1,
}: InteractiveErlenmeyerProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)

    const { selectedId, pouringFromId, selectObject, startPouring, pourInto, cancelPouring, setHoveredObject } = useLabStore()
    const isSelected = selectedId === id
    const isPouringSource = pouringFromId === id
    const isPouringTarget = pouringFromId !== null && pouringFromId !== id

    useFrame((state) => {
        const t = state.clock.elapsedTime

        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered || isPouringTarget
            if (isSelected || isPouringTarget) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.02)
            }
        }
    })

    const baseRadius = 0.5 * scale
    const neckRadius = 0.1 * scale
    const bodyHeight = 0.8 * scale
    const neckHeight = 0.5 * scale

    const handleClick = (e: any) => {
        e.stopPropagation()
        if (pouringFromId && pouringFromId !== id) {
            pourInto(id)
            return
        }
        if (isPouringSource) {
            cancelPouring()
            return
        }
        selectObject(isSelected ? null : id)
    }

    const handleDoubleClick = (e: any) => {
        e.stopPropagation()
        if (fillLevel > 0 && !pouringFromId) {
            startPouring(id)
            selectObject(id)
        }
    }

    let outlineColor = '#4ecdc4'
    if (isPouringSource) outlineColor = '#ff6b6b'
    if (isPouringTarget) outlineColor = '#90EE90'

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX */}
            <mesh
                visible={false}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onPointerEnter={() => { setIsHovered(true); setHoveredObject(id); document.body.style.cursor = isPouringTarget ? 'copy' : 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); setHoveredObject(null); document.body.style.cursor = 'default' }}
            >
                <cylinderGeometry args={[baseRadius * 1.2, baseRadius * 1.2, (bodyHeight + neckHeight) * 1.1, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, bodyHeight / 2 + neckHeight + 0.15, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Erlenmeyer
                    </div>
                </Html>
            )}

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <coneGeometry args={[baseRadius * 1.1, bodyHeight * 1.1, 32]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Base cônica */}
            <mesh castShadow>
                <coneGeometry args={[baseRadius, bodyHeight, 32, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.4 : 0.25}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo plano */}
            <mesh position={[0, -bodyHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[baseRadius, 32]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.02} />
            </mesh>

            {/* Gargalo */}
            <mesh position={[0, bodyHeight / 2 + neckHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[neckRadius, neckRadius * 1.5, neckHeight, 16, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.4 : 0.25}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <mesh position={[0, -bodyHeight / 2 + (bodyHeight * fillLevel) / 2, 0]}>
                    <coneGeometry args={[baseRadius * fillLevel * 0.9, bodyHeight * fillLevel, 32]} />
                    <meshStandardMaterial color={color} transparent opacity={0.7} roughness={0.1} />
                </mesh>
            )}

            {/* Borda do gargalo */}
            <mesh position={[0, bodyHeight / 2 + neckHeight, 0]}>
                <torusGeometry args={[neckRadius, 0.01 * scale, 8, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, bodyHeight / 2 + neckHeight + 0.15, 0]}>
                    <Text fontSize={0.035} color="#ffffff" anchorX="center">
                        ERLENMEYER | {formula || 'Vazio'} | pH {ph.toFixed(1)}
                    </Text>
                </group>
            )}

            {/* Indicador de pouring */}
            {isPouringSource && (
                <group position={[0, bodyHeight / 2 + neckHeight + 0.1, 0]}>
                    <mesh><sphereGeometry args={[0.04, 16, 16]} /><meshBasicMaterial color="#ff6b6b" /></mesh>
                    <mesh position={[0, 0.06, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.03, 0.05, 8]} /><meshBasicMaterial color="#ff6b6b" /></mesh>
                </group>
            )}
        </group>
    )
}
