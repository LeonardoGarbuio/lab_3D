// src/components/canvas/MoleculeViewer.tsx
// Visualizador de estrutura molecular 3D
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Dados de moléculas comuns
const MOLECULE_DATA: Record<string, { atoms: { symbol: string; position: [number, number, number]; color: string }[]; bonds: [number, number][] }> = {
    'H2O': {
        atoms: [
            { symbol: 'O', position: [0, 0, 0], color: '#ff0000' },
            { symbol: 'H', position: [-0.8, 0.6, 0], color: '#ffffff' },
            { symbol: 'H', position: [0.8, 0.6, 0], color: '#ffffff' },
        ],
        bonds: [[0, 1], [0, 2]]
    },
    'CO2': {
        atoms: [
            { symbol: 'C', position: [0, 0, 0], color: '#333333' },
            { symbol: 'O', position: [-1.2, 0, 0], color: '#ff0000' },
            { symbol: 'O', position: [1.2, 0, 0], color: '#ff0000' },
        ],
        bonds: [[0, 1], [0, 2]]
    },
    'NaCl': {
        atoms: [
            { symbol: 'Na', position: [-0.5, 0, 0], color: '#ab5cf2' },
            { symbol: 'Cl', position: [0.5, 0, 0], color: '#1ff01f' },
        ],
        bonds: [[0, 1]]
    },
    'CH4': {
        atoms: [
            { symbol: 'C', position: [0, 0, 0], color: '#333333' },
            { symbol: 'H', position: [0.6, 0.6, 0.6], color: '#ffffff' },
            { symbol: 'H', position: [-0.6, -0.6, 0.6], color: '#ffffff' },
            { symbol: 'H', position: [0.6, -0.6, -0.6], color: '#ffffff' },
            { symbol: 'H', position: [-0.6, 0.6, -0.6], color: '#ffffff' },
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
    },
    'HCl': {
        atoms: [
            { symbol: 'H', position: [-0.5, 0, 0], color: '#ffffff' },
            { symbol: 'Cl', position: [0.5, 0, 0], color: '#1ff01f' },
        ],
        bonds: [[0, 1]]
    },
    'NH3': {
        atoms: [
            { symbol: 'N', position: [0, 0, 0], color: '#3050f8' },
            { symbol: 'H', position: [0.7, -0.5, 0], color: '#ffffff' },
            { symbol: 'H', position: [-0.7, -0.5, 0], color: '#ffffff' },
            { symbol: 'H', position: [0, -0.5, 0.7], color: '#ffffff' },
        ],
        bonds: [[0, 1], [0, 2], [0, 3]]
    },
    'O2': {
        atoms: [
            { symbol: 'O', position: [-0.4, 0, 0], color: '#ff0000' },
            { symbol: 'O', position: [0.4, 0, 0], color: '#ff0000' },
        ],
        bonds: [[0, 1]]
    },
    'H2': {
        atoms: [
            { symbol: 'H', position: [-0.3, 0, 0], color: '#ffffff' },
            { symbol: 'H', position: [0.3, 0, 0], color: '#ffffff' },
        ],
        bonds: [[0, 1]]
    },
}

// Raios atômicos relativos
const ATOM_RADII: Record<string, number> = {
    'H': 0.12, 'C': 0.2, 'N': 0.18, 'O': 0.17, 'Na': 0.22, 'Cl': 0.2, 'S': 0.2,
}

interface MoleculeViewerProps {
    formula: string
    position: [number, number, number]
    scale?: number
    rotating?: boolean
}

export default function MoleculeViewer({ formula, position, scale = 1, rotating = true }: MoleculeViewerProps) {
    const groupRef = useRef<THREE.Group>(null)

    // Rotação automática
    useFrame((_, delta) => {
        if (groupRef.current && rotating) {
            groupRef.current.rotation.y += delta * 0.5
        }
    })

    const molecule = MOLECULE_DATA[formula]

    if (!molecule) {
        // Molécula genérica para fórmulas desconhecidas
        return (
            <group ref={groupRef} position={position} scale={scale}>
                <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.2} />
                </mesh>
            </group>
        )
    }

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Átomos */}
            {molecule.atoms.map((atom, i) => (
                <mesh key={i} position={atom.position}>
                    <sphereGeometry args={[ATOM_RADII[atom.symbol] || 0.15, 32, 32]} />
                    <meshStandardMaterial
                        color={atom.color}
                        metalness={0.3}
                        roughness={0.3}
                    />
                </mesh>
            ))}

            {/* Ligações */}
            {molecule.bonds.map(([a, b], i) => {
                const startAtom = molecule.atoms[a]
                const endAtom = molecule.atoms[b]

                const start = new THREE.Vector3(...startAtom.position)
                const end = new THREE.Vector3(...endAtom.position)
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
                const length = start.distanceTo(end)

                // Calcular rotação
                const direction = new THREE.Vector3().subVectors(end, start).normalize()
                const quaternion = new THREE.Quaternion()
                quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

                return (
                    <mesh
                        key={`bond-${i}`}
                        position={[mid.x, mid.y, mid.z]}
                        quaternion={quaternion}
                    >
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
                    </mesh>
                )
            })}
        </group>
    )
}

// Componente UI para mostrar molécula em modal
export function MoleculeModal({ formula, isOpen, onClose }: { formula: string; isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null

    const molecule = MOLECULE_DATA[formula]

    return (
        <div className="molecule-modal" onClick={onClose}>
            <div className="molecule-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                <h2>🧬 Estrutura de {formula}</h2>
                <p className="mol-info">
                    {molecule
                        ? `${molecule.atoms.length} átomos, ${molecule.bonds.length} ligações`
                        : 'Estrutura não disponível'}
                </p>
                <div className="mol-3d-container">
                    {/* A visualização 3D seria renderizada aqui via Canvas separado */}
                    <p>Visualização 3D interativa</p>
                </div>
            </div>
        </div>
    )
}
