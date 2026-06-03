// src/components/canvas/glassware/InteractiveBeaker.tsx
// Béquer interativo com TODAS as animações
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useLabStore } from '../../../stores/useLabStore'
import { Bubbles, Smoke, Precipitate, Glow } from '../effects/ParticleSystem'

interface InteractiveBeakerProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    isBroken: boolean
    isHeating: boolean
    isShaking: boolean
    temperature: number
    activeEffect: string
    effectColor: string
    effectIntensity: number
    scale?: number
}

export default function InteractiveBeaker({
    id,
    position,
    // formula,
    fillLevel,
    color,
    isBroken,
    isHeating,
    isShaking,
    temperature,
    activeEffect,
    effectColor,
    effectIntensity,
    scale = 1,
}: InteractiveBeakerProps) {
    const groupRef = useRef<Group>(null)
    const outlineRef = useRef<Mesh>(null)
    const liquidRef = useRef<Mesh>(null)

    const [isHovered, setIsHovered] = useState(false)

    const { selectedId, pouringFromId, selectObject, startPouring, pourInto, cancelPouring, setHoveredObject } = useLabStore()

    const isSelected = selectedId === id
    const isPouringSource = pouringFromId === id
    const isPouringTarget = pouringFromId !== null && pouringFromId !== id

    // Animações
    useFrame((state) => {
        const t = state.clock.elapsedTime

        // Outline pulsante
        if (outlineRef.current) {
            const pulse = Math.sin(t * 4) * 0.5 + 0.5
            outlineRef.current.visible = isSelected || isHovered || isPouringTarget
            if (isSelected || isPouringTarget) {
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.03)
            }
        }

        // Grupo - animação de rotação para pouring
        if (groupRef.current) {
            if (isPouringSource) {
                groupRef.current.rotation.z = Math.sin(t * 3) * 0.1
            } else if (isShaking) {
                // Animação de agitação
                groupRef.current.rotation.z = Math.sin(t * 20) * 0.05
                groupRef.current.position.x = position[0] + Math.sin(t * 25) * 0.02
            } else {
                groupRef.current.rotation.z *= 0.9
                groupRef.current.position.x = position[0]
            }
        }

        // Líquido fervendo - superfície ondulante
        if (liquidRef.current && temperature >= 80) {
            const scale = 1 + Math.sin(t * 10) * 0.02 * (temperature / 100)
            liquidRef.current.scale.x = scale
            liquidRef.current.scale.z = scale
        }
    })

    const glassHeight = 1.2 * scale
    const glassRadius = 0.4 * scale
    const wallThickness = 0.03 * scale
    const liquidHeight = glassHeight * fillLevel * 0.85

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

    // Se quebrado
    if (isBroken) {
        return (
            <group position={position}>
                {[...Array(10)].map((_, i) => (
                    <mesh key={i} position={[(Math.random() - 0.5) * 0.6, Math.random() * 0.05, (Math.random() - 0.5) * 0.6]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
                        <boxGeometry args={[0.05 + Math.random() * 0.08, 0.01, 0.04 + Math.random() * 0.06]} />
                        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.5} roughness={0.1} />
                    </mesh>
                ))}
                {color !== '#4ecdc4' && (
                    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.4, 24]} />
                        <meshPhysicalMaterial color={color} transparent opacity={0.6} />
                    </mesh>
                )}
            </group>
        )
    }

    // Cor do outline baseada no estado
    let outlineColor = '#4ecdc4'
    if (isPouringSource) outlineColor = '#ff6b6b'
    if (isPouringTarget) outlineColor = '#90EE90'
    if (isHeating) outlineColor = '#ff6600'

    // Cor do líquido muda com temperatura
    let liquidColor = color
    if (temperature >= 80) {
        // Adiciona vermelho quando quente
        const heatRatio = (temperature - 80) / 20
        liquidColor = mixColor(color, '#ff6644', heatRatio * 0.3)
    }

    return (
        <group
            ref={groupRef}
            position={position}
        >
            {/* HITBOX INVISÍVEL OTIMIZADA PARA RAYCAST */}
            <mesh 
                visible={false}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onPointerEnter={() => { setIsHovered(true); setHoveredObject(id); document.body.style.cursor = isPouringTarget ? 'copy' : 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); setHoveredObject(null); document.body.style.cursor = 'default' }}
            >
                <cylinderGeometry args={[glassRadius * 1.5, glassRadius * 1.5, glassHeight * 1.5, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, glassHeight / 2 + 0.2, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Bequer
                    </div>
                </Html>
            )}

            {/* EFEITOS */}
            {activeEffect === 'bubbles' && <Bubbles position={[0, 0, 0]} color={effectColor} intensity={effectIntensity} active />}
            {activeEffect === 'boiling' && <Bubbles position={[0, 0, 0]} color="#ffffff" intensity={1.5} count={50} active />}
            {activeEffect === 'smoke' && <Smoke position={[0, 0.5, 0]} color={effectColor} active />}
            {activeEffect === 'precipitate' && <Precipitate position={[0, 0, 0]} color={effectColor} active />}
            {activeEffect === 'glow' && <Glow position={[0, 0.3, 0]} color={effectColor} intensity={effectIntensity * 2} active />}

            {/* Brilho de aquecimento */}
            {isHeating && (
                <pointLight position={[0, -glassHeight * 0.3, 0]} color="#ff6600" intensity={2} distance={1} />
            )}

            {/* Outline */}
            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[glassRadius * 1.15, glassRadius * 1.1, glassHeight * 1.05, 32]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            {/* Parede do béquer */}
            <mesh>
                <cylinderGeometry args={[glassRadius, glassRadius * 0.95, glassHeight, 16, 1, true]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={isHovered || isSelected ? 0.35 : 0.22} roughness={0.05} side={THREE.DoubleSide} />
            </mesh>

            {/* Fundo */}
            <mesh position={[0, -glassHeight / 2 + wallThickness / 2, 0]}>
                <cylinderGeometry args={[glassRadius * 0.95, glassRadius * 0.95, wallThickness, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>

            {/* Líquido */}
            {fillLevel > 0 && (
                <mesh ref={liquidRef} position={[0, -glassHeight / 2 + liquidHeight / 2 + wallThickness, 0]}>
                    <cylinderGeometry args={[glassRadius * 0.9, glassRadius * 0.85, liquidHeight, 16]} />
                    <meshStandardMaterial color={liquidColor} transparent opacity={0.75} />
                </mesh>
            )}

            {/* Borda */}
            <mesh position={[0, glassHeight / 2 - 0.02, 0]}>
                <torusGeometry args={[glassRadius, 0.02 * scale, 6, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>

            {/* Indicador de pouring */}
            {isPouringSource && (
                <group position={[0, glassHeight / 2 + 0.2, 0]}>
                    <mesh><sphereGeometry args={[0.06, 16, 16]} /><meshBasicMaterial color="#ff6b6b" /></mesh>
                    <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.04, 0.08, 8]} /><meshBasicMaterial color="#ff6b6b" /></mesh>
                </group>
            )}
        </group>
    )
}

// Helper para misturar cores
function mixColor(c1: string, c2: string, ratio: number): string {
    const parse = (c: string) => parseInt(c.slice(1), 16)
    const p1 = parse(c1), p2 = parse(c2)
    const r = Math.round(((p1 >> 16) & 255) * (1 - ratio) + ((p2 >> 16) & 255) * ratio)
    const g = Math.round(((p1 >> 8) & 255) * (1 - ratio) + ((p2 >> 8) & 255) * ratio)
    const b = Math.round((p1 & 255) * (1 - ratio) + (p2 & 255) * ratio)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
