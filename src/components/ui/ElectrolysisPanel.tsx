// src/components/ui/ElectrolysisPanel.tsx
// Painel de controlo interativo da Célula Eletrolítica
// Usa as substâncias disponíveis nos béqueres do laboratório

import { useState, useEffect, useRef } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import { ELECTROLYTES, predictElectrolysisProducts, calculateCurrent } from '../../systems/ElectrolysisSystem'
import './ElectrolysisPanel.css'

export default function ElectrolysisPanel() {
    const {
        isElectrolysisPanelOpen,
        closeElectrolysisPanel,
        electrolysisVoltage,
        setElectrolysisVoltage,
        electrolysisElectrolyteId,
        setElectrolysisElectrolyteId,
        electrolysisRunning,
        setElectrolysisRunning,
        objects,
    } = useLabStore()

    // Live simulation data (updated via polling from mutable ref in 3D component)
    const [liveData, setLiveData] = useState({
        current: 0,
        gasCathode: 0,
        gasAnode: 0,
        cathodeProduct: '',
        anodeProduct: '',
        overallReaction: '',
        voltageRequired: 0,
        concentration: 0,
    })

    const intervalRef = useRef<number | null>(null)

    // === BÉQUERES COM SUBSTÂNCIAS ===
    // Filtrar objetos que têm substância e não estão quebrados
    const availableBeakers = objects.filter(o => o.formula && !o.isBroken && o.fillLevel > 0)

    // Mapear fórmulas dos béqueres para eletrólitos conhecidos
    const beakerElectrolytes = availableBeakers
        .map(beaker => {
            // Procurar se a fórmula do béquer corresponde a um eletrólito
            const match = Object.entries(ELECTROLYTES).find(([_, elec]) => {
                const beakerFormula = beaker.formula?.replace(/\s/g, '') || ''
                return elec.formula === beakerFormula ||
                    elec.formula.replace(/[₂₃₄]/g, m => ({ '₂': '2', '₃': '3', '₄': '4' }[m] || m)) === beakerFormula ||
                    beakerFormula === elec.formula.replace(/₂/g, '2').replace(/₃/g, '3').replace(/₄/g, '4')
            })
            if (match) {
                return { beakerId: beaker.id, electrolyteKey: match[0], electrolyte: match[1], beaker }
            }
            return null
        })
        .filter(Boolean) as Array<{ beakerId: string; electrolyteKey: string; electrolyte: typeof ELECTROLYTES[string]; beaker: typeof objects[0] }>

    // Compute predicted products for current config
    const electrolyte = ELECTROLYTES[electrolysisElectrolyteId]
    const products = electrolyte ? predictElectrolysisProducts(electrolyte) : null

    // Live polling from the window global (set by ElectrolysisCell)
    useEffect(() => {
        if (isElectrolysisPanelOpen && electrolysisRunning) {
            intervalRef.current = window.setInterval(() => {
                const data = (window as any).__electrolysisLiveData
                if (data) {
                    setLiveData({
                        current: data.current || 0,
                        gasCathode: data.gasCathode || 0,
                        gasAnode: data.gasAnode || 0,
                        cathodeProduct: data.cathodeProduct || '',
                        anodeProduct: data.anodeProduct || '',
                        overallReaction: data.overallReaction || '',
                        voltageRequired: data.voltageRequired || 0,
                        concentration: data.concentration || 0,
                    })
                }
            }, 250)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isElectrolysisPanelOpen, electrolysisRunning])

    if (!isElectrolysisPanelOpen) return null

    const handlePower = () => setElectrolysisRunning(!electrolysisRunning)

    // Preview current at current voltage
    const previewCurrent = electrolyte
        ? calculateCurrent(electrolysisVoltage, electrolyte)
        : 0

    // Fall back to full list if no beakers have electrolytes
    const hasBeakerElectrolytes = beakerElectrolytes.length > 0

    return (
        <div className="electrolysis-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeElectrolysisPanel() }}>
            <div className="electrolysis-panel" onClick={e => e.stopPropagation()}>
                {/* Top Bar — estilo Microscópio Quântico */}
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">⚡</span>
                        <h2>CÉLULA ELETROLÍTICA</h2>
                        <span className="panel-badge">ELETROQUÍMICA</span>
                    </div>
                    <button className="panel-close" onClick={closeElectrolysisPanel}>✕</button>
                </div>

                <div className="panel-body">
                    {/* Electrolyte from Beakers */}
                    <div className="config-section">
                        <h3>🧪 Eletrólito {hasBeakerElectrolytes ? '(dos Béqueres)' : ''}</h3>
                        {hasBeakerElectrolytes ? (
                            <div className="electrolyte-grid">
                                {beakerElectrolytes.map(({ beakerId, electrolyteKey, electrolyte: elec, beaker }) => (
                                    <button
                                        key={beakerId}
                                        className={`electrolyte-btn ${electrolysisElectrolyteId === electrolyteKey ? 'active' : ''}`}
                                        onClick={() => {
                                            if (!electrolysisRunning) {
                                                setElectrolysisElectrolyteId(electrolyteKey)
                                            }
                                        }}
                                        disabled={electrolysisRunning}
                                    >
                                        <span className="formula">{elec.formula}</span>
                                        <span className="name">{elec.name}</span>
                                        <span className="beaker-tag">Béquer {beaker.id.split('-')[1]} • {(beaker.fillLevel * 100).toFixed(0)}%</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="no-beakers-msg">
                                <p>⚠️ Nenhum béquer com eletrólito disponível.</p>
                                <p>Adicione NaCl, H₂SO₄, CuSO₄, NaOH, KI, ZnSO₄ ou AgNO₃ a um béquer usando o painel de reagentes.</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 8 }}>
                                    Enquanto isso, selecione um eletrólito de referência abaixo:
                                </p>
                                <div className="electrolyte-grid" style={{ marginTop: 8 }}>
                                    {Object.entries(ELECTROLYTES).map(([id, elec]) => (
                                        <button
                                            key={id}
                                            className={`electrolyte-btn ${electrolysisElectrolyteId === id ? 'active' : ''}`}
                                            onClick={() => { if (!electrolysisRunning) setElectrolysisElectrolyteId(id) }}
                                            disabled={electrolysisRunning}
                                        >
                                            <span className="formula">{elec.formula}</span>
                                            <span className="name">{elec.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Voltage Slider */}
                    <div className="config-section">
                        <h3>🔋 Tensão Aplicada</h3>
                        <div className="voltage-control">
                            <div className="voltage-display">
                                <span className="voltage-value">{electrolysisVoltage.toFixed(1)}V</span>
                                <span className="voltage-label">
                                    {products ? `Mínimo: ${products.voltageRequired.toFixed(2)}V` : '—'}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.1"
                                value={electrolysisVoltage}
                                onChange={(e) => setElectrolysisVoltage(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Predicted Reaction */}
                    {products && (
                        <div className="config-section">
                            <h3>⚗️ Reação Prevista</h3>
                            <div className="reaction-info">
                                {electrolysisRunning && liveData.overallReaction
                                    ? liveData.overallReaction
                                    : products.overallReaction}
                            </div>
                        </div>
                    )}

                    {/* Data Monitors */}
                    <div className="config-section">
                        <h3>📊 Monitores</h3>
                        <div className="monitor-grid">
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {electrolysisRunning
                                        ? (liveData.current * 1000).toFixed(1)
                                        : (previewCurrent * 1000).toFixed(1)}
                                </div>
                                <div className="monitor-label">Corrente (mA)</div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {electrolysisRunning
                                        ? liveData.gasCathode.toFixed(2)
                                        : '0.00'}
                                </div>
                                <div className="monitor-label">
                                    {products?.cathodeProduct || 'Cátodo'} (mL)
                                </div>
                            </div>
                            <div className="monitor-card">
                                <div className="monitor-value">
                                    {electrolysisRunning
                                        ? liveData.gasAnode.toFixed(2)
                                        : '0.00'}
                                </div>
                                <div className="monitor-label">
                                    {products?.anodeProduct || 'Ânodo'} (mL)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Power Button */}
                    <div className="power-section">
                        <div className={`status-dot ${electrolysisRunning ? 'on' : ''}`} />
                        <button
                            className={`power-btn ${electrolysisRunning ? 'running' : ''}`}
                            onClick={handlePower}
                        >
                            {electrolysisRunning ? '⏹ Desligar' : '▶ Ligar'}
                        </button>
                        <div className={`status-dot ${electrolysisRunning ? 'on' : ''}`} />
                    </div>

                    {/* Concentration when running */}
                    {electrolysisRunning && liveData.concentration > 0 && (
                        <div className="config-section">
                            <h3>📉 Concentração do Eletrólito</h3>
                            <div className="monitor-grid">
                                <div className="monitor-card" style={{ gridColumn: 'span 3' }}>
                                    <div className="monitor-value" style={{ color: liveData.concentration < 0.01 ? '#ff6b6b' : '#00ff88' }}>
                                        {liveData.concentration.toFixed(6)} M
                                    </div>
                                    <div className="monitor-label">Concentração Residual</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
