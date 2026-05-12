// src/components/ui/QuantumMicroscope.tsx
// Microscópio Quântico — Holograma VSEPR Fullscreen
import { useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import MoleculeViewer from '../canvas/MoleculeViewer'
import { VSEPR_MOLECULES, GEOMETRY_INFO, HYBRIDIZATION_DATA, getAvailableMolecules, type VSEPRMolecule } from '../../data/vseprData'
import { useVSEPR } from '../../hooks/useVSEPR'
import { useLabStore } from '../../stores/useLabStore'
import type { GeneratedMolecule } from '../../physics/VSEPRCalculator'
import './QuantumMicroscope.css'

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3D DO HOLOGRAMA
// ═══════════════════════════════════════════════════════════════════════

function HologramScene({ 
    formula, 
    molecule,
    showLonePairs, 
    showPiBonds, 
    animateResonance, 
    showFormalCharges 
}: { 
    formula: string
    molecule: VSEPRMolecule | GeneratedMolecule | null
    showLonePairs: boolean
    showPiBonds: boolean
    animateResonance: boolean
    showFormalCharges: boolean
}) {
    return (
        <>
            {/* Iluminação dramática */}
            <ambientLight intensity={0.15} />
            <pointLight position={[3, 4, 3]} intensity={0.6} color="#ffffff" />
            <pointLight position={[-3, 2, -3]} intensity={0.3} color="#00f7ff" />
            <pointLight position={[0, -3, 0]} intensity={0.2} color="#004488" />

            {/* Fundo escuro */}
            <color attach="background" args={['#050510']} />
            <fog attach="fog" args={['#050510', 8, 20]} />

            {/* MOLÉCULA HOLOGRÁFICA */}
            <MoleculeViewer
                formula={formula}
                moleculeData={molecule}
                position={[0, 0, 0]}
                scale={1.8}
                rotating={true}
                hologram={true}
                showLonePairs={showLonePairs}
                showLabels={true}
                showPiBonds={showPiBonds}
                animateResonance={animateResonance}
                showFormalCharges={showFormalCharges}
            />

            {/* Controles de câmera */}
            <PerspectiveCamera makeDefault position={[3.5, 2, 3.5]} fov={45} />
            <OrbitControls
                makeDefault
                enablePan={false}
                minDistance={2}
                maxDistance={10}
                autoRotate={false}
                target={[0, 0, 0]}
            />
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE INFORMAÇÕES VSEPR
// ═══════════════════════════════════════════════════════════════════════

function VSEPRInfoPanel({ molecule }: { molecule: VSEPRMolecule | GeneratedMolecule }) {
    const geoInfo = GEOMETRY_INFO[molecule.geometry] || { namePt: molecule.geometry, icon: '🔮', electronDomains: molecule.bondingPairs + molecule.lonePairs }

    return (
        <div className="vsepr-info-panel">
            <div className="vsepr-header">
                <span className="vsepr-geometry-icon">{geoInfo.icon}</span>
                <div>
                    <h3>{molecule.formula}</h3>
                    <p className="vsepr-namept">{molecule.namePt}</p>
                </div>
            </div>

            <div className="vsepr-grid">
                <div className="vsepr-stat">
                    <span className="vsepr-label">Geometria</span>
                    <span className="vsepr-value">{geoInfo.namePt}</span>
                </div>
                <div className="vsepr-stat">
                    <span className="vsepr-label">Hibridização</span>
                    <span className="vsepr-value highlight">{molecule.hybridization}</span>
                </div>
                <div className="vsepr-stat">
                    <span className="vsepr-label">Ângulo de Ligação</span>
                    <span className="vsepr-value">{molecule.bondAngle}</span>
                </div>
                <div className="vsepr-stat">
                    <span className="vsepr-label">Domínios Eletrônicos</span>
                    <span className="vsepr-value">{geoInfo.electronDomains}</span>
                </div>
                <div className="vsepr-stat">
                    <span className="vsepr-label">Pares Ligantes (BP)</span>
                    <span className="vsepr-value bp">{molecule.bondingPairs}</span>
                </div>
                <div className="vsepr-stat">
                    <span className="vsepr-label">Pares Isolados (LP)</span>
                    <span className="vsepr-value lp">{molecule.lonePairs}</span>
                </div>
                <div className="vsepr-stat full-width">
                    <span className="vsepr-label">Momento Dipolar</span>
                    <span className={`vsepr-value ${molecule.dipoleMoment ? 'polar' : 'apolar'}`}>
                        {molecule.dipoleMoment ? '✓ Polar' : '✗ Apolar'}
                    </span>
                </div>
            </div>

            <div className="vsepr-description">
                <p>{molecule.description}</p>
            </div>

            {/* Tabela de átomos */}
            <div className="vsepr-atoms-table">
                <h4>Composição</h4>
                <div className="atoms-list">
                    {Array.from(new Set(molecule.atoms.map(a => a.symbol))).map(symbol => {
                        const count = molecule.atoms.filter(a => a.symbol === symbol).length
                        const atom = molecule.atoms.find(a => a.symbol === symbol)!
                        return (
                            <div key={symbol} className="atom-entry">
                                <div className="atom-color" style={{ backgroundColor: atom.color }} />
                                <span className="atom-symbol">{symbol}</span>
                                <span className="atom-count">×{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Ligações */}
            <div className="vsepr-bonds-summary">
                <h4>Ligações</h4>
                <div className="bonds-list">
                    {molecule.bonds.map((bond, i) => (
                        <span key={i} className={`bond-badge ${bond.type}`}>
                            {molecule.atoms[bond.from].symbol}
                            {bond.type === 'double' ? '═' : bond.type === 'triple' ? '≡' : bond.type === 'ionic' ? '⁺⁻' : '─'}
                            {molecule.atoms[bond.to].symbol}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE HIBRIDIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════

function HybridizationPanel({ molecule }: { molecule: VSEPRMolecule | GeneratedMolecule }) {
    const hybData = HYBRIDIZATION_DATA.find(h => h.type === molecule.hybridization)

    if (!hybData) {
        return <div className="vsepr-info-panel"><p>Sem dados de hibridização disponíveis.</p></div>
    }

    return (
        <div className="vsepr-info-panel hybridization-panel">
            <div className="vsepr-header">
                <span className="vsepr-geometry-icon">⚡</span>
                <div>
                    <h3>Hibridização {hybData.type}</h3>
                    <p className="vsepr-namept">Diagrama de Energia e Promoção</p>
                </div>
            </div>

            <div className="vsepr-description">
                <p>Orbitais envolvidos: <strong>{hybData.totalOrbitals} orbitais híbridos</strong> misturados a partir dos orbitais atômicos puros.</p>
                <p>Custo energético de promoção: <strong className="highlight">{hybData.promotionEnergy}</strong>.</p>
            </div>

            <div className="orbital-diagram">
                <h4>Orbitais Híbridos Resultantes</h4>
                <div className="orbital-boxes">
                    {hybData.orbitals.map((orb, i) => (
                        <div key={i} className="orbital-box-container">
                            <div className="orbital-box">
                                <span className="electron up">↑</span>
                                {orb.electrons > 1 && <span className="electron down">↓</span>}
                            </div>
                            <span className="orbital-label">{orb.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// SELETOR DE MOLÉCULA
// ═══════════════════════════════════════════════════════════════════════

function MoleculeSelector({
    selectedFormula,
    onSelect,
}: {
    selectedFormula: string
    onSelect: (formula: string) => void
}) {
    const [search, setSearch] = useState('')
    const [filterGeometry, setFilterGeometry] = useState<string>('all')

    const filteredMolecules = useMemo(() => {
        return getAvailableMolecules().filter(key => {
            const mol = VSEPR_MOLECULES[key]
            const matchesSearch = search === '' ||
                mol.namePt.toLowerCase().includes(search.toLowerCase()) ||
                mol.formula.toLowerCase().includes(search.toLowerCase()) ||
                key.toLowerCase().includes(search.toLowerCase())
            const matchesGeometry = filterGeometry === 'all' || mol.geometry === filterGeometry
            return matchesSearch && matchesGeometry
        })
    }, [search, filterGeometry])

    const geometryTypes = useMemo(() => {
        const types = new Set(Object.values(VSEPR_MOLECULES).map(m => m.geometry))
        return Array.from(types)
    }, [])

    return (
        <div className="molecule-selector">
            <div className="selector-search">
                <input
                    type="text"
                    placeholder="🔍 Buscar molécula..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="selector-filters">
                <button
                    className={filterGeometry === 'all' ? 'active' : ''}
                    onClick={() => setFilterGeometry('all')}
                >
                    Todas
                </button>
                {geometryTypes.map(geo => (
                    <button
                        key={geo}
                        className={filterGeometry === geo ? 'active' : ''}
                        onClick={() => setFilterGeometry(geo)}
                        title={GEOMETRY_INFO[geo].namePt}
                    >
                        {GEOMETRY_INFO[geo].icon}
                    </button>
                ))}
            </div>

            <div className="selector-list">
                {filteredMolecules.map(key => {
                    const mol = VSEPR_MOLECULES[key]
                    const geoInfo = GEOMETRY_INFO[mol.geometry]
                    return (
                        <button
                            key={key}
                            className={`molecule-card ${selectedFormula === key ? 'selected' : ''}`}
                            onClick={() => onSelect(key)}
                        >
                            <span className="card-formula">{mol.formula}</span>
                            <span className="card-name">{mol.namePt}</span>
                            <span className="card-geometry">{geoInfo.icon} {mol.hybridization}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: QUANTUM MICROSCOPE
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// AMOSTRAS DA BANCADA
// ═══════════════════════════════════════════════════════════════════════

function BenchSamples({ onSelect }: { onSelect: (formula: string) => void }) {
    const objects = useLabStore(s => s.objects)
    const beakersWithFormulas = objects.filter(o => o.formula && o.formula !== 'Mistura' && !o.formula.includes('+'))

    if (beakersWithFormulas.length === 0) {
        return (
            <div className="vsepr-info-panel">
                <p style={{ color: '#fff' }}>Nenhuma substância pura na bancada no momento.</p>
                <p style={{ color: '#888', marginTop: '1rem' }}>Misture elementos e provoque reações nos béqueres para analisá-las aqui!</p>
            </div>
        )
    }

    return (
        <div className="molecule-selector">
            <h3 style={{ color: '#00f7ff', marginBottom: '1rem', padding: '0 1rem' }}>🧪 Amostras na Bancada</h3>
            <div className="selector-list">
                {beakersWithFormulas.map(b => (
                    <button
                        key={b.id}
                        className="molecule-card"
                        onClick={() => onSelect(b.formula!)}
                    >
                        <span className="card-formula" style={{ color: b.color || '#fff' }}>{b.formula}</span>
                        <span className="card-name">{b.customName || b.formula}</span>
                        <span className="card-geometry">Béquer</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

interface QuantumMicroscopeProps {
    isOpen: boolean
    onClose: () => void
    initialFormula?: string
}

export default function QuantumMicroscope({ isOpen, onClose, initialFormula = 'H2O' }: QuantumMicroscopeProps) {
    const [selectedFormula, setSelectedFormula] = useState(initialFormula)
    const [showLonePairs, setShowLonePairs] = useState(true)
    const [showPiBonds, setShowPiBonds] = useState(false)
    const [animateResonance, setAnimateResonance] = useState(false)
    const [showFormalCharges, setShowFormalCharges] = useState(false)
    
    type PanelView = 'vsepr' | 'hybridization' | 'catalog' | 'bench'
    const [activeView, setActiveView] = useState<PanelView>('vsepr')

    // Sincroniza a formula inicial que vem do store
    useEffect(() => {
        if (isOpen && initialFormula) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedFormula(initialFormula)
            setActiveView('vsepr')
        }
    }, [isOpen, initialFormula])

    // Hook que gerencia dados estáticos vs procedurais (Worker)
    const { molecule, isLoading, error } = useVSEPR(selectedFormula)

    if (!isOpen) return null

    return (
        <div className="quantum-microscope-overlay" onClick={onClose}>
            <div className="quantum-microscope" onClick={e => e.stopPropagation()}>

                {/* BARRA SUPERIOR */}
                <div className="qm-topbar">
                    <div className="qm-title">
                        <span className="qm-icon">🔬</span>
                        <h2>Microscópio Quântico</h2>
                        <span className="qm-badge">VSEPR</span>
                    </div>
                    <div className="qm-tabs">
                        <button 
                            className={`qm-tab ${activeView === 'vsepr' ? 'active' : ''}`}
                            onClick={() => setActiveView('vsepr')}
                        >
                            Estrutura
                        </button>
                        <button 
                            className={`qm-tab ${activeView === 'hybridization' ? 'active' : ''}`}
                            onClick={() => setActiveView('hybridization')}
                        >
                            Hibridização
                        </button>
                    </div>
                    <div className="qm-controls">
                        <button
                            className={`qm-toggle ${showLonePairs ? 'active' : ''}`}
                            onClick={() => setShowLonePairs(!showLonePairs)}
                            title="Pares de Elétrons Isolados"
                        >
                            {showLonePairs ? '👁️ LP' : '🚫 LP'}
                        </button>
                        <button
                            className={`qm-toggle ${showPiBonds ? 'active' : ''}`}
                            onClick={() => setShowPiBonds(!showPiBonds)}
                            title="Diferenciar Ligações π"
                        >
                            π
                        </button>
                        {VSEPR_MOLECULES[selectedFormula]?.resonance && (
                            <button
                                className={`qm-toggle ${animateResonance ? 'active' : ''}`}
                                onClick={() => setAnimateResonance(!animateResonance)}
                                title="Animar Ressonância"
                            >
                                ⇄
                            </button>
                        )}
                        <button
                            className={`qm-toggle ${showFormalCharges ? 'active' : ''}`}
                            onClick={() => setShowFormalCharges(!showFormalCharges)}
                            title="Cargas Formais"
                        >
                            ±
                        </button>
                        <button
                            className={`qm-toggle ${activeView === 'catalog' ? 'active' : ''}`}
                            onClick={() => setActiveView('catalog')}
                        >
                            📋 Catálogo
                        </button>
                        <button
                            className={`qm-toggle ${activeView === 'bench' ? 'active' : ''}`}
                            onClick={() => setActiveView('bench')}
                        >
                            🧪 Bancada
                        </button>
                        <button className="qm-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="qm-content">
                    {/* CANVAS 3D */}
                    <div className="qm-viewport">
                        <Canvas
                            shadows
                            gl={{
                                antialias: true,
                                powerPreference: 'high-performance',
                                alpha: false,
                            }}
                        >
                            <HologramScene
                                formula={selectedFormula}
                                showLonePairs={showLonePairs}
                                showPiBonds={showPiBonds}
                                animateResonance={animateResonance}
                                showFormalCharges={showFormalCharges}
                            />
                        </Canvas>

                        {/* Indicador de molécula */}
                        {molecule && (
                            <div className="qm-molecule-indicator">
                                <span className="indicator-formula">{molecule.formula}</span>
                                <span className="indicator-geo">
                                    {GEOMETRY_INFO[molecule.geometry]?.icon || '🔮'} {GEOMETRY_INFO[molecule.geometry]?.namePt || molecule.geometry}
                                </span>
                            </div>
                        )}

                        {/* Scanlines holográficas */}
                        <div className="qm-scanlines" />
                    </div>

                    {/* PAINEL LATERAL */}
                    <div className="qm-sidebar">
                        {activeView === 'catalog' ? (
                            <MoleculeSelector
                                selectedFormula={selectedFormula}
                                onSelect={(f) => { setSelectedFormula(f); setActiveView('vsepr') }}
                            />
                        ) : activeView === 'bench' ? (
                            <BenchSamples onSelect={(f) => { setSelectedFormula(f); setActiveView('vsepr') }} />
                        ) : isLoading ? (
                            <div className="vsepr-info-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ color: '#00f7ff' }}>Calculando Geometria...</h3>
                                    <p style={{ color: '#888' }}>O motor termodinâmico está processando a estrutura de {selectedFormula}.</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="vsepr-info-panel">
                                <h3 style={{ color: '#ff4444' }}>Erro na Análise</h3>
                                <p style={{ color: '#ffaaaa' }}>{error}</p>
                            </div>
                        ) : molecule && activeView === 'vsepr' ? (
                            <VSEPRInfoPanel molecule={molecule} />
                        ) : molecule && activeView === 'hybridization' ? (
                            <HybridizationPanel molecule={molecule} />
                        ) : null}
                    </div>
                </div>

                {/* Quick select na base */}
                <div className="qm-quickbar">
                    {['H2O', 'CO2', 'CH4', 'NH3', 'BF3', 'SF6', 'PCl5', 'XeF4', 'ClF3', 'SF4', 'IF7'].map(f => {
                        const mol = VSEPR_MOLECULES[f]
                        if (!mol) return null
                        return (
                            <button
                                key={f}
                                className={`quick-btn ${selectedFormula === f ? 'active' : ''}`}
                                onClick={() => setSelectedFormula(f)}
                                title={mol.namePt}
                            >
                                {mol.formula}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
