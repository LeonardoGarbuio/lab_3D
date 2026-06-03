// src/components/canvas/glassware/InteractiveTestTube.tsx
// Tubo de ensaio interativo
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveTestTubeProps {
    id: string
    position: [number, number, number]
    formula: string | null
    fillLevel: number
    color: string
    ph: number
    scale?: number
}

export default function InteractiveTestTube({
    id,
    position,
    fillLevel,
    color,
    scale = 1,
}: InteractiveTestTubeProps) {
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
                outlineRef.current.scale.setScalar(1.05 + pulse * 0.03)
            }
        }
        if (groupRef.current) {
            if (isPouringSource) {
                groupRef.current.position.y = position[1] + 0.5
                groupRef.current.rotation.z = Math.sin(t * 3) * 0.1
            } else {
                groupRef.current.rotation.z *= 0.9
                groupRef.current.position.y = position[1]
            }
        }
    })

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

    const tubeHeight = 1.5 * scale
    const tubeRadius = 0.15 * scale
    const liquidHeight = tubeHeight * fillLevel * 0.7

    let outlineColor = '#4ecdc4'
    if (isPouringSource) outlineColor = '#ff6b6b'
    if (isPouringTarget) outlineColor = '#90EE90'

    return (
        <group ref={groupRef} position={position}>
            <mesh 
                visible={false}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onPointerEnter={() => { setIsHovered(true); setHoveredObject(id); document.body.style.cursor = isPouringTarget ? 'copy' : 'pointer' }}
                onPointerLeave={() => { setIsHovered(false); setHoveredObject(null); document.body.style.cursor = 'default' }}
            >
                <cylinderGeometry args={[tubeRadius * 1.5, tubeRadius * 1.5, tubeHeight * 1.2, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isHovered && !isSelected && (
                <Html position={[0, tubeHeight / 2 + 0.1, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)', border: '1px solid #00f7ff',
                        padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '10px',
                        whiteSpace: 'nowrap'
                    }}>
                        Tubo de Ensaio
                    </div>
                </Html>
            )}

            <mesh ref={outlineRef} visible={false}>
                <cylinderGeometry args={[tubeRadius * 1.2, tubeRadius * 1.2, tubeHeight * 1.1, 16]} />
                <meshBasicMaterial color={outlineColor} transparent opacity={0.4} wireframe />
            </mesh>

            <mesh castShadow>
                <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight * 0.8, 16, 1, true]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={isHovered || isSelected ? 0.35 : 0.25} roughness={0.02} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[0, -tubeHeight * 0.4, 0]} castShadow>
                <sphereGeometry args={[tubeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} />
            </mesh>

            {fillLevel > 0 && (
                <mesh position={[0, -tubeHeight * 0.4 + liquidHeight / 2 + tubeRadius * 0.3, 0]}>
                    <cylinderGeometry args={[tubeRadius * 0.85, tubeRadius * 0.85, liquidHeight, 16]} />
                    <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.1} />
                </mesh>
            )}

            <mesh position={[0, tubeHeight * 0.4, 0]}>
                <torusGeometry args={[tubeRadius, 0.015 * scale, 8, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
            </mesh>
        </group>
    )
}
