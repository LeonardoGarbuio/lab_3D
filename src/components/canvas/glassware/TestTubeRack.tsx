// src/components/canvas/glassware/TestTubeRack.tsx
// Suporte para tubos de ensaio
import { useRef } from 'react'
import type { Group } from 'three'
import TestTube from './TestTube'

interface TestTubeRackProps {
    position: [number, number, number]
    tubes?: Array<{
        color: string
        level: number
    }>
}

export default function TestTubeRack({
    position,
    tubes = [
        { color: '#ff6b6b', level: 0.7 },
        { color: '#4ecdc4', level: 0.5 },
        { color: '#ffe66d', level: 0.8 },
        { color: '#95e1d3', level: 0.3 },
        { color: '#f38181', level: 0.6 },
    ]
}: TestTubeRackProps) {
    const groupRef = useRef<Group>(null)

    const rackWidth = 1.2
    const rackDepth = 0.3
    const rackHeight = 0.15
    const holeSpacing = rackWidth / (tubes.length + 1)

    return (
        <group ref={groupRef} position={position}>
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

            {/* Tubos de ensaio */}
            {tubes.map((tube, index) => (
                <TestTube
                    key={index}
                    position={[
                        -rackWidth / 2 + holeSpacing * (index + 1),
                        rackHeight + 0.6,
                        0
                    ]}
                    liquidColor={tube.color}
                    liquidLevel={tube.level}
                    scale={0.8}
                />
            ))}
        </group>
    )
}
