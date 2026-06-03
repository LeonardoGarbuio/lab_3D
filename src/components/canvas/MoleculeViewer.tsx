// src/components/canvas/MoleculeViewer.tsx
// Visualizador VSEPR Holográfico 3D — Microscópio Quântico
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VSEPR_MOLECULES, calculateFormalCharge, type VSEPRMolecule, type BondType } from '../../data/vseprData'
import { useVSEPR } from '../../hooks/useVSEPR'
import type { GeneratedMolecule } from '../../physics/VSEPRCalculator'

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTES VISUAIS
// ═══════════════════════════════════════════════════════════════════════

const BOND_RADIUS = 0.04
const DOUBLE_BOND_OFFSET = 0.08
const TRIPLE_BOND_OFFSET = 0.1
const LONE_PAIR_SIZE = 0.22
const HOLOGRAM_COLOR = new THREE.Color('#00f7ff')

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE: ÁTOMO COM BRILHO HOLOGRÁFICO
// ═══════════════════════════════════════════════════════════════════════

function HolographicAtom({
    position,
    color,
    radius,
    symbol,
    hologram = false,
    formalCharge = 0,
    showFormalCharge = false,
    showLabels = true,
}: {
    position: [number, number, number]
    color: string
    radius: number
    symbol: string
    hologram?: boolean
    formalCharge?: number
    showFormalCharge?: boolean
    showLabels?: boolean
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const labelRef = useRef<THREE.Sprite>(null)

    useFrame((state) => {
        if (meshRef.current && hologram) {
            // Pulso sutil holográfico
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.03
            meshRef.current.scale.setScalar(1 + pulse)
        }
    })

    const labelTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 64
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, 128, 64)
        ctx.font = 'bold 40px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = hologram ? '#00f7ff' : color
        ctx.shadowBlur = 8
        ctx.fillText(symbol, 64, 32)
        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true
        return tex
    }, [symbol, color, hologram])

    const chargeTexture = useMemo(() => {
        if (!showFormalCharge || formalCharge === 0) return null
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, 64, 64)
        ctx.beginPath()
        ctx.arc(32, 32, 28, 0, 2 * Math.PI)
        ctx.fillStyle = formalCharge > 0 ? '#ff3333' : '#3333ff'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.font = 'bold 36px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        const sign = formalCharge > 0 ? '+' : '-'
        const mag = Math.abs(formalCharge)
        ctx.fillText(mag > 1 ? `${mag}${sign}` : sign, 32, 36)
        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true
        return tex
    }, [formalCharge, showFormalCharge])

    return (
        <group position={position}>
            {/* Esfera do átomo */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshPhysicalMaterial
                    color={hologram ? color : color}
                    emissive={hologram ? color : '#000000'}
                    emissiveIntensity={hologram ? 0.4 : 0}
                    metalness={hologram ? 0.1 : 0.3}
                    roughness={hologram ? 0.2 : 0.4}
                    transparent={hologram}
                    opacity={hologram ? 0.85 : 1}
                    clearcoat={hologram ? 1 : 0.2}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            {/* Glow externo holográfico */}
            {hologram && (
                <mesh>
                    <sphereGeometry args={[radius * 1.3, 16, 16]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.08}
                        side={THREE.BackSide}
                    />
                </mesh>
            )}

            {/* Label do símbolo atômico */}
            {showLabels && (
                <sprite ref={labelRef} position={[0, radius + 0.15, 0]} scale={[0.35, 0.18, 1]}>
                    <spriteMaterial map={labelTexture} transparent opacity={0.9} depthWrite={false} />
                </sprite>
            )}

            {/* Badge de Carga Formal */}
            {chargeTexture && (
                <sprite position={[radius * 0.8, radius * 0.8, 0]} scale={[0.2, 0.2, 1]}>
                    <spriteMaterial map={chargeTexture} transparent opacity={0.9} depthWrite={false} />
                </sprite>
            )}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE: LIGAÇÃO QUÍMICA
// ═══════════════════════════════════════════════════════════════════════

function ChemicalBond({
    start,
    end,
    type,
    hologram = false,
    showPiBonds = false,
}: {
    start: [number, number, number]
    end: [number, number, number]
    type: BondType
    hologram?: boolean
    showPiBonds?: boolean
}) {
    const bonds = useMemo(() => {
        const startV = new THREE.Vector3(...start)
        const endV = new THREE.Vector3(...end)
        const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5)
        const length = startV.distanceTo(endV)
        const direction = new THREE.Vector3().subVectors(endV, startV).normalize()
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

        // Offset para ligações duplas/triplas
        const perpendicular = new THREE.Vector3()
        if (Math.abs(direction.y) < 0.99) {
            perpendicular.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()
        } else {
            perpendicular.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize()
        }

        const bondPositions: { pos: THREE.Vector3; thickness: number; isPi: boolean }[] = []

        if (type === 'single' || type === 'ionic' || type === 'dative') {
            bondPositions.push({ pos: mid, thickness: BOND_RADIUS, isPi: false })
        } else if (type === 'double') {
            if (showPiBonds) {
                // 1 Sigma axial, 2 lóbulos Pi laterais (acima/abaixo)
                bondPositions.push({ pos: mid, thickness: BOND_RADIUS, isPi: false })
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(DOUBLE_BOND_OFFSET)),
                    thickness: BOND_RADIUS * 1.5,
                    isPi: true
                })
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(-DOUBLE_BOND_OFFSET)),
                    thickness: BOND_RADIUS * 1.5,
                    isPi: true
                })
            } else {
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(DOUBLE_BOND_OFFSET * 0.8)),
                    thickness: BOND_RADIUS * 0.8,
                    isPi: false
                })
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(-DOUBLE_BOND_OFFSET * 0.8)),
                    thickness: BOND_RADIUS * 0.8,
                    isPi: false
                })
            }
        } else if (type === 'triple') {
            if (showPiBonds) {
                // 1 Sigma, 4 lóbulos Pi (2 eixos perpendiculares)
                bondPositions.push({ pos: mid, thickness: BOND_RADIUS, isPi: false })
                const perp2 = new THREE.Vector3().crossVectors(perpendicular, direction).normalize()
                
                bondPositions.push({ pos: mid.clone().add(perpendicular.clone().multiplyScalar(TRIPLE_BOND_OFFSET)), thickness: BOND_RADIUS * 1.2, isPi: true })
                bondPositions.push({ pos: mid.clone().add(perpendicular.clone().multiplyScalar(-TRIPLE_BOND_OFFSET)), thickness: BOND_RADIUS * 1.2, isPi: true })
                bondPositions.push({ pos: mid.clone().add(perp2.clone().multiplyScalar(TRIPLE_BOND_OFFSET)), thickness: BOND_RADIUS * 1.2, isPi: true })
                bondPositions.push({ pos: mid.clone().add(perp2.clone().multiplyScalar(-TRIPLE_BOND_OFFSET)), thickness: BOND_RADIUS * 1.2, isPi: true })
            } else {
                bondPositions.push({ pos: mid, thickness: BOND_RADIUS * 0.7, isPi: false })
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(TRIPLE_BOND_OFFSET)),
                    thickness: BOND_RADIUS * 0.7,
                    isPi: false
                })
                bondPositions.push({
                    pos: mid.clone().add(perpendicular.clone().multiplyScalar(-TRIPLE_BOND_OFFSET)),
                    thickness: BOND_RADIUS * 0.7,
                    isPi: false
                })
            }
        }

        return bondPositions.map((bp) => ({
            position: [bp.pos.x, bp.pos.y, bp.pos.z] as [number, number, number],
            quaternion,
            length,
            thickness: bp.thickness,
            isPi: bp.isPi
        }))
    }, [start, end, type, showPiBonds])

    const bondColor = type === 'ionic' ? '#ff66aa' : type === 'dative' ? '#66aaff' : '#888888'

    return (
        <>
            {bonds.map((bond, i) => (
                <mesh key={i} position={bond.position} quaternion={bond.quaternion}>
                    <cylinderGeometry args={[bond.thickness, bond.thickness, bond.length, bond.isPi ? 12 : 8]} />
                    <meshPhysicalMaterial
                        color={bond.isPi ? '#ff00ff' : (hologram ? '#66ddff' : bondColor)}
                        emissive={bond.isPi ? '#ff00aa' : (hologram ? '#00aacc' : '#000000')}
                        emissiveIntensity={bond.isPi ? 0.5 : (hologram ? 0.3 : 0)}
                        metalness={bond.isPi ? 0.1 : 0.5}
                        roughness={bond.isPi ? 0.2 : 0.5}
                        transparent={hologram || bond.isPi}
                        opacity={bond.isPi ? 0.4 : (hologram ? 0.7 : 1)}
                    />
                </mesh>
            ))}
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE: PAR DE ELÉTRONS NÃO-LIGANTE (LONE PAIR)
// ═══════════════════════════════════════════════════════════════════════

function LonePairCloud({
    position,
    hologram = false,
}: {
    position: [number, number, number]
    hologram?: boolean
}) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (meshRef.current) {
            // Pulsação da nuvem eletrônica
            const pulse = Math.sin(state.clock.elapsedTime * 3 + position[0] * 10) * 0.1
            meshRef.current.scale.set(1 + pulse, 1 + pulse * 0.5, 1 + pulse)
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
        }
    })

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[LONE_PAIR_SIZE, 16, 16]} />
            <meshPhysicalMaterial
                color={hologram ? '#ffaa00' : '#ffcc44'}
                emissive={hologram ? '#ff8800' : '#443300'}
                emissiveIntensity={hologram ? 0.6 : 0.1}
                transparent
                opacity={hologram ? 0.35 : 0.25}
                roughness={1}
                metalness={0}
                depthWrite={false}
            />
        </mesh>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE: ANÉIS DE SCAN HOLOGRÁFICO
