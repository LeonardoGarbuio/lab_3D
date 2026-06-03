// src/components/ui/SolidStateSimulator.tsx
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import CrystalLattice, { type LatticeType } from '../canvas/CrystalLattice'
import './SolidStateSimulator.css'

interface SolidStateSimulatorProps {
    isOpen: boolean
    onClose: () => void
}

const LATTICE_INFO: Record<LatticeType, { name: string; desc: string; examples: string; color: string }> = {
    'sc': { name: 'Cúbica Simples (SC)', desc: 'Estrutura básica onde os átomos ocupam os 8 vértices de um cubo. Muito rara (ex: Polônio). Baixa eficiência de empacotamento (52%).', examples: 'Po', color: '#ff5555' },
    'bcc': { name: 'Cúbica de Corpo Centrado (BCC)', desc: 'Átomos nos vértices e um átomo no centro do cubo. Empacotamento moderado (68%).', examples: 'Fe, V, Nb, Cr', color: '#55aaff' },
    'fcc': { name: 'Cúbica de Faces Centradas (FCC)', desc: 'Átomos nos vértices e no centro de cada face. Empacotamento denso (74%).', examples: 'Al, Cu, Au, Ag, Pb', color: '#ffaa00' },
    'hcp': { name: 'Hexagonal Compacta (HCP)', desc: 'Camadas alternadas ABABAB formando um prisma hexagonal. Empacotamento máximo (74%).', examples: 'Ti, Zn, Mg, Cd', color: '#55ffaa' }
}

type MaterialType = 'conductor' | 'semiconductor' | 'insulator'

const BAND_INFO: Record<MaterialType, { name: string; gap: number; gapText: string; desc: string; color: string }> = {
    'conductor': { name: 'Condutor (Metal)', gap: 0, gapText: '0 eV', desc: 'Banda de valência e banda de condução se sobrepõem. Elétrons fluem livremente.', color: '#55aaff' },
    'semiconductor': { name: 'Semicondutor', gap: 1.1, gapText: '~1 eV', desc: 'Pequeno Band Gap (Eg). Elétrons podem saltar para a banda de condução com energia (calor/luz).', color: '#ffaa00' },
    'insulator': { name: 'Isolante', gap: 5.0, gapText: '> 4 eV', desc: 'Grande Band Gap. A energia térmica ambiente não é suficiente para promover elétrons.', color: '#ff5555' }
}

export default function SolidStateSimulator({ isOpen, onClose }: SolidStateSimulatorProps) {
    const [activeTab, setActiveTab] = useState<'lattice' | 'band'>('lattice')
    const [latticeType, setLatticeType] = useState<LatticeType>('bcc')
    const [materialType, setMaterialType] = useState<MaterialType>('semiconductor')

    if (!isOpen) return null

    const currentLattice = LATTICE_INFO[latticeType]
    const currentBand = BAND_INFO[materialType]

    return (
        <div className="ss-overlay" onClick={onClose}>
            <div className="ss-modal" onClick={e => e.stopPropagation()}>
                {/* TOPBAR */}
                <div className="ss-topbar">
                    <div className="ss-title">
                        <span className="ss-icon">💎</span>
                        <h2>Física do Estado Sólido</h2>
                    </div>
                    <div className="ss-tabs">
                        <button 
                            className={`ss-tab ${activeTab === 'lattice' ? 'active' : ''}`}
                            onClick={() => setActiveTab('lattice')}
                        >
                            Redes de Bravais
                        </button>
                        <button 
                            className={`ss-tab ${activeTab === 'band' ? 'active' : ''}`}
                            onClick={() => setActiveTab('band')}
                        >
                            Teoria das Bandas
                        </button>
                    </div>
                    <button className="ss-close" onClick={onClose}>✕</button>
                </div>

                <div className="ss-content">
                    {/* TAB: REDES DE BRAVAIS */}
                    {activeTab === 'lattice' && (
                        <>
                            <div className="ss-viewport">
                                <Canvas shadows gl={{ antialias: true, alpha: false }}>
                                    <ambientLight intensity={0.4} />
                                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                                    <pointLight position={[-10, -10, -10]} intensity={0.5} color={currentLattice.color} />
                                    <color attach="background" args={['#080c14']} />
                                    
                                    <CrystalLattice type={latticeType} color={currentLattice.color} />
                                    
                                    <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={45} />
                                    <OrbitControls makeDefault enablePan={false} autoRotate={true} autoRotateSpeed={1.0} />
                                </Canvas>
                                
                                <div className="ss-glass-overlay">
                                    <div className="ss-info-badge" style={{ borderColor: currentLattice.color }}>
                                        <h3 style={{ color: currentLattice.color }}>{currentLattice.name}</h3>
                                        <p>{currentLattice.desc}</p>
                                        <p className="ss-example"><strong>Metais:</strong> {currentLattice.examples}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ss-sidebar">
                                <h3>Selecione a Estrutura</h3>
                                <div className="ss-selector">
                                    {(Object.keys(LATTICE_INFO) as LatticeType[]).map(type => (
                                        <button
                                            key={type}
                                            className={`ss-btn ${latticeType === type ? 'active' : ''}`}
                                            onClick={() => setLatticeType(type)}
                                            style={{ '--accent': LATTICE_INFO[type].color } as any}
                                        >
                                            {LATTICE_INFO[type].name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB: TEORIA DAS BANDAS */}
                    {activeTab === 'band' && (
                        <>
                            <div className="ss-viewport band-viewport">
                                <div className="band-diagram-container">
                                    <div className="band-diagram">
                                        {/* Banda de Condução */}
                                        <div className="band conduction-band" style={{ 
                                            bottom: `calc(50% + ${currentBand.gap * 20}px)`,
                                            borderColor: currentBand.color 
                                        }}>
                                            <span>Banda de Condução</span>
                                            <div className="electrons sparse">
                                                {materialType === 'conductor' && 'e- e- e- e- e-'}
                                                {materialType === 'semiconductor' && 'e-'}
                                            </div>
                                        </div>

                                        {/* Band Gap */}
                                        {currentBand.gap > 0 && (
                                            <div className="band-gap" style={{
                                                height: `${currentBand.gap * 40}px`,
                                                bottom: '50%',
                                                transform: 'translateY(50%)'
                                            }}>
                                                <span className="gap-label">Eg = {currentBand.gapText}</span>
                                            </div>
                                        )}

                                        {/* Banda de Valência */}
                                        <div className="band valence-band" style={{ 
                                            top: `calc(50% + ${currentBand.gap * 20}px)`,
                                            backgroundColor: `${currentBand.color}22`
                                        }}>
                                            <span>Banda de Valência</span>
                                            <div className="electrons dense">
                                                e- e- e- e- e- e- e- e-
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ss-glass-overlay">
                                    <div className="ss-info-badge" style={{ borderColor: currentBand.color }}>
                                        <h3 style={{ color: currentBand.color }}>{currentBand.name}</h3>
                                        <p>{currentBand.desc}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ss-sidebar">
                                <h3>Selecione o Material</h3>
                                <div className="ss-selector">
                                    {(Object.keys(BAND_INFO) as MaterialType[]).map(type => (
                                        <button
                                            key={type}
                                            className={`ss-btn ${materialType === type ? 'active' : ''}`}
                                            onClick={() => setMaterialType(type)}
                                            style={{ '--accent': BAND_INFO[type].color } as any}
                                        >
                                            {BAND_INFO[type].name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
