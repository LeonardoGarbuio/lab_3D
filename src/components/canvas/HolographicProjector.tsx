// src/components/canvas/HolographicProjector.tsx
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PubChemService } from '../../services/PubChemService'
import { parseSDF, type Molecule3D } from '../../utils/SDFParser'
import { Html } from '@react-three/drei'

interface Props {
    position: [number, number, number]
    formulaToLoad: string | null
}

export default function HolographicProjector({ position, formulaToLoad }: Props) {
    const groupRef = useRef<THREE.Group>(null)
    const [molecule, setMolecule] = useState<Molecule3D | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!formulaToLoad) {
            setMolecule(null)
            return
        }

        let isMounted = true
        setLoading(true)
        setError(null)

        PubChemService.searchByName(formulaToLoad).then(result => {
            if (!isMounted) return
            setLoading(false)
            if (result && result.sdf3D) {
                const mol = parseSDF(result.sdf3D)
                setMolecule(mol)
            } else {
                setError(`Não foi possível carregar ${formulaToLoad}`)
            }
        }).catch(() => {
            if (isMounted) {
                setLoading(false)
                setError('Erro na conexão com PubChem')
            }
        })

        return () => { isMounted = false }
    }, [formulaToLoad])

    useFrame((state) => {
        if (groupRef.current && molecule) {
            groupRef.current.rotation.y += 0.005
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.5
        }
    })

    return (
        <group position={position}>
            {/* Base do Projetor */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.7, 0.2, 32]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Luz Holográfica */}
            {formulaToLoad && (
                <>
                    <pointLight position={[0, 0.5, 0]} color="#00ffff" intensity={2} distance={3} />
                    <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.4, 0.5, 0.05, 32]} />
                        <meshBasicMaterial color="#00ffff" />
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[0.01, 0.4, 1.2, 32]} />
                        <meshBasicMaterial color="#00ffff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>
                </>
            )}

            {/* UI de Loading/Erro */}
            {(loading || error) && (
                <Html position={[0, 1.5, 0]} center>
                    <div style={{ color: '#00ffff', fontFamily: 'monospace', textShadow: '0 0 5px #00ffff', whiteSpace: 'nowrap' }}>
                        {loading ? '📡 Conectando ao PubChem...' : `⚠️ ${error}`}
                    </div>
                </Html>
            )}

            {/* Átomos e Ligações */}
            {molecule && (
                <group ref={groupRef} scale={0.4}>
                    {molecule.bonds.map((bond, i) => {
                        const source = molecule.atoms[bond.source]
                        const target = molecule.atoms[bond.target]
                        if (!source || !target) return null
                        
                        const distance = source.position.distanceTo(target.position)
                        const center = source.position.clone().lerp(target.position, 0.5)
                        const quaternion = new THREE.Quaternion().setFromUnitVectors(
                            new THREE.Vector3(0, 1, 0),
                            target.position.clone().sub(source.position).normalize()
                        )

                        return (
                            <mesh key={`bond-${i}`} position={center} quaternion={quaternion}>
                                <cylinderGeometry args={[0.1, 0.1, distance, 8]} />
                                <meshPhysicalMaterial color="#aaaaaa" transmission={0.5} opacity={0.8} transparent />
                            </mesh>
                        )
                    })}

                    {molecule.atoms.map((atom, i) => (
                        <mesh key={`atom-${i}`} position={atom.position}>
                            <sphereGeometry args={[atom.radius * 0.5, 32, 32]} />
                            <meshPhysicalMaterial 
                                color={atom.color} 
                                metalness={0.3} 
                                roughness={0.2}
                                clearcoat={1.0}
                                emissive={atom.color}
                                emissiveIntensity={0.2}
                            />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    )
}
