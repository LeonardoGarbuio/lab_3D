// src/components/ui/OrganicPanel.tsx
// Painel interativo de Reações Orgânicas
import { useLabStore } from '../../stores/useLabStore'
import { ORGANIC_REACTIONS, getEffectEmoji } from '../../systems/OrganicReactionsSystem'
import { useState, useEffect, useRef } from 'react'
import './OrganicPanel.css'

export default function OrganicPanel() {
    const {
        isOrganicPanelOpen,
        closeOrganicPanel,
        organicReactionId,
        setOrganicReactionId,
        organicIsActive,
        setOrganicIsActive,
        organicTemperature,
        setOrganicTemperature,
        organicStirring,
        setOrganicStirring,
    } = useLabStore()

    const [liveData, setLiveData] = useState({
        progress: 0,
        status: 'Pronto para reagir',
        threadLength: 0,
        gelViscosity: 0,
        bubbleRate: 0,
    })

    const intervalRef = useRef<number | null>(null)

    useEffect(() => {
        if (isOrganicPanelOpen) {
            intervalRef.current = window.setInterval(() => {
                const data = (window as any).__organicLiveData
                if (data) {
                    setLiveData({
                        progress: data.progress || 0,
                        status: data.status || '',
                        threadLength: data.threadLength || 0,
                        gelViscosity: data.gelViscosity || 0,
                        bubbleRate: data.bubbleRate || 0,
                    })
                }
            }, 300)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isOrganicPanelOpen])

    if (!isOrganicPanelOpen) return null

    const reaction = ORGANIC_REACTIONS[organicReactionId]

    return (
        <div className="organic-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeOrganicPanel() }}>
            <div className="organic-panel" onClick={e => e.stopPropagation()}>
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">⚗️</span>
                        <h2>SÍNTESE ORGÂNICA</h2>
                        <span className="panel-badge">QUÍMICA ORGÂNICA</span>
                    </div>
                    <button className="panel-close" onClick={closeOrganicPanel}>✕</button>
                </div>

                <div className="panel-body">
                    {/* Reaction selector */}
                    <div className="config-section">
                        <h3>🧪 Selecionar Reação</h3>
                        <div className="reaction-grid">
                            {Object.entries(ORGANIC_REACTIONS).map(([id, rxn]) => (
                                <button
                                    key={id}
                                    className={`reaction-btn ${organicReactionId === id ? 'active' : ''}`}
                                    onClick={() => setOrganicReactionId(id)}
                                    disabled={organicIsActive}
                                >
                                    <span className="emoji">{getEffectEmoji(rxn.visualEffect)}</span>
                                    <span className="rxn-name">{rxn.name}</span>
                                    <span className="rxn-type">
                                        {rxn.requiresHeat ? '🔥' : '🌡️'} {rxn.optimalTemp || 25}°C
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reaction info */}
                    {reaction && (
                        <div className="config-section">
                            <h3>📋 Detalhes</h3>
                            <div className="rxn-details">
                                <p className="description">{reaction.description}</p>
                                <div className="reagent-row">
                                    <div className="reagent-card">
                                        <span className="label">Reagente 1</span>
                                        <span className="formula">{reaction.reagent1.name}</span>
                                        <span className="sub-formula">{reaction.reagent1.formula}</span>
                                    </div>
                                    <span className="plus">+</span>
                                    <div className="reagent-card">
                                        <span className="label">Reagente 2</span>
                                        <span className="formula">{reaction.reagent2.name}</span>
                                        <span className="sub-formula">{reaction.reagent2.formula}</span>
                                    </div>
                                    <span className="arrow">→</span>
                                    <div className="reagent-card product">
                                        <span className="label">Produto</span>
                                        <span className="formula">{reaction.products.map(p => p.name).join(' + ')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Temperature control */}
                    {reaction?.requiresHeat && (
                        <div className="config-section">
                            <h3>🌡️ Temperatura</h3>
                            <div className="temp-control">
                                <span className="temp-value" style={{ color: organicTemperature > 60 ? '#ff4400' : '#00ccff' }}>
                                    {organicTemperature}°C
                                </span>
                                <input
                                    type="range"
                                    min="20"
                                    max="120"
                                    step="5"
                                    value={organicTemperature}
                                    onChange={(e) => setOrganicTemperature(parseInt(e.target.value))}
                                    disabled={!organicIsActive}
                                />
                                <span className="temp-label">Ótimo: {reaction.optimalTemp || 25}°C</span>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    <div className="config-section">
                        <h3>📊 Progresso</h3>
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${liveData.progress * 100}%` }} />
                            </div>
                            <span className="progress-text">{(liveData.progress * 100).toFixed(0)}%</span>
                        </div>
                        <div className="status-text">{liveData.status}</div>

                        {/* Specific data */}
                        <div className="monitor-grid">
                            {liveData.threadLength > 0 && (
                                <div className="monitor-card">
                                    <div className="monitor-value">{liveData.threadLength.toFixed(2)}m</div>
                                    <div className="monitor-label">Fio de Nylon</div>
                                </div>
                            )}
                            {liveData.gelViscosity > 0 && (
                                <div className="monitor-card">
                                    <div className="monitor-value">{(liveData.gelViscosity * 100).toFixed(0)}%</div>
                                    <div className="monitor-label">Viscosidade</div>
                                </div>
                            )}
                            {liveData.bubbleRate > 0 && (
                                <div className="monitor-card">
                                    <div className="monitor-value">{liveData.bubbleRate.toFixed(0)}</div>
                                    <div className="monitor-label">Bolhas/s</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="power-section">
                        <button
                            className={`control-btn ${organicStirring ? 'active-stir' : ''}`}
                            onClick={() => setOrganicStirring(!organicStirring)}
                            disabled={!organicIsActive}
                        >
                            🌀 {organicStirring ? 'Parar Agitação' : 'Agitar'}
                        </button>
                        <button
                            className={`power-btn ${organicIsActive ? 'running' : ''}`}
                            onClick={() => setOrganicIsActive(!organicIsActive)}
                        >
                            {organicIsActive ? '⏹ Parar Reação' : '▶ Iniciar Reação'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
