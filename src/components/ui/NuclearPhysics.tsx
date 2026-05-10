// src/components/ui/NuclearPhysics.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { RADIOISOTOPES, URANIUM_SERIES, THORIUM_SERIES, DECAY_TYPE_INFO, FISSION_REACTION, FUSION_REACTION } from '../../data/nuclearData'
import type { DecayStep } from '../../data/nuclearData'
import './NuclearPhysics.css'

interface Props { isOpen: boolean; onClose: () => void }
type Tab = 'radio' | 'halflife' | 'decay' | 'fission' | 'fusion' | 'capture'

// Radioactivity canvas animation
function RadioCanvas({ type }: { type: 'alpha' | 'beta' | 'gamma' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const w = ctx.canvas.width, h = ctx.canvas.height, cx = w / 2, cy = h / 2
    ctx.clearRect(0, 0, w, h)
    // Nucleus
    const ng = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35)
    ng.addColorStop(0, '#ff8c42'); ng.addColorStop(1, '#993300')
    ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.fillStyle = ng; ctx.fill()
    // Protons/neutrons inside
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.2, r = 15
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 6, 0, Math.PI * 2)
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#3b82f6'; ctx.fill()
    }
    const progress = (t * 0.4) % 3
    if (type === 'alpha') {
      const px = cx + 35 + progress * 80, py = cy - progress * 20
      if (progress < 2.5) {
        ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,68,68,${1 - progress / 3})`; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
        ctx.fillText('⁴He', px, py + 3)
      }
      ctx.fillStyle = '#aaa'; ctx.font = '12px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Partícula α (2p + 2n)', cx, h - 20)
    } else if (type === 'beta') {
      const px = cx + 35 + progress * 100, py = cy + Math.sin(progress * 5) * 15
      if (progress < 2.5) {
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59,130,246,${1 - progress / 3})`; ctx.fill()
        ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0
      }
      ctx.fillStyle = '#aaa'; ctx.font = '12px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Partícula β⁻ (e⁻ + ν̄)', cx, h - 20)
    } else {
      // Gamma wave
      ctx.strokeStyle = `rgba(34,197,94,${1 - progress / 3})`; ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < 120 * Math.min(1, progress); x++) {
        const wx = cx + 40 + x, wy = cy + Math.sin(x * 0.15 + t * 3) * 12
        x === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy)
      }
      ctx.stroke()
      ctx.fillStyle = '#aaa'; ctx.font = '12px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Raio γ (fóton de alta energia)', cx, h - 20)
    }
    // Penetration comparison
    const bx = cx - 120, by = h - 60
    ctx.fillStyle = '#55555544'; ctx.fillRect(bx, by, 30, 30) // paper
    ctx.fillRect(bx + 40, by, 30, 30) // aluminum
    ctx.fillRect(bx + 80, by, 30, 30) // lead
    ctx.fillStyle = '#777'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Papel', bx + 15, by + 42); ctx.fillText('Alumínio', bx + 55, by + 42); ctx.fillText('Chumbo', bx + 95, by + 42)
    const stops = type === 'alpha' ? 0 : type === 'beta' ? 1 : 3
    ctx.fillStyle = '#ff444466'
    if (stops === 0) ctx.fillRect(bx - 5, by + 5, 5, 20)
    if (stops >= 1) ctx.fillRect(bx + 35, by + 5, 5, 20)
    if (stops >= 3) { ctx.fillRect(bx + 115, by + 5, 15, 20); ctx.fillStyle = '#22c55e44'; ctx.fillRect(bx + 115, by + 5, 15, 20) }
  }, [type])

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = 500; c.height = 300; let run = true
    const loop = () => { if (!run) return; draw(ctx, performance.now() / 1000); frame.current = requestAnimationFrame(loop) }
    loop(); return () => { run = false; cancelAnimationFrame(frame.current) }
  }, [draw])
  return <canvas ref={ref} className="np-canvas" />
}

