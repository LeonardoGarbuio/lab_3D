// src/components/ui/SpectrometerPanel.tsx
// Painel interativo do Espectrômetro — emissão e UV-Vis
import { useLabStore } from '../../stores/useLabStore'
import { SpectrumGraph, AbsorbanceGraph } from '../equipment/Spectrometer'
import { ELEMENT_SPECTRA } from '../../systems/SpectroscopySystem'
import { useState } from 'react'
import './SpectrometerPanel.css'

type TabMode = 'emission' | 'absorption'

export default function SpectrometerPanel() {
    const {
        isSpectrometerPanelOpen,
        closeSpectrometerPanel,
        spectrometerSampleElement,
        setSpectrometerSample,
        objects, // <-- import objects
    } = useLabStore()

    const [tab, setTab] = useState<TabMode>('emission')
    const [absFormula, setAbsFormula] = useState('KMnO4')
    const [absConc, setAbsConc] = useState(0.001)

    if (!isSpectrometerPanelOpen) return null

    // === BÉQUERES NA MESA ===
    const availableBeakers = objects.filter(o => o.formula && !o.isBroken && o.fillLevel > 0)

    // Filtra béqueres para Emissão (procura por elementos conhecidos no espectro)
    const beakerElements = availableBeakers.map(beaker => {
        // Tenta achar um elemento do espectro que esteja presente na fórmula do béquer
        const formula = beaker.formula || ''
        const foundElement = Object.keys(ELEMENT_SPECTRA).find(sym => formula.includes(sym))
        if (foundElement) {
            return { symbol: foundElement, beaker }
        }
        return null
    }).filter(Boolean) as Array<{ symbol: string; beaker: typeof objects[0] }>

    // Filtra béqueres para UV-Vis (procura por perfis de absorção)
    const beakerUVVis = availableBeakers.map(beaker => {
        const formula = beaker.formula || ''
        // Uma busca simplificada nos perfis conhecidos
        const knownAbs = ['KMnO4', 'CuSO4', 'NiSO4', 'CoCl2'].find(abs => formula.includes(abs))
        if (knownAbs) {
            return { formula: knownAbs, beaker }
        }
        return null
    }).filter(Boolean) as Array<{ formula: string; beaker: typeof objects[0] }>

    const currentSpectrum = spectrometerSampleElement ? ELEMENT_SPECTRA[spectrometerSampleElement] : null

    // Helper function for full screen overlay
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeSpectrometerPanel()
    }

    return (
        <div className="spectrometer-overlay" onClick={handleOverlayClick}>
            <div className="spectrometer-panel">
                {/* Top Bar */}
                <div className="panel-topbar">
                    <div className="panel-title-group">
                        <span className="panel-icon">🌈</span>
                        <h2>ESPECTRÔMETRO</h2>
                        <span className="panel-badge">ANÁLISE ESPECTRAL</span>
                    </div>
                    <div className="panel-controls">
                         <div className="tab-selector">
                            <button className={`tab-btn ${tab === 'emission' ? 'active' : ''}`} onClick={() => setTab('emission')}>
                                🔥 Emissão
                            </button>
                            <button className={`tab-btn ${tab === 'absorption' ? 'active' : ''}`} onClick={() => setTab('absorption')}>
                                📊 Absorção (UV-Vis)
                            </button>
                        </div>
                        <button className="panel-close" onClick={closeSpectrometerPanel}>✕</button>
                    </div>
                </div>

                <div className="panel-content">
                    {/* SIDEBAR - Controles */}
                    <div className="panel-sidebar">

                    {tab === 'emission' && (
                        <>
                            {/* Element selector */}
                            <div className="config-section">
                                <h3>⚛️ Amostra (dos Béqueres)</h3>
                                {beakerElements.length > 0 ? (
                                    <div className="element-grid">
                                        {beakerElements.map(({ symbol, beaker }, idx) => {
                                            const spec = ELEMENT_SPECTRA[symbol]
                                            return (
                                                <button
                                                    key={`${symbol}-${idx}`}
                                                    className={`element-btn ${spectrometerSampleElement === symbol ? 'active' : ''}`}
                                                    onClick={() => setSpectrometerSample(symbol)}
                                                    style={{ borderColor: spec?.dominantColor || '#555' }}
                                                >
                                                    <span className="symbol" style={{ color: spec?.dominantColor }}>{symbol}</span>
                                                    <span className="name">{spec?.element}</span>
                                                    <div style={{ fontSize: '0.6rem', marginTop: 4, opacity: 0.7 }}>Béquer {beaker.id.split('-')[1]}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: '#ff8888', padding: '10px 0' }}>
                                        Nenhum béquer contendo elementos com espectro visível encontrado na mesa (ex: Na, Cu, Sr, Ba).
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {tab === 'absorption' && (
                        <>
                            {/* Substance selector */}
                            <div className="config-section">
                                <h3>🧪 Amostra para UV-Vis (dos Béqueres)</h3>
                                {beakerUVVis.length > 0 ? (
                                    <div className="element-grid">
                                        {beakerUVVis.map(({ formula, beaker }, idx) => (
                                            <button
                                                key={`${formula}-${idx}`}
                                                className={`element-btn ${absFormula === formula ? 'active' : ''}`}
                                                onClick={() => setAbsFormula(formula)}
                                            >
                                                <span className="symbol">{formula}</span>
                                                <div style={{ fontSize: '0.6rem', marginTop: 4, opacity: 0.7 }}>Béquer {beaker.id.split('-')[1]}</div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: '#ff8888', padding: '10px 0' }}>
                                        Nenhum béquer contendo substâncias coloridas encontrado na mesa (ex: KMnO4, CuSO4, NiSO4, CoCl2).
                                    </div>
                                )}
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
                        </>
                    )}
                    </div> {/* End Sidebar */}

                    {/* MAIN VIEWPORT - Gráficos e Tabelas */}
                    <div className="panel-main">
                        {tab === 'emission' && (
                            <>
                                {/* Spectrum view */}
                                <div className="main-section">
                                    <h3>📈 Espectro de Emissão</h3>
                                    {spectrometerSampleElement ? (
                                        <div className="spectrum-container">
                                            <SpectrumGraph elementSymbol={spectrometerSampleElement} width={800} height={200} />
                                        </div>
                                    ) : (
                                        <div className="empty-spectrum">
                                            Selecione um elemento na lateral para visualizar seu espectro
                                        </div>
                                    )}
                                </div>

                                {/* Element info */}
                                {currentSpectrum && (
                                    <div className="main-section">
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
                            {/* Absorbance graph */}
                            <div className="main-section">
                                <h3>📊 Curva de Absorbância (Beer-Lambert)</h3>
                                <div className="spectrum-container">
                                    <AbsorbanceGraph substanceFormula={absFormula} concentration={absConc} width={800} height={400} />
                                </div>
                            </div>
                        </>
                    )}
                    </div> {/* End Main Viewport */}
                </div>
            </div>
        </div>
    )
}
