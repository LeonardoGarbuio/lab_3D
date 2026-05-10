// src/components/canvas/CrystalLattice.tsx
import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type LatticeType = 'sc' | 'bcc' | 'fcc' | 'hcp'

interface CrystalLatticeProps {
    type: LatticeType
    color: string
    size?: number
}

// Definições de pontos para cada estrutura
const LATTICE_POINTS: Record<LatticeType, [number, number, number][]> = {
    'sc': [
        [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5]
    ],
    'bcc': [
        [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5],
        [0, 0, 0] // Centro do corpo
    ],
    'fcc': [
        [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5],
        // Centros das faces
        [0, 0, -0.5], [0, 0, 0.5], [0, -0.5, 0], [0, 0.5, 0], [-0.5, 0, 0], [0.5, 0, 0]
    ],
    'hcp': [
        // Base inferior
        [0, -0.5, -0.577], [0.5, -0.5, -0.289], [0.5, -0.5, 0.289], 
        [0, -0.5, 0.577], [-0.5, -0.5, 0.289], [-0.5, -0.5, -0.289],
        [0, -0.5, 0], // Centro base inf
        // Plano médio (3 átomos)
        [0, 0, -0.289], [0.25, 0, 0.144], [-0.25, 0, 0.144],
        // Base superior
        [0, 0.5, -0.577], [0.5, 0.5, -0.289], [0.5, 0.5, 0.289], 
        [0, 0.5, 0.577], [-0.5, 0.5, 0.289], [-0.5, 0.5, -0.289],
        [0, 0.5, 0], // Centro base sup
    ]
}

export default function CrystalLattice({ type, color, size = 3 }: CrystalLatticeProps) {
    const groupRef = useRef<THREE.Group>(null)
    const points = LATTICE_POINTS[type]
    
    // Matriz para repetir a célula unitária num grid 3x3x3
    const instances = useMemo(() => {
        if (type === 'hcp') {
            return points;
        }

        const arr: [number, number, number][] = []
        // Gerar um grid 2x2x2
        for (let x = -0.5; x <= 0.5; x++) {
            for (let y = -0.5; y <= 0.5; y++) {
                for (let z = -0.5; z <= 0.5; z++) {
                    for (const p of points) {
                        arr.push([p[0] + x, p[1] + y, p[2] + z])
                    }
                }
            }
        }
        
        // Remover duplicatas por estarem nas bordas
        const unique = new Map<string, [number, number, number]>()
        for (const p of arr) {
            const key = `${p[0].toFixed(3)},${p[1].toFixed(3)},${p[2].toFixed(3)}`
            unique.set(key, p as [number, number, number])
        }
        return Array.from(unique.values())
    }, [type, points])

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.2
        }
    })

    const meshRef = useRef<THREE.InstancedMesh>(null)

    useLayoutEffect(() => {
        if (!meshRef.current) return
        const dummy = new THREE.Object3D()
        for (let i = 0; i < instances.length; i++) {
            dummy.position.set(instances[i][0] * size, instances[i][1] * size, instances[i][2] * size)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [instances, size])

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, instances.length]}>
                <sphereGeometry args={[size * 0.15, 32, 32]} />
                <meshPhysicalMaterial 
                    color={color}
                    metalness={0.8}
                    roughness={0.2}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                />
            </instancedMesh>
            
            {/* Linhas conectando para SC (apenas para dar uma ideia de grade) */}
            {type === 'sc' && (
                <gridHelper args={[size * 2, 2, '#444444', '#222222']} position={[0, -size, 0]} />
            )}
        </group>
    )
}
