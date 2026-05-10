// src/components/canvas/environment/LabBench.tsx
// Bancada de laboratório com prateleiras e detalhes
import { useRef } from 'react'
import type { Group } from 'three'

interface LabBenchProps {
    position?: [number, number, number]
    rotation?: [number, number, number]
}

export default function LabBench({ position = [0, 0, 0], rotation = [0, 0, 0] }: LabBenchProps) {
    const groupRef = useRef<Group>(null)

    // BANCADA MAIOR para acomodar todos os equipamentos
    const benchWidth = 6         // Aumentado de 4 para 6
    const benchDepth = 1.8       // Aumentado de 1.2 para 1.8
    const benchHeight = 0.08
    const legHeight = 0.9
    const legSize = 0.08

    return (
        <group ref={groupRef} position={position} rotation={rotation} raycast={null as any}>
            {/* Tampo da bancada (granito escuro) */}
            <mesh position={[0, legHeight + benchHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[benchWidth, benchHeight, benchDepth]} />
                <meshStandardMaterial
                    color="#2d2d2d"
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>

            {/* Borda frontal do tampo */}
            <mesh position={[0, legHeight + benchHeight / 2, benchDepth / 2 + 0.02]} castShadow>
                <boxGeometry args={[benchWidth, benchHeight + 0.02, 0.04]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
            </mesh>

            {/* Pernas da bancada (metal) */}
            {[
                [-benchWidth / 2 + legSize, legHeight / 2, -benchDepth / 2 + legSize],
                [benchWidth / 2 - legSize, legHeight / 2, -benchDepth / 2 + legSize],
                [-benchWidth / 2 + legSize, legHeight / 2, benchDepth / 2 - legSize],
                [benchWidth / 2 - legSize, legHeight / 2, benchDepth / 2 - legSize],
            ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[legSize, legHeight, legSize]} />
                    <meshStandardMaterial color="#505050" roughness={0.5} metalness={0.7} />
                </mesh>
            ))}

            {/* Travessa horizontal inferior (reforço) */}
            <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[benchWidth - legSize * 2, 0.04, 0.04]} />
                <meshStandardMaterial color="#404040" roughness={0.5} metalness={0.6} />
            </mesh>

            {/* Prateleira superior (vidro) */}
            <mesh position={[0, legHeight + 0.6, -benchDepth / 3]} receiveShadow>
                <boxGeometry args={[benchWidth * 0.9, 0.01, benchDepth * 0.4]} />
                <meshStandardMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.3}
                    roughness={0.05}
                />
            </mesh>

            {/* Suportes da prateleira */}
            {[-benchWidth / 2 + 0.3, benchWidth / 2 - 0.3].map((x, i) => (
                <mesh key={i} position={[x, legHeight + 0.3, -benchDepth / 3]} castShadow>
                    <boxGeometry args={[0.03, 0.5, 0.03]} />
                    <meshStandardMaterial color="#606060" roughness={0.4} metalness={0.8} />
                </mesh>
            ))}

            {/* Pia pequena embutida */}
            <mesh position={[benchWidth / 2 - 0.5, legHeight + 0.01, 0]} receiveShadow>
                <boxGeometry args={[0.6, 0.15, 0.5]} />
                <meshStandardMaterial color="#404855" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Água na pia (superfície) */}
            <mesh position={[benchWidth / 2 - 0.5, legHeight - 0.01, 0]}>
                <planeGeometry args={[0.55, 0.45]} />
                <meshStandardMaterial
                    color="#4a90d9"
                    transparent
                    opacity={0.6}
                    roughness={0.05}
                    metalness={0.1}
                />
            </mesh>

            {/* Torneira */}
            <group position={[benchWidth / 2 - 0.5, legHeight + 0.2, -0.3]}>
                {/* Base */}
                <mesh castShadow>
                    <cylinderGeometry args={[0.03, 0.04, 0.15, 16]} />
                    <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.95} />
                </mesh>
                {/* Bico */}
                <mesh position={[0, 0.1, 0.1]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
                    <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.95} />
                </mesh>
            </group>
        </group>
    )
}
