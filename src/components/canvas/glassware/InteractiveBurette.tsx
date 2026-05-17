// src/components/canvas/glassware/InteractiveBurette.tsx
// Bureta FUNCIONAL para titulação — drena líquido para recipiente alvo
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveBuretteProps {
    id: string
    position: [number, number, number]
    targetId?: string // ID do recipiente que recebe o líquido
    maxVolume?: number
    scale?: number
}

export default function InteractiveBurette({
    id,
    position,
    targetId = 'erlenmeyer-1',
    maxVolume = 50,
    scale = 1,
}: InteractiveBuretteProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [dripPhase, setDripPhase] = useState(0)
    const lastDripRef = useRef(0)

    const {
        selectedId, selectObject, setLastReaction,
        buretteFillLevel, buretteIsOpen, buretteFormula, buretteColor, burettePh,
        setBuretteIsOpen, buretteDrip,
    } = useLabStore()

    const isSelected = selectedId === id
    const fillLevel = buretteFillLevel
    const color = buretteColor
    const formula = buretteFormula
    const ph = burettePh

    // Animação + drip funcional
    useFrame((state, delta) => {
        const t = state.clock.elapsedTime

        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered
            if (isSelected) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.02)
            }
        }

        // Quando aberta e com líquido: animar gotas + drenar via store
        if (buretteIsOpen && fillLevel > 0) {
            setDripPhase((t * 3) % 1)

            // Throttle: atualizar store ~10x/s
            if (t - lastDripRef.current > 0.1) {
                buretteDrip(targetId, 0.1)
                lastDripRef.current = t
            }
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
        setBuretteIsOpen(!buretteIsOpen)
        setLastReaction(buretteIsOpen ? '🔒 Torneira fechada' : '💧 Gotejando...')
    }

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX */}
            <mesh
                visible={false}
                onClick={handleClick}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'default' }}
            >
                <boxGeometry args={[0.15 * scale, tubeHeight * 1.2, 0.15 * scale]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, tubeHeight / 2 + 0.25, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Bureta
                    </div>
                </Html>
            )}

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[tubeRadius * 1.5, tubeRadius * 1.5, tubeHeight * 1.1, 16]} />
                <meshBasicMaterial color="#ff69b4" transparent opacity={0.4} wireframe />
            </mesh>

            {/* Tubo principal */}
            <mesh castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight, 24, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered || isSelected ? 0.45 : 0.3}
                    roughness={0.02}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Topo */}
            <mesh position={[0, tubeHeight / 2 + 0.02, 0]}>
                <sphereGeometry args={[tubeRadius * 1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>

            {/* Torneira — CLICÁVEL */}
            <group
                position={[0, -tubeHeight / 2 - 0.03, 0]}
                onClick={toggleStopcock}
            >
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02 * scale, 0.02 * scale, 0.05 * scale, 16]} />
                    <meshStandardMaterial color={buretteIsOpen ? "#4CAF50" : "#f44336"} roughness={0.4} />
                </mesh>
                <mesh position={[0.04 * scale, 0, 0]} rotation={[0, 0, buretteIsOpen ? Math.PI / 4 : 0]}>
                    <boxGeometry args={[0.03 * scale, 0.008 * scale, 0.02 * scale]} />
                    <meshStandardMaterial color={buretteIsOpen ? "#4CAF50" : "#f44336"} />
                </mesh>
            </group>

            {/* Ponta */}
            <mesh position={[0, -tubeHeight / 2 - 0.08, 0]}>
                <coneGeometry args={[tubeRadius * 0.6, 0.04 * scale, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <mesh position={[0, tubeHeight / 2 - (tubeHeight * fillLevel) / 2, 0]}>
                    <cylinderGeometry args={[tubeRadius * 0.9, tubeRadius * 0.9, tubeHeight * fillLevel, 24]} />
                    <meshStandardMaterial color={color} transparent opacity={0.8} />
                </mesh>
            )}

            {/* Gotas caindo quando aberta */}
            {buretteIsOpen && fillLevel > 0 && (
                <group position={[0, -tubeHeight / 2 - 0.12, 0]}>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[0, -(dripPhase + i * 0.33) % 1 * 0.15, 0]}>
                            <sphereGeometry args={[0.006 * scale, 8, 8]} />
                            <meshStandardMaterial color={color} transparent opacity={0.9} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Volume lido */}
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
                        Clique na torneira para {buretteIsOpen ? 'fechar' : 'abrir'}
                    </Text>
                </group>
            )}
        </group>
    )
}
