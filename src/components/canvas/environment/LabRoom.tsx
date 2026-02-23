// src/components/canvas/environment/LabRoom.tsx
// Sala do laboratório com paredes, piso e iluminação
import { useRef } from 'react'
import type { Group } from 'three'
import { useLabStore } from '../../../stores/useLabStore'
import { ExplosionEffect } from '../../effects/ExplosionEffect'
import { CorrosionMark } from '../../effects/CorrosionMark'

interface LabRoomProps {
    children?: React.ReactNode
}

export default function LabRoom({ children }: LabRoomProps) {
    const groupRef = useRef<Group>(null)
    const explosions = useLabStore(s => s.explosions)
    const corrosionMarks = useLabStore(s => s.corrosionMarks)
    const clearExplosion = useLabStore(s => s.clearExplosion)

    const roomWidth = 12
    const roomDepth = 10
    const roomHeight = 4
    const tileSize = 1

    return (
        <group ref={groupRef}>
            {/* PISO - Azulejos de laboratório */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial
                    color="#e8e8e8"
                    roughness={0.4}
                    metalness={0.1}
                />
            </mesh>

            {/* Linhas do piso (simulando azulejos) */}
            {Array.from({ length: Math.floor(roomWidth / tileSize) + 1 }).map((_, i) => (
                <mesh
                    key={`v-${i}`}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[-roomWidth / 2 + i * tileSize, 0.001, 0]}
                >
                    <planeGeometry args={[0.02, roomDepth]} />
                    <meshBasicMaterial color="#cccccc" />
                </mesh>
            ))}
            {Array.from({ length: Math.floor(roomDepth / tileSize) + 1 }).map((_, i) => (
                <mesh
                    key={`h-${i}`}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0.001, -roomDepth / 2 + i * tileSize]}
                >
                    <planeGeometry args={[roomWidth, 0.02]} />
                    <meshBasicMaterial color="#cccccc" />
                </mesh>
            ))}

            {/* PAREDE TRASEIRA */}
            <mesh position={[0, roomHeight / 2, -roomDepth / 2]} receiveShadow>
                <planeGeometry args={[roomWidth, roomHeight]} />
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </mesh>

            {/* PAREDE ESQUERDA */}
            <mesh
                position={[-roomWidth / 2, roomHeight / 2, 0]}
                rotation={[0, Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[roomDepth, roomHeight]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>

            {/* PAREDE DIREITA */}
            <mesh
                position={[roomWidth / 2, roomHeight / 2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[roomDepth, roomHeight]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>

            {/* Rodapé */}
            {[
                { pos: [0, 0.05, -roomDepth / 2 + 0.02] as [number, number, number], size: [roomWidth, 0.1, 0.04] as [number, number, number] },
                { pos: [-roomWidth / 2 + 0.02, 0.05, 0] as [number, number, number], size: [0.04, 0.1, roomDepth] as [number, number, number] },
                { pos: [roomWidth / 2 - 0.02, 0.05, 0] as [number, number, number], size: [0.04, 0.1, roomDepth] as [number, number, number] },
            ].map((wall, i) => (
                <mesh key={i} position={wall.pos}>
                    <boxGeometry args={wall.size} />
                    <meshStandardMaterial color="#404040" />
                </mesh>
            ))}

            {/* Janela na parede traseira */}
            <group position={[0, roomHeight * 0.6, -roomDepth / 2 + 0.01]}>
                {/* Moldura */}
                <mesh>
                    <boxGeometry args={[3, 2, 0.05]} />
                    <meshStandardMaterial color="#555555" />
                </mesh>
                {/* Vidro */}
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[2.8, 1.8]} />
                    <meshPhysicalMaterial
                        color="#87CEEB"
                        transparent
                        opacity={0.3}
                        roughness={0.05}
                        transmission={0.7}
                    />
                </mesh>
            </group>

            {/* Luz de teto (visual) */}
            <mesh position={[0, roomHeight - 0.05, 0]}>
                <boxGeometry args={[2, 0.05, 0.5]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>

            {/* ⚠️ EFEITOS DE PERIGO */}
            {/* Explosões */}
            {explosions.map(explosion => (
                <ExplosionEffect
                    key={explosion.id}
                    position={explosion.position}
                    power={explosion.power}
                    color={explosion.color}
                    onComplete={() => clearExplosion(explosion.id)}
                />
            ))}

            {/* Marcas de Corrosão no chão */}
            {corrosionMarks.map(mark => (
                <CorrosionMark
                    key={mark.id}
                    position={mark.position}
                    strength={mark.strength}
                    color={mark.color}
                />
            ))}

            {/* Renderizar children (bancadas, equipamentos) */}
            {children}
        </group>
    )
}
