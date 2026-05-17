// src/components/ui/CrystallizerPanel.tsx
// Painel interativo da Cristalização
import { useLabStore } from '../../stores/useLabStore'
import { CRYSTAL_SUBSTANCES, getSolubilityForSubstance } from '../../systems/CrystallizationSystem'
import { useState, useEffect, useRef } from 'react'
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
    } = useLabStore()

    const [liveData, setLiveData] = useState({
        temperature: 25,
        saturation: 0,
        crystalsFormed: 0,
        concentration: 0,
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

    return (
        <div className="crystallizer-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeCrystallizerPanel() }}>
            <div className="crystallizer-panel" onClick={e => e.stopPropagation()}>
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">💎</span>
                        <h2>CRISTALIZAÇÃO</h2>
                        <span className="panel-badge">ESTADO SÓLIDO</span>
                    </div>
                    <button className="panel-close" onClick={closeCrystallizerPanel}>✕</button>
                </div>

                <div className="panel-body">
                    {/* Substance selector */}
                    <div className="config-section">
                        <h3>🧪 Substância</h3>
                        <div className="substance-grid">
                            {Object.entries(CRYSTAL_SUBSTANCES).map(([id, sub]) => (
                                <button
                                    key={id}
                                    className={`substance-btn ${crystallizerSubstanceId === id ? 'active' : ''}`}
                                    onClick={() => setCrystallizerSubstanceId(id)}
                                    disabled={crystallizerIsHeating || crystallizerIsCooling}
                                >
                                    <div className="crystal-preview" style={{ background: sub.color, boxShadow: `0 0 8px ${sub.color}40` }} />
                                    <span className="formula">{sub.formula}</span>
                                    <span className="name">{sub.name}</span>
                                    <span className="shape">{sub.shape}</span>
                                </button>
                            ))}
                        </div>
                    </div>

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

                    {/* Controls */}
                    <div className="power-section">
                        <button
                            className={`control-btn ${crystallizerIsHeating ? 'active-heat' : ''}`}
                            onClick={() => {
                                setCrystallizerIsHeating(!crystallizerIsHeating)
                                if (!crystallizerIsHeating) setCrystallizerIsCooling(false)
                            }}
                        >
                            🔥 {crystallizerIsHeating ? 'Parar Aquecimento' : 'Aquecer'}
                        </button>
                        <button
                            className={`control-btn ${crystallizerIsCooling ? 'active-cool' : ''}`}
                            onClick={() => {
                                setCrystallizerIsCooling(!crystallizerIsCooling)
                                if (!crystallizerIsCooling) setCrystallizerIsHeating(false)
                            }}
                        >
                            🧊 {crystallizerIsCooling ? 'Parar Resfriamento' : 'Resfriar'}
                        </button>
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
                </div>
            </div>
        </div>
    )
}
