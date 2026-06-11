// src/components/ui/CrystallizerPanel.tsx
// Painel interativo da Cristalização
import { useLabStore } from '../../stores/useLabStore'
import { CRYSTAL_SUBSTANCES, getSolubilityForSubstance } from '../../systems/CrystallizationSystem'
import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Crystal } from '../effects/Crystal'
import './CrystallizerPanel.css'

export default function CrystallizerPanel() {
    const {
        isCrystallizerPanelOpen,
        closeCrystallizerPanel,
        crystallizerSubstanceId,
        setCrystallizerSubstanceId,
        crystallizerIsHeating,
        setCrystallizerIsHeating,
        crystallizerIsCooling,
        setCrystallizerIsCooling,
        objects,
    } = useLabStore()

    const [liveData, setLiveData] = useState<{
        temperature: number;
        saturation: number;
        crystalsFormed: number;
        concentration: number;
        crystallizationRate: number;
        crystals: any[];
    }>({
        temperature: 25,
        saturation: 0,
        crystalsFormed: 0,
        concentration: 0,
        crystallizationRate: 0,
        crystals: [],
    })

    const intervalRef = useRef<number | null>(null)

    useEffect(() => {
        if (isCrystallizerPanelOpen) {
            intervalRef.current = window.setInterval(() => {
                const data = (window as any).__crystallizationLiveData
                if (data) {
                    setLiveData({
                        temperature: data.temperature || 25,
                        saturation: data.saturation || 0,
                        crystalsFormed: data.crystalsFormed || 0,
                        concentration: data.concentration || 0,
                        crystallizationRate: data.crystallizationRate || 0,
                        crystals: data.crystals || [],
                    })
                }
            }, 300)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isCrystallizerPanelOpen])

    if (!isCrystallizerPanelOpen) return null

    const substance = CRYSTAL_SUBSTANCES[crystallizerSubstanceId]
    const solubility = substance ? getSolubilityForSubstance(liveData.temperature, substance) : 0

    // === BÉQUERES COM SUBSTÂNCIAS CRISTALIZÁVEIS ===
    const availableBeakers = objects.filter(o => o.formula && !o.isBroken && o.fillLevel > 0)
    const beakerCrystals = availableBeakers
        .map(beaker => {
            const bForm = beaker.formula?.toLowerCase() || ''
            const match = Object.entries(CRYSTAL_SUBSTANCES).find(([key, sub]) => 
                key.toLowerCase() === bForm || sub.formula.toLowerCase() === bForm || sub.name.toLowerCase() === bForm
            )
            if (match) {
                return { beakerId: beaker.id, substanceKey: match[0], substance: match[1], beaker }
            }
            return null
        })
        .filter(Boolean) as Array<{ beakerId: string; substanceKey: string; substance: typeof CRYSTAL_SUBSTANCES[string]; beaker: typeof objects[0] }>

    const hasBeakerCrystals = beakerCrystals.length > 0

    return (
        <div className="crystallizer-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeCrystallizerPanel() }}>
            <div className="crystallizer-panel" onClick={e => e.stopPropagation()}>
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">💎</span>
                        <h2>CRISTALIZAÇÃO</h2>
                        <span className="panel-badge">ESTADO SÓLIDO</span>
                    </div>
                    <div className="panel-controls">
                        <button className="panel-close" onClick={closeCrystallizerPanel}>✕</button>
                    </div>
                </div>

                <div className="panel-content">
                    {/* SIDEBAR - Controles */}
                    <div className="panel-sidebar">
                    {/* Substance selector */}
                    <div className="config-section">
                        <h3>🧪 Substância (dos Béqueres)</h3>
                        {hasBeakerCrystals ? (
                            <div className="substance-grid">
                                {beakerCrystals.map(({ beakerId, substanceKey, substance: sub, beaker }) => (
                                    <button
                                        key={beakerId}
                                        className={`substance-btn ${crystallizerSubstanceId === substanceKey ? 'active' : ''}`}
                                        onClick={() => setCrystallizerSubstanceId(substanceKey)}
                                        disabled={crystallizerIsHeating || crystallizerIsCooling}
                                    >
                                        <div className="crystal-preview" style={{ background: sub.color, boxShadow: `0 0 8px ${sub.color}40` }} />
                                        <span className="formula">{sub.formula}</span>
                                        <span className="name">{sub.name}</span>
                                        <span className="shape">{sub.shape}</span>
                                        <div style={{ fontSize: '0.6rem', marginTop: 4, opacity: 0.7 }}>Béquer {beaker.id.split('-')[1]}</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="no-beakers-msg" style={{ fontSize: '0.85rem', color: '#ff8888', padding: '10px 0' }}>
                                <p>⚠️ Nenhum béquer com substância cristalizável disponível.</p>
                                <p>Adicione CuSO₄, NaCl, KNO₃ ou Ac. Acetilsalicílico a um béquer na mesa.</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="power-section">
                        <button
                            className={`control-btn ${crystallizerIsHeating ? 'active-heat' : ''}`}
                            onClick={() => {
                                setCrystallizerIsHeating(!crystallizerIsHeating)
                                if (!crystallizerIsHeating) setCrystallizerIsCooling(false)
                            }}
                        >
                            🔥 {crystallizerIsHeating ? 'Parar' : 'Aquecer'}
                        </button>
                        <button
                            className={`control-btn ${crystallizerIsCooling ? 'active-cool' : ''}`}
                            onClick={() => {
                                setCrystallizerIsCooling(!crystallizerIsCooling)
                                if (!crystallizerIsCooling) setCrystallizerIsHeating(false)
                            }}
                        >
                            🧊 {crystallizerIsCooling ? 'Parar' : 'Resfriar'}
                        </button>
                    </div>
                    
                    </div> {/* End Sidebar */}

                    {/* MAIN VIEWPORT - Gráficos e Monitores */}
                    <div className="panel-main">
                    {/* Data Monitors */}
                    <div className="config-section">
                        <h3>📊 Monitores</h3>
                        <div className="monitor-grid">
                            <div className="monitor-card">
                                <div className="monitor-value" style={{ color: liveData.temperature > 60 ? '#ff4400' : liveData.temperature < 30 ? '#0088ff' : '#00ff88' }}>
                                    {liveData.temperature.toFixed(1)}°C
                                </div>
                                <div className="monitor-label">Temperatura</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value" style={{ color: liveData.saturation > 1.2 ? '#ffff00' : liveData.saturation >= 1 ? '#00ff00' : '#aaa' }}>
                                    {(liveData.saturation * 100).toFixed(0)}%
                                </div>
                                <div className="monitor-label">Saturação</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {liveData.crystalsFormed}
                                </div>
                                <div className="monitor-label">Cristais</div>
                            </div>
                        </div>
                    </div>

                    {/* Solubility info */}
                    <div className="config-section">
                        <h3>📐 Solubilidade a {liveData.temperature.toFixed(0)}°C</h3>
                        <div className="reaction-info">
                            S({substance?.formula}) = {solubility.toFixed(3)} mol/L
                        </div>
                    </div>

                    {/* Status */}
                    <div className="config-section">
                        <h3>ℹ️ Status</h3>
                        <div className="status-text">
                            {liveData.saturation > 1.2 ? '⚠️ Solução supersaturada — cristais crescendo!' :
                                liveData.saturation >= 1 ? '✅ Solução saturada — pronta para cristalizar' :
                                    crystallizerIsHeating ? '🔥 Aquecendo — aumentando solubilidade...' :
                                        crystallizerIsCooling ? '🧊 Resfriando — diminuindo solubilidade...' :
                                            '⏸️ Parado — aqueça e resfrie para cristalizar'}
                        </div>
                    </div>

                    {/* Simulação 3D (Holograma) */}
                    <div className="config-section hologram-section" style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <h3>🌐 Visão Microscópica (Holograma)</h3>
                        <div className="hologram-viewport" style={{ flex: 1, background: '#050a10', borderRadius: '8px', overflow: 'hidden', border: '1px solid #112233', position: 'relative' }}>
                            {crystallizerSubstanceId && liveData.crystals.length > 0 ? (
                                <Canvas camera={{ position: [0, 0.1, 0.25], fov: 45 }}>
                                    <color attach="background" args={['#050a10']} />
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[1, 1, 1]} intensity={2} />
                                    <pointLight position={[-1, -1, -1]} intensity={1} color="#0088ff" />
                                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enablePan={false} maxDistance={0.5} minDistance={0.05} />
                                    
                                    <group position={[0, 0, 0]}>
                                        {/* Grid de fundo */}
                                        <gridHelper args={[0.4, 20, '#113355', '#0a1a2a']} position={[0, -0.05, 0]} />
                                        
                                        {liveData.crystals.map((crystal) => (
                                            <Crystal
                                                key={crystal.id}
                                                type={crystal.type}
                                                position={[crystal.position[0] * 1.5, crystal.position[1], crystal.position[2] * 1.5]}
                                                rotation={crystal.rotation}
                                                scale={crystal.scale * 1.5} // Maior no painel para melhor visualização
                                                growthRate={liveData.crystallizationRate || 0}
                                                isGrowing={(liveData.crystallizationRate ?? 0) > 0}
                                            />
                                        ))}
                                    </group>
                                </Canvas>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#445566', fontStyle: 'italic' }}>
                                    {crystallizerSubstanceId ? 'Aguardando saturação para formar cristais...' : 'Selecione um béquer na lateral'}
                                </div>
                            )}
                        </div>
                    </div>

                    </div> {/* End Main Viewport */}
                </div>
            </div>
        </div>
    )
}
