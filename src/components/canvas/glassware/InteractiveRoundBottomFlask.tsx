// src/components/canvas/glassware/InteractiveRoundBottomFlask.tsx
// Balão de Fundo Redondo INTERATIVO — suporta pouring e aquecimento
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveRoundBottomFlaskProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    ph: number
    isHeating?: boolean
    temperature?: number
    scale?: number
}

export default function InteractiveRoundBottomFlask({
    id,
    position,
    formula,
    fillLevel,
    color,
    ph,
    isHeating = false,
    temperature = 25,
    scale = 1,
}: InteractiveRoundBottomFlaskProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)

    const { selectedId, pouringFromId, selectObject, startPouring, pourInto, cancelPouring } = useLabStore()
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

    const sphereRadius = 0.25 * scale
    const neckRadius = 0.04 * scale
    const neckHeight = 0.25 * scale

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
    if (isHeating) outlineColor = '#ff6600'

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX */}
            <mesh
                visible={false}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = isPouringTarget ? 'copy' : 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'default' }}
            >
                <sphereGeometry args={[sphereRadius * 1.5, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, neckHeight + sphereRadius + 0.1, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Balao de Fundo Redondo
                    </div>
                </Html>
            )}

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <sphereGeometry args={[sphereRadius * 1.15, 24, 24]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Corpo esférico */}
            <mesh castShadow>
                <sphereGeometry args={[sphereRadius, 32, 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.35 : 0.22}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Pescoço */}
            <mesh position={[0, sphereRadius + neckHeight / 2 - 0.02, 0]} castShadow>
                <cylinderGeometry args={[neckRadius, neckRadius * 1.8, neckHeight, 16, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.35 : 0.22}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Borda do pescoço */}
            <mesh position={[0, sphereRadius + neckHeight - 0.02, 0]}>
                <torusGeometry args={[neckRadius, 0.008 * scale, 8, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <mesh position={[0, -sphereRadius * (1 - fillLevel) * 0.5, 0]}>
                    <sphereGeometry args={[
                        sphereRadius * 0.9 * Math.sqrt(fillLevel),
                        24, 24,
                        0, Math.PI * 2,
                        Math.PI * (1 - fillLevel) * 0.5,
                        Math.PI * fillLevel
                    ]} />
                    <meshStandardMaterial color={color} transparent opacity={0.7} roughness={0.1} />
                </mesh>
            )}

            {/* Brilho de aquecimento */}
            {isHeating && (
                <pointLight position={[0, -sphereRadius * 0.8, 0]} color="#ff6600" intensity={2} distance={0.8} />
            )}

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, sphereRadius + neckHeight + 0.1, 0]}>
                    <Text fontSize={0.03} color="#ffffff" anchorX="center">
                        BALAO | {formula || 'Vazio'} | pH {ph.toFixed(1)} | {temperature.toFixed(0)}°C
                    </Text>
                </group>
            )}

            {/* Indicador de pouring */}
            {isPouringSource && (
                <group position={[0, sphereRadius + neckHeight + 0.05, 0]}>
                    <mesh><sphereGeometry args={[0.04, 16, 16]} /><meshBasicMaterial color="#ff6b6b" /></mesh>
                </group>
            )}
        </group>
    )
}
