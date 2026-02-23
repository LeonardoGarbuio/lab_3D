// src/components/canvas/equipment/InteractiveFumeHood.tsx
// Capela de Exaustão INTERATIVA - trabalhe com substâncias perigosas
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface InteractiveFumeHoodProps {
    id: string
    position: [number, number, number]
    scale?: number
    isOn?: boolean
    sashHeight?: number
}

export default function InteractiveFumeHood({
    id,
    position,
    scale = 1,
    isOn = true,
    sashHeight = 0.5,
}: InteractiveFumeHoodProps) {
    const groupRef = useRef<Group>(null)
    const fanRef = useRef<Mesh>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [localOn, setLocalOn] = useState(isOn)
    const [localSash, setLocalSash] = useState(sashHeight)

    const { selectedId, selectObject, setLastReaction } = useLabStore()
    const isSelected = selectedId === id

    useFrame(() => {
        if (fanRef.current && localOn) {
            fanRef.current.rotation.z += 0.3
        }
    })

    const width = 0.8 * scale
    const height = 0.7 * scale
    const depth = 0.5 * scale
    const wallThickness = 0.015 * scale

    const handleClick = (e: any) => {
        e.stopPropagation()
        selectObject(isSelected ? null : id)
    }

    const togglePower = (e: any) => {
        e.stopPropagation()
        setLocalOn(!localOn)
        setLastReaction(localOn ? '⏹️ Exaustor desligado' : '🌀 Exaustor ligado')
    }

    const adjustSash = (e: any) => {
        e.stopPropagation()
        setLocalSash(localSash > 0.3 ? 0.2 : 0.8)
        setLastReaction(localSash > 0.3 ? '⬇️ Guilhotina fechada' : '⬆️ Guilhotina aberta')
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
                <boxGeometry args={[width * 1.2, height * 1.3, depth * 1.2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Base/bancada */}
            <mesh position={[0, -height / 2 - 0.1, 0]} castShadow>
                <boxGeometry args={[width + 0.1, 0.2 * scale, depth + 0.1]} />
                <meshStandardMaterial
                    color={isHovered || isSelected ? "#3a3a3a" : "#2a2a2a"}
                    roughness={0.8}
                />
            </mesh>

            {/* Paredes laterais */}
            {[-1, 1].map((side) => (
                <mesh key={side} position={[side * (width / 2 + wallThickness / 2), 0, 0]} castShadow>
                    <boxGeometry args={[wallThickness, height, depth]} />
                    <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
                </mesh>
            ))}

            {/* Parede traseira */}
            <mesh position={[0, 0, -depth / 2]} castShadow>
                <boxGeometry args={[width, height, wallThickness]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.7} />
            </mesh>

            {/* Teto */}
            <mesh position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[width + wallThickness * 2, wallThickness * 2, depth]} />
                <meshStandardMaterial color="#d0d0d0" roughness={0.5} />
            </mesh>

            {/* Piso da capela */}
            <mesh position={[0, -height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.2} />
            </mesh>

            {/* Guilhotina de vidro - CLICÁVEL */}
            <mesh
                position={[0, -height / 2 + height * localSash / 2, depth / 2 - 0.01]}
                onClick={adjustSash}
            >
                <boxGeometry args={[width - 0.02, height * localSash, 0.008 * scale]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={isHovered ? 0.3 : 0.2}
                    roughness={0.02}
                    transmission={0.9}
                />
            </mesh>

            {/* Frame da guilhotina */}
            <mesh position={[0, -height / 2 + height * localSash, depth / 2]}>
                <boxGeometry args={[width, 0.02 * scale, 0.02 * scale]} />
                <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Exaustor no topo */}
            <group position={[0, height / 2 + 0.08, -depth / 4]}>
                <mesh onClick={togglePower}>
                    <boxGeometry args={[0.2 * scale, 0.15 * scale, 0.2 * scale]} />
                    <meshStandardMaterial color={localOn ? "#2a5a2a" : "#5a2a2a"} roughness={0.7} />
                </mesh>

                {/* Pás do ventilador */}
                <group ref={fanRef} position={[0, -0.05, 0]}>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh
                            key={i}
                            rotation={[Math.PI / 2, 0, (i * Math.PI) / 2]}
                            position={[
                                Math.cos((i * Math.PI) / 2) * 0.04 * scale,
                                0,
                                Math.sin((i * Math.PI) / 2) * 0.04 * scale
                            ]}
                        >
                            <boxGeometry args={[0.06 * scale, 0.01 * scale, 0.015 * scale]} />
                            <meshStandardMaterial color={localOn ? "#666666" : "#888888"} metalness={0.5} />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Luz interna */}
            {localOn && (
                <rectAreaLight
                    intensity={2}
                    width={width * 0.6}
                    height={0.05}
                    position={[0, height / 2 - 0.1, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            )}

            {/* LED indicador - CLICÁVEL */}
            <mesh position={[-width / 2 - 0.04, 0, depth / 2 - 0.05]} onClick={togglePower}>
                <circleGeometry args={[0.012 * scale, 12]} />
                <meshStandardMaterial
                    color={localOn ? "#00ff00" : "#333333"}
                    emissive={localOn ? "#00ff00" : "#000000"}
                    emissiveIntensity={localOn ? 2 : 0}
                />
            </mesh>

            {/* Info quando selecionado */}
            {isSelected && (
                <group position={[0, height / 2 + 0.25, 0]}>
                    <Text fontSize={0.04} color="#ffffff" anchorX="center">
                        CAPELA | {localOn ? '🌀 Ativo' : '⏹️ Desligado'}
                    </Text>
                    <Text fontSize={0.025} color="#90EE90" anchorX="center" position={[0, -0.06, 0]}>
                        Clique no exaustor para {localOn ? 'desligar' : 'ligar'}
                    </Text>
                    <Text fontSize={0.025} color="#87CEEB" anchorX="center" position={[0, -0.1, 0]}>
                        Clique na guilhotina para {localSash > 0.3 ? 'fechar' : 'abrir'}
                    </Text>
                </group>
            )}
        </group>
    )
}
