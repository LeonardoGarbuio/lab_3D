// src/components/canvas/FluidContainer.tsx
// ═══════════════════════════════════════════════════════════════════════
// 💪 MÚSCULO — Renderizador de Partículas (Main Thread)
// Este componente é deliberadamente "burro": ele NÃO faz cálculos
// de física. Apenas lê um Float32Array de posições (vindo do Worker)
// e atualiza o InstancedMesh a cada frame do React Three Fiber.
//
// 🎮 TÉCNICA AAA #5: MATERIAL BUDGET
// meshStandardMaterial com emissive alcança visual premium a custo ZERO.
// ═══════════════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FluidContainerProps {
    /** Ref para o Float32Array de posições [x0,y0,z0, x1,y1,z1, ...] */
    positionsRef: React.RefObject<Float32Array | null>
    /** Número de partículas a renderizar */
    particleCount: number
    /** Cor das partículas */
    particleColor?: string
    /** Tamanho do recipiente */
    bounds?: number
}

export default function FluidContainer({
    positionsRef,
    particleCount,
    particleColor = '#4ecdc4',
    bounds = 5,
}: FluidContainerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // Matriz temporária para atualizar posições (alocado UMA vez)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame(() => {
        if (!meshRef.current) return

        const positions = positionsRef.current
        if (!positions) return

        // Atualiza o InstancedMesh com as posições vindas do Worker
        const count = Math.min(particleCount, positions.length / 3)
        for (let i = 0; i < count; i++) {
            const off = i * 3
            dummy.position.set(
                positions[off],
                positions[off + 1],
                positions[off + 2]
            )
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        }

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <group>
            {/* Caixa delimitadora */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(bounds, bounds, bounds)]} />
                <lineBasicMaterial color="#00f7ff" opacity={0.2} transparent />
            </lineSegments>

            {/* Partículas instanciadas — material leve */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial
                    color={particleColor}
                    emissive={particleColor}
                    emissiveIntensity={0.3}
                    metalness={0.1}
                    roughness={0.2}
                    transparent
                    opacity={0.8}
                />
            </instancedMesh>
        </group>
    )
}
