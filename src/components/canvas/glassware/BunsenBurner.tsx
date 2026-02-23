// src/components/canvas/equipment/BunsenBurner.tsx
// Bico de Bunsen com chama colorida realista

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'
import { ALL_SUBSTANCES } from '../../../systems/ChemistryEngine'

interface BunsenBurnerProps {
    position: [number, number, number]
    isLit?: boolean
    onToggle?: () => void
}

export function BunsenBurner({ position, isLit = false, onToggle }: BunsenBurnerProps) {
    const [lit, setLit] = useState(isLit)
    const [flameColor, setFlameColor] = useState('#ff6600')
    const flameRef = useRef<THREE.Mesh>(null)
    const timeRef = useRef(0)

    const selectedId = useLabStore(s => s.selectedId)
    const objects = useLabStore(s => s.objects)

    // Detectar substância próxima para teste de chama
    const nearbyObject = objects.find(obj => {
        if (!obj.formula || obj.isBroken) return false
        const dx = obj.position[0] - position[0]
        const dz = obj.position[2] - position[2]
        const distance = Math.sqrt(dx * dx + dz * dz)
        return distance < 0.5 // Menos de 0.5m de distância
    })

    // Atualizar cor da chama baseado na substância
    useFrame((_, delta) => {
        timeRef.current += delta

        if (flameRef.current && lit) {
            // Animação de tremeluzir da chama
            const flicker = Math.sin(timeRef.current * 20) * 0.1 + 0.9
            flameRef.current.scale.y = flicker
            flameRef.current.scale.x = 1 - (flicker - 0.9) * 0.5
            flameRef.current.scale.z = 1 - (flicker - 0.9) * 0.5

            // Se tem substância próxima com flameColor, usar essa cor
            if (nearbyObject?.formula) {
                const substance = ALL_SUBSTANCES[nearbyObject.formula]
                if (substance?.flameColor) {
                    setFlameColor(substance.flameColor)
                } else {
                    setFlameColor('#ff6600') // Laranja padrão
                }
            } else {
                setFlameColor('#ff6600')
            }
        }
    })

    const handleClick = () => {
        setLit(!lit)
        onToggle?.()
    }

    return (
        <group position={position}>
            {/* Base do bico de Bunsen */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
                <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Tubo */}
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
                <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Cabeça/Bocal */}
            <mesh position={[0, 0.27, 0]}>
                <cylinderGeometry args={[0.06, 0.03, 0.04, 16]} />
                <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Regulador de ar (anel giratório) */}
            <mesh position={[0, 0.12, 0]} rotation={[0, timeRef.current * 0.5, 0]}>
                <torusGeometry args={[0.04, 0.008, 8, 16]} />
                <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Chama (quando acesa) */}
            {lit && (
                <group position={[0, 0.3, 0]}>
                    {/* Chama principal */}
                    <mesh ref={flameRef}>
                        <coneGeometry args={[0.05, 0.15, 8]} />
                        <meshStandardMaterial
                            color={flameColor}
                            emissive={flameColor}
                            emissiveIntensity={2}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>

                    {/* Núcleo azul da chama */}
                    <mesh position={[0, -0.03, 0]}>
                        <coneGeometry args={[0.02, 0.06, 8]} />
                        <meshStandardMaterial
                            color="#4169e1"
                            emissive="#4169e1"
                            emissiveIntensity={1.5}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>

                    {/* Luz pontual da chama */}
                    <pointLight
                        color={flameColor}
                        intensity={2}
                        distance={1.5}
                        decay={2}
                    />
                </group>
            )}

            {/* Botão de ligar/desligar (invisível, só para clique) */}
            <mesh position={[0, 0.1, 0]} onClick={handleClick}>
                <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Label quando substância próxima */}
            {lit && nearbyObject?.formula && ALL_SUBSTANCES[nearbyObject.formula]?.flameColor && (
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[0.3, 0.1]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
            )}
        </group>
    )
}
