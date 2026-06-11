// src/components/canvas/glassware/SeparatingFunnel.tsx
// Funil de separação para misturas heterogêneas
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useLabStore } from '../../../stores/useLabStore'

interface SeparatingFunnelProps {
    id: string
    position: [number, number, number]
    components: { id: string, amount: number, color: string }[]
    scale?: number
}

export default function SeparatingFunnel({
    id,
    position,
    components,
    scale = 1,
}: SeparatingFunnelProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)

    const [isHovered, setIsHovered] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const { selectedId, pouringFromId, selectObject, pourInto, cancelPouring, setHoveredObject } = useLabStore()

    const isSelected = selectedId === id
    const isPouringSource = pouringFromId === id
    const isPouringTarget = pouringFromId !== null && pouringFromId !== id

    const bulbRadius = 0.12 * scale
    const neckHeight = 0.2 * scale
    const neckRadius = 0.025 * scale
    const stemLength = 0.15 * scale

    // Fake phases based on fill level for now
    // In a real scenario, we'd use useLabStore to compute immiscible phases
    const fillLevel = components.reduce((acc, comp) => acc + comp.amount, 0)
    const upperLevel = fillLevel > 0.5 ? (fillLevel - 0.5) : 0
    const lowerLevel = fillLevel > 0.5 ? 0.5 : fillLevel
    const upperLiquidColor = '#ffe066'
    const lowerLiquidColor = components.length > 0 ? components[0].color : '#4ecdc4'

    const handlePour = () => {
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

    useFrame((state) => {
        const t = state.clock.elapsedTime
        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered || isPouringTarget
            if (isSelected || isPouringTarget) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.03)
            }
        }
        
        // Simulação básica de drenagem se estiver aberto
        if (isOpen && fillLevel > 0) {
            // Logic for pouring
        }
    })

    const toggleValve = (e: any) => {
        e.stopPropagation()
        setIsOpen(!isOpen)
    }

    let outlineColor = '#4ecdc4'
    if (isPouringSource) outlineColor = '#ff6b6b'
    if (isPouringTarget) outlineColor = '#90EE90'

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX INTERATIVA */}
            <mesh
                visible={false}
                position={[0, 0, 0]}
                onClick={() => handlePour()}
                onPointerEnter={() => { setIsHovered(true); setHoveredObject(id); document.body.style.cursor = isPouringTarget ? 'copy' : 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); setHoveredObject(null); document.body.style.cursor = 'default' }}
            >
                <cylinderGeometry args={[bulbRadius * 1.5, bulbRadius * 1.5, 0.6 * scale, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, bulbRadius + neckHeight + 0.15, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Funil de Separação
                    </div>
                </Html>
            )}

            <mesh ref={outlineRef} visible={false}>
                <sphereGeometry args={[bulbRadius * 1.1, 16, 16]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Bulbo principal (forma de pera) */}
            <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[bulbRadius, 16, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={isHovered || isSelected ? 0.35 : 0.2} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>

            {/* Pescoço superior */}
            <mesh position={[0, bulbRadius + neckHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[neckRadius, neckRadius * 1.5, neckHeight, 16, 1, true]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.2} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>

            {/* Tampa/Rolha */}
            <mesh position={[0, bulbRadius + neckHeight + 0.02, 0]}>
                <cylinderGeometry args={[neckRadius * 1.2, neckRadius, 0.04 * scale, 16]} />
                <meshStandardMaterial color="#b8860b" roughness={0.8} />
            </mesh>

            {/* Cone inferior (transição para torneira) */}
            <mesh position={[0, -bulbRadius - 0.03, 0]}>
                <coneGeometry args={[bulbRadius * 0.3, 0.06 * scale, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>

            {/* Corpo da torneira */}
            <group position={[0, -bulbRadius - 0.08, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025 * scale, 0.025 * scale, 0.06 * scale, 16]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
                </mesh>

                <mesh position={[0.04 * scale, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.05 * scale, 8]} />
                    <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
                </mesh>

                {/* Alça interativa */}
                <mesh
                    position={[0.07 * scale, 0, 0]}
                    rotation={[0, 0, isOpen ? Math.PI / 4 : 0]}
                    onClick={toggleValve}
                    onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
                    onPointerLeave={() => { document.body.style.cursor = isHovered ? 'pointer' : 'default' }}
                >
                    <boxGeometry args={[0.03 * scale, 0.008 * scale, 0.02 * scale]} />
                    <meshStandardMaterial color={isOpen ? "#f44336" : "#4CAF50"} roughness={0.4} />
                </mesh>
            </group>

            {/* Stem de saída */}
            <mesh position={[0, -bulbRadius - 0.08 - stemLength / 2 - 0.03, 0]}>
                <cylinderGeometry args={[0.01 * scale, 0.008 * scale, stemLength, 12]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
            </mesh>

            {/* Líquido inferior (mais denso) */}
            {lowerLevel > 0 && (
                <mesh position={[0, -bulbRadius * lowerLevel, 0]}>
                    <sphereGeometry args={[
                        bulbRadius * 0.95 * Math.sqrt(lowerLevel),
                        24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2
                    ]} />
                    <meshStandardMaterial color={lowerLiquidColor} transparent opacity={0.7} roughness={0.1} />
                </mesh>
            )}

            {/* Interface entre líquidos */}
            {lowerLevel > 0 && upperLevel > 0 && (
                <mesh position={[0, bulbRadius * (lowerLevel - 0.5) * 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[bulbRadius * 0.9, 16]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.05} />
                </mesh>
            )}

            {/* Líquido superior (menos denso) */}
            {upperLevel > 0 && (
                <mesh position={[0, bulbRadius * (lowerLevel + upperLevel / 2), 0]}>
                    <sphereGeometry args={[
                        bulbRadius * 0.9 * Math.sqrt(upperLevel),
                        24, 24, 0, Math.PI * 2, 0, Math.PI / 2
                    ]} />
                    <meshStandardMaterial color={upperLiquidColor} transparent opacity={0.6} roughness={0.1} />
                </mesh>
            )}

            {/* Gotejamento */}
            {isOpen && fillLevel > 0 && (
                <mesh position={[0, -bulbRadius - 0.08 - stemLength - 0.05, 0]}>
                    <sphereGeometry args={[0.005 * scale, 8, 8]} />
                    <meshBasicMaterial color={lowerLiquidColor} />
                </mesh>
            )}

            {/* Suporte/anel */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[bulbRadius * 1.15, 0.008 * scale, 8, 24]} />
                <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.4} />
            </mesh>

            <mesh position={[bulbRadius * 1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                 <cylinderGeometry args={[0.008 * scale, 0.008 * scale, 0.2, 8]} />
                 <meshStandardMaterial color="#444444" metalness={0.8} />
            </mesh>
        </group>
    )
}