// Half-life graph
function HalfLifeGraph({ halfLife }: { halfLife: number }) {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * halfLife * 5
      pts.push({ x: i, y: Math.pow(0.5, t / halfLife) * 100 })
    }
    return pts
  }, [halfLife])

  return (
    <svg viewBox="0 0 500 300" className="np-chart">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = 20 + (100 - v) * 2.5
        return <g key={v}>
          <line x1={50} y1={y} x2={480} y2={y} stroke="rgba(255,255,255,0.05)" />
          <text x={45} y={y + 3} fill="#555" fontSize="9" textAnchor="end">{v}%</text>
        </g>
      })}
      {/* Half-life markers */}
      {[1, 2, 3, 4].map(n => {
        const x = 50 + (n / 5) * 430
        return <g key={n}>
          <line x1={x} y1={20} x2={x} y2={270} stroke="rgba(78,205,196,0.1)" strokeDasharray="3" />
          <text x={x} y={285} fill="#4ecdc488" fontSize="8" textAnchor="middle">{n}t½</text>
        </g>
      })}
      {/* Curve */}
      <polyline points={points.map(p => `${50 + p.x * 4.3},${20 + (100 - p.y) * 2.5}`).join(' ')}
        fill="none" stroke="#4ecdc4" strokeWidth={2} />
      {/* Area */}
      <polygon points={`50,270 ${points.map(p => `${50 + p.x * 4.3},${20 + (100 - p.y) * 2.5}`).join(' ')} 480,270`}
        fill="url(#hlGrad)" />
      <defs>
        <linearGradient id="hlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(78,205,196,0.2)" />
          <stop offset="100%" stopColor="rgba(78,205,196,0)" />
        </linearGradient>
      </defs>
      <text x={265} y={14} fill="#888" fontSize="9" textAnchor="middle">N(t) = N₀ · (½)^(t/t½)</text>
    </svg>
  )
}

