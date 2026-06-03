// src/components/ui/DistillationPanel.tsx
// Painel de controlo interativo do Aparato de Destilação
// Permite selecionar misturas presentes nos béqueres

import { useState, useEffect, useRef } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import { DISTILLATION_MIXTURES } from '../../systems/DistillationSystem'
import './DistillationPanel.css'

export default function DistillationPanel() {
    const {
        isDistillationPanelOpen,
        closeDistillationPanel,
        distillationHeating,
        setDistillationHeating,
        distillationMixtureId,
        setDistillationMixtureId,
        objects,
    } = useLabStore()

    const [liveData, setLiveData] = useState({
        temperature: 25,
        vaporizing: false,
        vaporRate: 0,
        distillateVolume: 0,
        currentFraction: null as string | null,
        condenserTemp: 20,
        fractionCollected: [] as Array<{ name: string; volume: number; bp: number }>,
    })

    const intervalRef = useRef<number | null>(null)

    // === BÉQUERES COM MISTURAS ===
    const availableBeakers = objects.filter(o => o.formula && !o.isBroken && o.fillLevel > 0)
    
    const beakerMixtures = availableBeakers
        .map(beaker => {
            const match = Object.entries(DISTILLATION_MIXTURES).find(([key, mix]) => {
                const bForm = beaker.formula?.toLowerCase() || ''
                return mix.id.toLowerCase() === bForm || mix.name.toLowerCase() === bForm || key.toLowerCase() === bForm
            })
            if (match) {
                return { beakerId: beaker.id, mixtureKey: match[0], mixture: match[1], beaker }
            }
            return null
        })
        .filter(Boolean) as Array<{ beakerId: string; mixtureKey: string; mixture: typeof DISTILLATION_MIXTURES[string]; beaker: typeof objects[0] }>

    const hasBeakerMixtures = beakerMixtures.length > 0

    useEffect(() => {
        if (isDistillationPanelOpen) {
            intervalRef.current = window.setInterval(() => {
                const data = (window as any).__distillationLiveData
                if (data) {
                    setLiveData({
                        temperature: data.temperature ?? 25,
                        vaporizing: data.vaporizing ?? false,
                        vaporRate: data.vaporRate ?? 0,
                        distillateVolume: data.distillateVolume ?? 0,
                        currentFraction: data.currentFraction ?? null,
                        condenserTemp: data.condenserTemp ?? 20,
                        fractionCollected: data.fractionCollected ?? [],
                    })
                }
            }, 250)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isDistillationPanelOpen])

    if (!isDistillationPanelOpen) return null

    const handlePower = () => setDistillationHeating(!distillationHeating)

    const tempClass = liveData.temperature < 50 ? 'cool' : liveData.temperature < 100 ? 'warm' : 'hot'

    return (
        <div className="distillation-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeDistillationPanel() }}>
            <div className="distillation-panel" onClick={e => e.stopPropagation()}>
                {/* Top Bar */}
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">🌡️</span>
                        <h2>DESTILAÇÃO FRACIONADA</h2>
                        <span className="panel-badge">SEPARAÇÃO</span>
                    </div>
                    <div className="panel-controls">
                        <button className="panel-close" onClick={closeDistillationPanel}>✕</button>
                    </div>
                </div>

                <div className="panel-content">
                    {/* SIDEBAR - Controles */}
                    <div className="panel-sidebar">
                    {/* Mixture Selector */}
                    <div className="config-section">
                        <h3>🧪 Mistura {hasBeakerMixtures ? '(dos Béqueres)' : ''}</h3>
                        {hasBeakerMixtures ? (
                            <div className="mixture-grid">
                                {beakerMixtures.map(({ beakerId, mixtureKey, mixture: mix, beaker }) => (
                                    <button
                                        key={beakerId}
                                        className={`mixture-btn ${distillationMixtureId === mixtureKey ? 'active' : ''}`}
                                        onClick={() => {
                                            if (!distillationHeating) {
                                                setDistillationMixtureId(mixtureKey)
                                            }
                                        }}
                                        disabled={distillationHeating}
                                    >
                                        <span className="formula">{mix.name}</span>
                                        <span className="name">{mix.components.length} componentes</span>
                                        <span className="beaker-tag">Béquer {beaker.id.split('-')[1]} • {(beaker.fillLevel * 100).toFixed(0)}%</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="no-beakers-msg">
                                <p>⚠️ Nenhum béquer com mistura destilável disponível.</p>
                                <p>Adicione Petróleo, Etanol+Água, etc. a um béquer na mesa.</p>
                            </div>
                        )}
                    </div>

                    {/* Temperature Display */}
                    <div className="config-section">
                        <h3>🔥 Temperatura da Mistura</h3>
                        <div className="temp-gauge">
                            <span className={`temp-value ${tempClass}`}>
                                {liveData.temperature.toFixed(1)}°C
                            </span>
                        </div>
                    </div>

                    {/* Power Button */}
                    <div className="power-section">
                        <div className={`status-dot ${distillationHeating ? 'on' : ''}`} />
                        <button
                            className={`power-btn ${distillationHeating ? 'running' : ''}`}
                            onClick={handlePower}
                        >
                            {distillationHeating ? '🧊 Desligar Aquecimento' : '🔥 Aquecer'}
                        </button>
                        <div className={`status-dot ${distillationHeating ? 'on' : ''}`} />
                    </div>

                    </div> {/* End Sidebar */}

                    {/* MAIN VIEWPORT - Gráficos e Monitores */}
                    <div className="panel-main">
                    {/* Monitors */}
                    <div className="config-section">
                        <h3>📊 Estado do Sistema</h3>
                        <div className="monitor-grid">
                            <div className="monitor-card">
                                <div className="monitor-value" style={{ color: liveData.vaporizing ? '#ff6b4a' : '#666' }}>
                                    {liveData.vaporizing ? '💨 Sim' : 'Não'}
                                </div>
                                <div className="monitor-label">Vaporizando</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {liveData.vaporRate.toFixed(2)}
                                </div>
                                <div className="monitor-label">Taxa Evaporação</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value" style={{ color: '#4ecdc4' }}>
                                    {liveData.condenserTemp.toFixed(1)}°C
                                </div>
                                <div className="monitor-label">Temp. Condensador</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {liveData.distillateVolume.toFixed(2)} mL
                                </div>
                                <div className="monitor-label">Volume Destilado</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Fraction */}
                    {liveData.currentFraction && (
                        <div className="config-section">
                            <h3>🧫 Fração em Destilação</h3>
                            <div className="reaction-info" style={{
                                background: 'rgba(255,160,50,0.08)',
                                border: '1px solid rgba(255,160,50,0.2)',
                                borderRadius: '10px',
                                padding: '14px',
                                textAlign: 'center',
                                color: '#ffd080',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}>
                                {liveData.currentFraction}
                            </div>
                        </div>
                    )}

                    {/* Collected Fractions */}
                    {liveData.fractionCollected.length > 0 && (
                        <div className="config-section">
                            <h3>🧪 Frações Coletadas</h3>
                            <div className="fractions-list">
                                {liveData.fractionCollected.map((frac, i) => (
                                    <div key={i} className="fraction-item">
                                        <span className="frac-name">{frac.name}</span>
                                        <span className="frac-bp">PE: {frac.bp}°C</span>
                                        <span className="frac-collected">{frac.volume.toFixed(2)} mL</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    </div> {/* End Main Viewport */}
                </div>
            </div>
        </div>
    )
}
