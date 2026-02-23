// src/components/effects/CorrosionMark.tsx
// Marca de corrosão na mesa quando ácido/base derrama

import { useMemo } from 'react'

interface CorrosionMarkProps {
    position: [number, number, number]
    strength: number
    color: string
}

export function CorrosionMark({ position, strength, color }: CorrosionMarkProps) {
    const radius = useMemo(() => 0.05 + (strength / 10) * 0.15, [strength])
    const segments = useMemo(() => Math.max(16, Math.floor(strength * 3)), [strength])

    return (
        <group position={position}>
            {/* Marca principal de corrosão */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
                <circleGeometry args={[radius, segments]} />
                <meshStandardMaterial
                    color={color}
                    opacity={0.7}
                    transparent
                    roughness={0.9}
                    metalness={0.1}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Borda escurecida */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.0005, 0]}>
                <ringGeometry args={[radius * 0.9, radius * 1.1, segments]} />
                <meshStandardMaterial
                    color="#2a2a2a"
                    opacity={0.8}
                    transparent
                    roughness={1.0}
                />
            </mesh>

            {/* Manchas irregulares ao redor (mais forte a corrosão, mais manchas) */}
            {Array.from({ length: Math.floor(strength / 2) }).map((_, i) => {
                const angle = (i / Math.floor(strength / 2)) * Math.PI * 2
                const dist = radius * (1.2 + Math.random() * 0.3)
                const x = Math.cos(angle) * dist
                const z = Math.sin(angle) * dist
                const size = radius * (0.2 + Math.random() * 0.3)

                return (
                    <mesh
                        key={i}
                        rotation-x={-Math.PI / 2}
                        position={[x, 0.001, z]}
                    >
                        <circleGeometry args={[size, 8]} />
                        <meshStandardMaterial
                            color={color}
                            opacity={0.4}
                            transparent
                            roughness={0.9}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}
