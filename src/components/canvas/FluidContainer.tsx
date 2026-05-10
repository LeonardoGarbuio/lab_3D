// src/components/canvas/FluidContainer.tsx
// ═══════════════════════════════════════════════════════════════════════
// 🎮 TÉCNICA AAA #5: MATERIAL BUDGET
// Estúdios AAA definem um "orçamento" de materiais por cena.
// MeshTransmissionMaterial renderiza a cena INTEIRA em um FBO invisível
// para CADA objeto que o usa. Isso triplica o custo da GPU.
// meshStandardMaterial com emissive alcança visual similar a custo ZERO.
// ═══════════════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FluidEngine } from '../../physics/FluidEngine'

interface FluidContainerProps {
    engine: FluidEngine
    particleColor?: string
}

export default function FluidContainer({ engine, particleColor = '#4ecdc4' }: FluidContainerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const count = engine.particles.length
    
    // Matriz temporária para atualizar posições (alocado UMA vez)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    useFrame(() => {
        if (!meshRef.current) return
        
        // Atualiza a física
        engine.update()
        
        // Atualiza o InstancedMesh
        for (let i = 0; i < count; i++) {
            const p = engine.particles[i]
            dummy.position.set(p.pos[0], p.pos[1], p.pos[2])
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
                <edgesGeometry args={[new THREE.BoxGeometry(engine.bounds, engine.bounds, engine.bounds)]} />
                <lineBasicMaterial color="#00f7ff" opacity={0.2} transparent />
            </lineSegments>

            {/* Partículas instanciadas — material leve */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
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