// Decay series diagram
function DecaySeries({ steps }: { steps: DecayStep[] }) {
  const [activeStep, setActiveStep] = useState(-1)
  return (
    <div className="np-decay-chain">
      {steps.map((s, i) => {
        const info = DECAY_TYPE_INFO[s.type]
        const isActive = i <= activeStep
        return (
          <div key={i} className={`np-decay-step ${isActive ? 'active' : ''}`} onClick={() => setActiveStep(i === activeStep ? -1 : i)}>
            <div className="np-isotope" style={{ borderColor: isActive ? info.color : 'rgba(255,255,255,0.1)' }}>
              <span className="np-iso-mass">{s.parentA}</span>
              <span className="np-iso-sym">{s.parent.split('-')[0]}</span>
              <span className="np-iso-z">Z={s.parentZ}</span>
            </div>
            <div className="np-decay-arrow" style={{ color: info.color }}>
              → {info.symbol}
            </div>
            {i === steps.length - 1 && (
              <div className="np-isotope final" style={{ borderColor: '#22c55e' }}>
                <span className="np-iso-mass">{s.daughterA}</span>
                <span className="np-iso-sym">{s.daughter.split('-')[0]}</span>
                <span className="np-iso-z">Z={s.daughterZ}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Fission animation
function FissionCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = 500; c.height = 280; let run = true
    const loop = () => {
      if (!run) return
      const t = (performance.now() / 1000) % 4
      ctx.clearRect(0, 0, 500, 280)
      const cx = 250, cy = 140
      if (t < 1) {
        // Neutron approaching
        ctx.beginPath(); ctx.arc(cx - 100 + t * 80, cy, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#3b82f6'; ctx.fill()
        ctx.beginPath(); ctx.arc(cx + 20, cy, 30, 0, Math.PI * 2)
        ctx.fillStyle = '#cc4400'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText('U-235', cx + 20, cy + 45)
        ctx.fillText('n', cx - 100 + t * 80, cy - 10)
      } else if (t < 2) {
        // Vibrating nucleus
        const shake = Math.sin(t * 30) * (t - 1) * 15
        const stretch = 1 + (t - 1) * 0.5
        ctx.save(); ctx.translate(cx + 20, cy); ctx.scale(stretch, 1 / stretch)
        ctx.beginPath(); ctx.arc(shake, 0, 30, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6600'; ctx.fill(); ctx.restore()
      } else if (t < 3) {
        // Split!
        const p = (t - 2)
        const d = p * 100
        // Fragment 1
        ctx.beginPath(); ctx.arc(cx - d, cy - p * 20, 20, 0, Math.PI * 2)
        ctx.fillStyle = '#cc4400'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
        ctx.fillText('Ba-141', cx - d, cy - p * 20 + 30)
        // Fragment 2
        ctx.beginPath(); ctx.arc(cx + 40 + d, cy + p * 15, 18, 0, Math.PI * 2)
        ctx.fillStyle = '#994400'; ctx.fill()
        ctx.fillText('Kr-92', cx + 40 + d, cy + p * 15 + 28)
        // Neutrons
        ctx.fillStyle = '#3b82f6'
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + 0.5
          ctx.beginPath(); ctx.arc(cx + 20 + Math.cos(a) * d * 1.5, cy + Math.sin(a) * d * 1.2, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        // Energy flash
        if (p < 0.3) {
          ctx.beginPath(); ctx.arc(cx + 20, cy, 50 * p, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,200,0,${0.5 - p})`; ctx.fill()
        }
      } else {
        ctx.fillStyle = '#4ecdc4'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
        ctx.fillText(FISSION_REACTION.equation, cx, cy)
        ctx.fillStyle = '#ff6b6b'; ctx.font = '14px sans-serif'
        ctx.fillText(`Energia: ${FISSION_REACTION.energy} MeV`, cx, cy + 25)
      }
      frame.current = requestAnimationFrame(loop)
    }
    loop(); return () => { run = false; cancelAnimationFrame(frame.current) }
  }, [])
  return <canvas ref={ref} className="np-canvas" />
}

// Fusion animation
function FusionCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = 500; c.height = 280; let run = true
    const loop = () => {
      if (!run) return
      const t = (performance.now() / 1000) % 4, cx = 250, cy = 140
      ctx.clearRect(0, 0, 500, 280)
      if (t < 1.5) {
        const p = t / 1.5, d = (1 - p) * 80
        ctx.beginPath(); ctx.arc(cx - d, cy, 18, 0, Math.PI * 2)
        ctx.fillStyle = '#3b82f6'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
        ctx.fillText('D', cx - d, cy + 28)
        ctx.beginPath(); ctx.arc(cx + d, cy, 20, 0, Math.PI * 2)
        ctx.fillStyle = '#8b5cf6'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.fillText('T', cx + d, cy + 30)
      } else if (t < 2.5) {
        const p = (t - 1.5)
        // Flash
        ctx.beginPath(); ctx.arc(cx, cy, 30 + p * 40, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,200,50,${0.6 - p * 0.5})`; ctx.fill()
        // He-4
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2)
        ctx.fillStyle = '#22c55e'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText('⁴He', cx, cy + 4)
        // Neutron
        ctx.beginPath(); ctx.arc(cx + p * 100, cy - p * 60, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#3b82f6'; ctx.fill()
        ctx.fillText('n', cx + p * 100, cy - p * 60 - 8)
      } else {
        ctx.fillStyle = '#4ecdc4'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
        ctx.fillText(FUSION_REACTION.equation, cx, cy)
        ctx.fillStyle = '#22c55e'; ctx.font = '14px sans-serif'
        ctx.fillText(`Energia: ${FUSION_REACTION.energy} MeV`, cx, cy + 25)
        ctx.fillStyle = '#f97316'; ctx.font = '10px sans-serif'
        ctx.fillText(`T necessária: ~150.000.000 °C`, cx, cy + 45)
      }
      frame.current = requestAnimationFrame(loop)
    }
    loop(); return () => { run = false; cancelAnimationFrame(frame.current) }
  }, [])
  return <canvas ref={ref} className="np-canvas" />
}

export default function NuclearPhysics({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('radio')
  const [radioType, setRadioType] = useState<'alpha' | 'beta' | 'gamma'>('alpha')
  const [selectedIsotope, setSelectedIsotope] = useState(0)
  const [decaySeries, setDecaySeries] = useState<'uranium' | 'thorium'>('uranium')

  if (!isOpen) return null

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'radio', label: 'Radioatividade', icon: '☢️' },
    { id: 'halflife', label: 'Meia-Vida', icon: '⏱️' },
    { id: 'decay', label: 'Séries de Decaimento', icon: '🔗' },
    { id: 'fission', label: 'Fissão Nuclear', icon: '💥' },
    { id: 'fusion', label: 'Fusão Nuclear', icon: '☀️' },
    { id: 'capture', label: 'Captura / β⁺', icon: '🔄' },
  ]

  return (
    <div className="np-overlay" onClick={onClose}>
      <div className="np-container" onClick={e => e.stopPropagation()}>
        <div className="np-topbar">
          <div className="np-title"><span>☢️</span><h2>Física Nuclear</h2></div>
          <div className="np-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`np-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <button className="am-close" onClick={onClose}>✕</button>
        </div>

        <div className="np-content">
          {tab === 'radio' && (
            <div className="np-section">
              <div className="np-radio-btns">
                {(['alpha', 'beta', 'gamma'] as const).map(rt => (
                  <button key={rt} className={`np-radio-btn ${radioType === rt ? 'active' : ''}`}
                    style={{ borderColor: DECAY_TYPE_INFO[rt === 'beta' ? 'beta-minus' : rt].color }}
                    onClick={() => setRadioType(rt)}>
                    {DECAY_TYPE_INFO[rt === 'beta' ? 'beta-minus' : rt].symbol} — {rt === 'alpha' ? 'Alfa' : rt === 'beta' ? 'Beta' : 'Gama'}
                  </button>
                ))}
              </div>
              <RadioCanvas type={radioType} />
              <div className="np-info-card">
                <h4>{DECAY_TYPE_INFO[radioType === 'beta' ? 'beta-minus' : radioType].desc}</h4>
                <p>Partícula emitida: <strong>{DECAY_TYPE_INFO[radioType === 'beta' ? 'beta-minus' : radioType].particle}</strong></p>
                <p>ΔZ = {DECAY_TYPE_INFO[radioType === 'beta' ? 'beta-minus' : radioType].deltaZ}, ΔA = {DECAY_TYPE_INFO[radioType === 'beta' ? 'beta-minus' : radioType].deltaA}</p>
                <div className="np-penetration">
                  <span>Poder de penetração: </span>
                  {radioType === 'alpha' && <span className="np-pen low">Baixo (bloqueado por papel)</span>}
                  {radioType === 'beta' && <span className="np-pen medium">Médio (bloqueado por alumínio)</span>}
                  {radioType === 'gamma' && <span className="np-pen high">Alto (necessita chumbo espesso)</span>}
                </div>
              </div>
            </div>
          )}

          {tab === 'halflife' && (
            <div className="np-section">
              <div className="np-isotope-selector">
                {RADIOISOTOPES.map((iso, i) => (
                  <button key={iso.symbol} className={`np-iso-btn ${selectedIsotope === i ? 'active' : ''}`}
                    onClick={() => setSelectedIsotope(i)}>
                    <span className="np-iso-name">{iso.symbol}</span>
                    <span className="np-iso-hl">{iso.halfLifeDisplay}</span>
                  </button>
                ))}
              </div>
              <HalfLifeGraph halfLife={1} />
              <div className="np-hl-info">
                <h4>{RADIOISOTOPES[selectedIsotope].name}</h4>
                <p>t½ = {RADIOISOTOPES[selectedIsotope].halfLifeDisplay}</p>
                <p>Decaimento: {RADIOISOTOPES[selectedIsotope].decayType}</p>
                <div className="np-hl-bars">
                  {[0, 1, 2, 3, 4].map(n => (
                    <div key={n} className="np-hl-bar">
                      <div className="np-hl-fill" style={{ width: `${100 * Math.pow(0.5, n)}%` }} />
                      <span>{(100 * Math.pow(0.5, n)).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'decay' && (
            <div className="np-section">
              <div className="np-series-btns">
                <button className={decaySeries === 'uranium' ? 'active' : ''} onClick={() => setDecaySeries('uranium')}>
                  Série do Urânio (U-238 → Pb-206)
                </button>
                <button className={decaySeries === 'thorium' ? 'active' : ''} onClick={() => setDecaySeries('thorium')}>
                  Série do Tório (Th-232 → Pb-208)
                </button>
              </div>
              <DecaySeries steps={decaySeries === 'uranium' ? URANIUM_SERIES : THORIUM_SERIES} />
            </div>
          )}

          {tab === 'fission' && (
            <div className="np-section">
              <h3>💥 Fissão Nuclear em Cadeia</h3>
              <p className="np-desc">U-235 absorve um nêutron térmico, torna-se instável e se divide em dois fragmentos menores, liberando 3 nêutrons e ~200 MeV de energia.</p>
              <FissionCanvas />
              <div className="np-info-card">
                <p><strong>Equação:</strong> {FISSION_REACTION.equation}</p>
                <p><strong>Energia:</strong> {FISSION_REACTION.energy} MeV por fissão</p>
                <p><strong>Reação em cadeia:</strong> Cada fissão libera {FISSION_REACTION.neutronsOut} nêutrons que podem causar novas fissões</p>
                <p><strong>Massa crítica:</strong> Quantidade mínima de material fissil para manter a reação em cadeia</p>
              </div>
            </div>
          )}

          {tab === 'fusion' && (
            <div className="np-section">
              <h3>☀️ Fusão Nuclear</h3>
              <p className="np-desc">Dois núcleos leves se fundem formando um núcleo mais pesado, liberando enorme quantidade de energia. É o processo que alimenta as estrelas.</p>
              <FusionCanvas />
              <div className="np-info-card">
                <p><strong>Equação:</strong> {FUSION_REACTION.equation}</p>
                <p><strong>Energia:</strong> {FUSION_REACTION.energy} MeV por fusão</p>
                <p><strong>Temperatura:</strong> ~150.000.000 °C (plasma)</p>
                <p><strong>Confinamento:</strong> Magnético (Tokamak) ou Inercial (laser)</p>
              </div>
            </div>
          )}

          {tab === 'capture' && (
            <div className="np-section">
              <h3>🔄 Captura Eletrônica e Emissão de Pósitron (β⁺)</h3>
              <div className="np-capture-grid">
                <div className="np-capture-card">
                  <h4>Captura Eletrônica (CE)</h4>
                  <p className="np-eq">p + e⁻ → n + ν<sub>e</sub></p>
                  <p>Um elétron da camada K é capturado pelo núcleo, convertendo um próton em nêutron.</p>
                  <p className="np-result">ΔZ = -1, ΔA = 0</p>
                </div>
                <div className="np-capture-card">
                  <h4>Emissão de Pósitron (β⁺)</h4>
                  <p className="np-eq">p → n + e⁺ + ν<sub>e</sub></p>
                  <p>Um próton se converte em nêutron, emitindo um pósitron (antimatéria do elétron).</p>
                  <p className="np-result">ΔZ = -1, ΔA = 0</p>
                </div>
                <div className="np-capture-card highlight">
                  <h4>Aniquilação e⁺ + e⁻</h4>
                  <p className="np-eq">e⁺ + e⁻ → 2γ</p>
                  <p>Pósitron encontra elétron → aniquilação mútua → 2 fótons gama de 511 keV em direções opostas.</p>
                  <p className="np-app">📱 Aplicação: PET Scan (Tomografia por Emissão de Pósitrons) na medicina nuclear</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