// ═══════════════════════════════════════════════════════════════════════

function HologramRings() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
        }
    })

    return (
        <group ref={groupRef}>
            {[1.8, 2.2, 2.6].map((radius, i) => (
                <mesh key={i} rotation={[Math.PI / 2 + i * 0.15, 0, i * 0.3]}>
                    <torusGeometry args={[radius, 0.008, 8, 64]} />
                    <meshBasicMaterial
                        color={HOLOGRAM_COLOR}
                        transparent
                        opacity={0.15 - i * 0.03}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE: GRID HOLOGRÁFICO DO CHÃO
// ═══════════════════════════════════════════════════════════════════════

function HologramGrid() {
    const gridRef = useRef<THREE.GridHelper>(null)

    useFrame((state) => {
        if (gridRef.current) {
            const mat = gridRef.current.material as THREE.Material
            if ('opacity' in mat) {
                (mat as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(state.clock.elapsedTime) * 0.03
            }
        }
    })

    return (
        <gridHelper
            ref={gridRef}
            args={[6, 20, '#00f7ff', '#004455']}
            position={[0, -2, 0]}
        />
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: MOLECULE VIEWER
// ═══════════════════════════════════════════════════════════════════════

interface MoleculeViewerProps {
    formula: string
    position?: [number, number, number]
    scale?: number
    rotating?: boolean
    hologram?: boolean              // Modo holográfico (microscópio quântico)
    showLonePairs?: boolean         // Mostrar pares isolados
    showLabels?: boolean            // Mostrar símbolos dos átomos
    showPiBonds?: boolean           // Diferenciar visualmente ligações Pi
    animateResonance?: boolean      // Interpolar estruturas de ressonância
    showFormalCharges?: boolean     // Mostrar badges de carga formal
    moleculeData?: VSEPRMolecule | GeneratedMolecule | null // Dados pré-buscados
}

export default function MoleculeViewer({
    formula,
    position = [0, 0, 0],
    scale = 1,
    rotating = true,
    hologram = false,
    showLonePairs = true,
    showLabels = true,
    showPiBonds = false,
    animateResonance = false,
    showFormalCharges = false,
    moleculeData,
}: MoleculeViewerProps) {
    const groupRef = useRef<THREE.Group>(null)
    const [resonanceIdx, setResonanceIdx] = useState(0)

    // Buscar molécula nos dados VSEPR ou usar o hook procedural
    const { molecule: fetchedMolecule } = useVSEPR(!moleculeData ? formula : null)
    const molecule = moleculeData || fetchedMolecule

    const hasResonance = molecule && 'resonance' in molecule && molecule.resonance && molecule.resonance.length > 0

    // Rotação automática e ressonância
    useFrame((state, delta) => {
        if (groupRef.current && rotating) {
            groupRef.current.rotation.y += delta * (hologram ? 0.3 : 0.5)
        }
        if (animateResonance && hasResonance) {
            const time = state.clock.elapsedTime
            // Alterna a cada 1.5s
            const newIdx = Math.floor(time / 1.5) % (molecule.resonance!.length + 1)
            if (newIdx !== resonanceIdx) {
                setResonanceIdx(newIdx)
            }
        }
    })

    const activeBonds = (animateResonance && hasResonance && resonanceIdx > 0 && 'resonance' in molecule!)
        ? molecule!.resonance![resonanceIdx - 1].bonds
        : molecule?.bonds || []


    if (!molecule) {
        // Molécula genérica para fórmulas desconhecidas
        return (
            <group ref={groupRef} position={position} scale={scale}>
                <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial
                        color="#4ecdc4"
                        emissive="#4ecdc4"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            </group>
        )
    }

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Efeitos holográficos */}
            {hologram && (
                <>
                    <HologramRings />
                    <HologramGrid />
                    {/* Luz em ponto central */}
                    <pointLight
                        position={[0, 0, 0]}
                        intensity={0.5}
                        color="#00f7ff"
                        distance={5}
                    />
                </>
            )}

            {/* ÁTOMOS */}
            {molecule.atoms.map((atom, i) => (
                <HolographicAtom
                    key={`atom-${i}`}
                    position={atom.position}
                    color={atom.color}
                    radius={atom.radius}
                    symbol={showLabels ? atom.symbol : ''}
                    hologram={hologram}
                    formalCharge={showFormalCharges ? calculateFormalCharge(molecule as VSEPRMolecule, i) : 0}
                    showFormalCharge={showFormalCharges}
                />
            ))}

            {/* LIGAÇÕES */}
            {activeBonds.map((bond, i) => (
                <ChemicalBond
                    key={`bond-${i}`}
                    start={molecule.atoms[bond.from].position}
                    end={molecule.atoms[bond.to].position}
                    type={bond.type}
                    hologram={hologram}
                    showPiBonds={showPiBonds}
                />
            ))}

            {/* PARES ISOLADOS (LONE PAIRS) */}
            {showLonePairs && molecule.electronPairs.map((pair, i) => (
                <LonePairCloud
                    key={`lp-${i}`}
                    position={pair.position}
                    hologram={hologram}
                />
            ))}
        </group>
    )
}

// Re-export para compatibilidade (o modal antigo usava isso)
export function MoleculeModal({ formula, isOpen, onClose }: { formula: string; isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null
    const molecule = VSEPR_MOLECULES[formula]

    return (
        <div className="molecule-modal" onClick={onClose}>
            <div className="molecule-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                <h2>🧬 Estrutura VSEPR de {molecule?.formula || formula}</h2>
                {molecule && (
                    <div className="mol-info-grid">
                        <p><strong>Geometria:</strong> {molecule.geometry}</p>
                        <p><strong>Hibridização:</strong> {molecule.hybridization}</p>
                        <p><strong>Ângulo:</strong> {molecule.bondAngle}</p>
                        <p><strong>Pares Ligantes:</strong> {molecule.bondingPairs}</p>
                        <p><strong>Pares Isolados:</strong> {molecule.lonePairs}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
