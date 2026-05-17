// src/components/ui/SpectrometerPanel.tsx
// Painel interativo do Espectrômetro — emissão e UV-Vis
import { useLabStore } from '../../stores/useLabStore'
import { SpectrumGraph, AbsorbanceGraph } from '../equipment/Spectrometer'
import { getAvailableElements, ELEMENT_SPECTRA } from '../../systems/SpectroscopySystem'
import { useState } from 'react'
import './SpectrometerPanel.css'

type TabMode = 'emission' | 'absorption'

export default function SpectrometerPanel() {
    const {
        isSpectrometerPanelOpen,
        closeSpectrometerPanel,
        spectrometerSampleElement,
        setSpectrometerSample,
    } = useLabStore()

    const [tab, setTab] = useState<TabMode>('emission')
    const [absFormula, setAbsFormula] = useState('KMnO4')
    const [absConc, setAbsConc] = useState(0.001)

    if (!isSpectrometerPanelOpen) return null

    const elements = getAvailableElements()
    const currentSpectrum = spectrometerSampleElement ? ELEMENT_SPECTRA[spectrometerSampleElement] : null

    return (
        <div className="spectrometer-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSpectrometerPanel() }}>
            <div className="spectrometer-panel" onClick={e => e.stopPropagation()}>
                {/* Top Bar */}
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">🌈</span>
                        <h2>ESPECTRÔMETRO</h2>
                        <span className="panel-badge">ANÁLISE ESPECTRAL</span>
                    </div>
                    <button className="panel-close" onClick={closeSpectrometerPanel}>✕</button>
                </div>

                <div className="panel-body">
                    {/* Tab selector */}
                    <div className="tab-selector">
                        <button className={`tab-btn ${tab === 'emission' ? 'active' : ''}`} onClick={() => setTab('emission')}>
                            🔥 Emissão
                        </button>
                        <button className={`tab-btn ${tab === 'absorption' ? 'active' : ''}`} onClick={() => setTab('absorption')}>
                            📊 Absorção (UV-Vis)
                        </button>
                    </div>

                    {tab === 'emission' && (
                        <>
                            {/* Element selector */}
                            <div className="config-section">
                                <h3>⚛️ Selecionar Elemento</h3>
                                <div className="element-grid">
                                    {elements.map(symbol => {
                                        const spec = ELEMENT_SPECTRA[symbol]
                                        return (
                                            <button
                                                key={symbol}
                                                className={`element-btn ${spectrometerSampleElement === symbol ? 'active' : ''}`}
                                                onClick={() => setSpectrometerSample(symbol)}
                                                style={{ borderColor: spec?.dominantColor || '#555' }}
                                            >
                                                <span className="symbol" style={{ color: spec?.dominantColor }}>{symbol}</span>
                                                <span className="name">{spec?.element}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Spectrum view */}
                            <div className="config-section">
                                <h3>📈 Espectro de Emissão</h3>
                                {spectrometerSampleElement ? (
                                    <div className="spectrum-container">
                                        <SpectrumGraph elementSymbol={spectrometerSampleElement} width={480} height={180} />
                                    </div>
                                ) : (
                                    <div className="empty-spectrum">
                                        Selecione um elemento acima para visualizar seu espectro
                                    </div>
                                )}
                            </div>

                            {/* Element info */}
                            {currentSpectrum && (
                                <div className="config-section">
                                    <h3>📋 Linhas Espectrais Detectadas</h3>
                                    <div className="lines-table">
                                        <div className="table-header">
                                            <span>λ (nm)</span>
                                            <span>Intensidade</span>
                                            <span>Cor</span>
                                            <span>Transição</span>
                                        </div>
                                        {currentSpectrum.lines.map((line, i) => (
                                            <div key={i} className="table-row">
                                                <span>{line.wavelength.toFixed(1)}</span>
                                                <span>{(line.intensity * 100).toFixed(0)}%</span>
                                                <span>
                                                    <div className="color-dot" style={{ background: line.color }} />
                                                </span>
                                                <span className="transition">{line.transition || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'absorption' && (
                        <>
                            {/* Substance selector */}
                            <div className="config-section">
                                <h3>🧪 Substância para UV-Vis</h3>
                                <div className="element-grid">
                                    {['KMnO4', 'CuSO4', 'NiSO4', 'CoCl2'].map(formula => (
                                        <button
                                            key={formula}
                                            className={`element-btn ${absFormula === formula ? 'active' : ''}`}
                                            onClick={() => setAbsFormula(formula)}
                                        >
                                            <span className="symbol">{formula}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Concentration slider */}
                            <div className="config-section">
                                <h3>📐 Concentração</h3>
                                <div className="conc-control">
                                    <span className="conc-value">{absConc.toFixed(4)} mol/L</span>
                                    <input
                                        type="range"
                                        min="0.0001"
                                        max="0.05"
                                        step="0.0001"
                                        value={absConc}
                                        onChange={(e) => setAbsConc(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Absorbance graph */}
                            <div className="config-section">
                                <h3>📊 Curva de Absorbância (Beer-Lambert)</h3>
                                <div className="spectrum-container">
                                    <AbsorbanceGraph substanceFormula={absFormula} concentration={absConc} width={480} height={240} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
