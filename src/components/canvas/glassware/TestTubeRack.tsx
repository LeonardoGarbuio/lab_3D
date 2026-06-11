// src/components/canvas/glassware/TestTubeRack.tsx
// Suporte para tubos de ensaio
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { Html } from '@react-three/drei'

interface TestTubeRackProps {
    position: [number, number, number]
    tubes?: Array<{
        color: string
        level: number
    }>
}

export default function TestTubeRack({
    position
}: TestTubeRackProps) {
    const groupRef = useRef<Group>(null)
    const [hovered, setHovered] = useState(false)

    const rackWidth = 1.8
    const rackDepth = 0.4
    const rackHeight = 0.15

    return (
        <group ref={groupRef} position={position}>
            {/* HITBOX INTERATIVA */}
            <mesh
                visible={false}
                position={[0, rackHeight + 0.3, 0]}
                onClick={(e) => e.stopPropagation()}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
            >
                <boxGeometry args={[rackWidth + 0.1, 1.2, rackDepth + 0.1]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {hovered && (
                <Html position={[0, rackHeight + 1.2, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Tubos de Ensaio
                    </div>
                </Html>
            )}

            {/* Base do suporte */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[rackWidth, rackHeight, rackDepth]} />
                <meshStandardMaterial color="#4a3728" roughness={0.8} />
            </mesh>

            {/* Barra traseira */}
            <mesh position={[0, rackHeight * 1.5, -rackDepth / 2 + 0.03]} castShadow>
                <boxGeometry args={[rackWidth, rackHeight * 2, 0.05]} />
                <meshStandardMaterial color="#5d4a3a" roughness={0.8} />
            </mesh>

            {/* Barra frontal */}
            <mesh position={[0, rackHeight, rackDepth / 2 - 0.03]} castShadow>
                <boxGeometry args={[rackWidth, rackHeight * 0.8, 0.05]} />
                <meshStandardMaterial color="#5d4a3a" roughness={0.8} />
            </mesh>

        </group>
    )
}
