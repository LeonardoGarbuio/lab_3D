// src/components/ui/AtomicModels.tsx
// Visualização dos 5 modelos atômicos históricos com Canvas 2D
import { useState, useRef, useEffect, useCallback } from 'react'
import { ATOMIC_MODELS, HYDROGEN_TRANSITIONS } from '../../data/atomicModelsData'
import './AtomicModels.css'

interface Props { isOpen: boolean; onClose: () => void }

// Canvas 2D animation for each model
function ModelCanvas({ modelId }: { modelId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const w = ctx.canvas.width, h = ctx.canvas.height
    const cx = w / 2, cy = h / 2
    ctx.clearRect(0, 0, w, h)

    if (modelId === 'dalton') {
      // Solid sphere with subtle glow
      const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, 80)
      grad.addColorStop(0, '#bbb'); grad.addColorStop(0.7, '#666'); grad.addColorStop(1, '#333')
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()
      ctx.strokeStyle = 'rgba(139,139,139,0.5)'; ctx.lineWidth = 2; ctx.stroke()
      // Label
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Esfera maciça indivisível', cx, cy + 110)
    }

    else if (modelId === 'thomson') {
      // Positive sphere with embedded electrons
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90)
      grad.addColorStop(0, 'rgba(240,192,64,0.4)'); grad.addColorStop(1, 'rgba(240,192,64,0.15)')
      ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()
      ctx.strokeStyle = 'rgba(240,192,64,0.5)'; ctx.lineWidth = 2; ctx.stroke()
      // Plus signs (positive charge)
      ctx.fillStyle = 'rgba(240,192,64,0.6)'; ctx.font = '16px sans-serif'
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.1
        const r = 50 + Math.sin(t * 0.5 + i) * 10
        ctx.fillText('+', cx + Math.cos(angle) * r - 5, cy + Math.sin(angle) * r + 5)
      }
      // Electrons (raisins)
      ctx.fillStyle = '#3b82f6'
      const electrons = [[0.3, 0.4], [-0.5, 0.2], [0.1, -0.5], [-0.3, -0.3], [0.5, -0.1], [-0.1, 0.6]]
      electrons.forEach(([ex, ey], i) => {
        const px = cx + ex * 70 + Math.sin(t * 0.8 + i) * 5
        const py = cy + ey * 70 + Math.cos(t * 0.6 + i) * 5
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'
        ctx.fillText('−', px - 3, py + 3); ctx.fillStyle = '#3b82f6'
      })
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
      ctx.fillText('"Pudim de passas"', cx, cy + 120)
    }

    else if (modelId === 'rutherford') {
      // Nucleus
      const nGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 15)
      nGrad.addColorStop(0, '#ff8c42'); nGrad.addColorStop(1, '#cc4400')
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2)
      ctx.fillStyle = nGrad; ctx.fill()
      ctx.shadowColor = '#ff6b35'; ctx.shadowBlur = 20
      ctx.fill(); ctx.shadowBlur = 0
      // Orbits (random/chaotic)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(cx, cy, 60 + i * 30, 50 + i * 20, i * 0.5, 0, Math.PI * 2)
        ctx.stroke()
      }
      // Electrons
      ctx.fillStyle = '#3b82f6'
      for (let i = 0; i < 3; i++) {
        const r = 60 + i * 30, ry = 50 + i * 20
        const angle = t * (1.5 - i * 0.3) + i * 2
        const ex = cx + Math.cos(angle) * r * Math.cos(i * 0.5) - Math.sin(angle) * ry * Math.sin(i * 0.5)
        const ey = cy + Math.cos(angle) * r * Math.sin(i * 0.5) + Math.sin(angle) * ry * Math.cos(i * 0.5)
        ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill()
        // Trail
        ctx.strokeStyle = 'rgba(59,130,246,0.15)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Núcleo denso + espaço vazio', cx, cy + 140)
    }

    else if (modelId === 'bohr') {
      // Nucleus
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'; ctx.fill()
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0
      // Shells K, L, M, N
      const shells = [
        { r: 40, n: 2, label: 'K (n=1)', color: '#ef4444' },
        { r: 70, n: 8, label: 'L (n=2)', color: '#f97316' },
        { r: 100, n: 8, label: 'M (n=3)', color: '#eab308' },
        { r: 130, n: 2, label: 'N (n=4)', color: '#22c55e' },
      ]
      shells.forEach((shell, si) => {
        // Orbit ring
        ctx.beginPath(); ctx.arc(cx, cy, shell.r, 0, Math.PI * 2)
        ctx.strokeStyle = `${shell.color}33`; ctx.lineWidth = 1.5; ctx.stroke()
        // Label
        ctx.fillStyle = `${shell.color}88`; ctx.font = '10px monospace'
        ctx.fillText(shell.label, cx + shell.r + 5, cy - 5)
        // Electrons
        ctx.fillStyle = shell.color
        for (let i = 0; i < shell.n; i++) {
          const angle = (i / shell.n) * Math.PI * 2 + t * (0.8 - si * 0.15)
          const ex = cx + Math.cos(angle) * shell.r
          const ey = cy + Math.sin(angle) * shell.r
          ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill()
        }
      })
      // Photon emission animation
      const photonT = (t * 0.3) % 6
      if (photonT > 3 && photonT < 5) {
        const p = (photonT - 3) / 2
        const fromR = 70, toR = 40
        const currentR = fromR + (toR - fromR) * p
        ctx.beginPath(); ctx.arc(cx + currentR, cy, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#06b6d4'; ctx.fill()
        ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0
        // Photon wave going out
        if (p > 0.8) {
          const px = cx + 40 + (p - 0.8) * 200
          ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.beginPath()
          for (let x = 0; x < 40; x++) {
            const wy = Math.sin(x * 0.5 + t * 3) * 6
            if (x === 0) ctx.moveTo(px + x, cy + wy); else ctx.lineTo(px + x, cy + wy)
          }
          ctx.stroke()
        }
      }
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
      ctx.fillText('Órbitas quantizadas + fóton', cx, cy + 160)
    }

    else if (modelId === 'schrodinger') {
      // Probability cloud
      const particles = 300
      for (let i = 0; i < particles; i++) {
        const seed = i * 7919 + 1
        const angle = ((seed * 13) % 1000) / 1000 * Math.PI * 2
        const angle2 = ((seed * 17) % 1000) / 1000 * Math.PI
        const baseR = ((seed * 23) % 1000) / 1000
        // 1s orbital density: higher near center
        const r = Math.pow(baseR, 0.5) * 120
        const wobble = Math.sin(t * 0.5 + i * 0.1) * 3
        const px = cx + (Math.cos(angle) * Math.sin(angle2) * r) + wobble
        const py = cy + (Math.sin(angle) * Math.sin(angle2) * r) + Math.cos(t * 0.3 + i * 0.05) * 2
        const opacity = Math.max(0.05, 1 - r / 120) * (0.3 + 0.1 * Math.sin(t + i))
        const size = 1.5 + (1 - r / 120) * 2
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(168,85,247,${opacity})`; ctx.fill()
      }
      // Nucleus dot
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()
      // |Ψ|² label
      ctx.fillStyle = '#a855f7'; ctx.font = '16px monospace'; ctx.textAlign = 'center'
      ctx.fillText('|Ψ|² = probabilidade', cx, cy + 150)
      // Orbital labels
      ctx.font = '12px monospace'; ctx.fillStyle = '#a855f766'
      ctx.fillText('Orbital 1s', cx, cy - 130)
    }
  }, [modelId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 500; canvas.height = 400
    let running = true
    const animate = () => {
      if (!running) return
      const t = performance.now() / 1000
      draw(ctx, t)
      frameRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { running = false; cancelAnimationFrame(frameRef.current) }
  }, [draw])

  return <canvas ref={canvasRef} className="am-canvas" />
}

export default function AtomicModels({ isOpen, onClose }: Props) {
  const [selected, setSelected] = useState(0)
  if (!isOpen) return null
  const model = ATOMIC_MODELS[selected]

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am-container" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="am-topbar">
          <div className="am-title">
            <span className="am-icon">⚛️</span>
            <h2>Modelos Atômicos</h2>
            <span className="am-badge">HISTÓRICO</span>
          </div>
          <button className="am-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="am-content">
          {/* Canvas */}
          <div className="am-viewport">
            <ModelCanvas modelId={model.id} />
            <div className="am-model-label">
              <span className="am-model-year">{model.year}</span>
              <span className="am-model-name">{model.name}</span>
            </div>
          </div>

          {/* Info Panel */}
          <div className="am-sidebar">
            <div className="am-scientist">
              <span className="am-sci-icon">{model.icon}</span>
              <div>
                <h3>{model.scientist}</h3>
                <p className="am-year">{model.year}</p>
              </div>
            </div>

            <div className="am-section">
              <h4>📖 Descrição</h4>
              <p>{model.descriptionPt}</p>
            </div>

            <div className="am-section insight">
              <h4>💡 Contribuição Principal</h4>
              <p>{model.keyInsight}</p>
            </div>

            <div className="am-section limitation">
              <h4>⚠️ Limitações</h4>
              <p>{model.limitations}</p>
            </div>

            <div className="am-section">
              <h4>🔬 Evidência Experimental</h4>
              <p>{model.experiment}</p>
            </div>

            {model.id === 'bohr' && (
              <div className="am-section transitions">
                <h4>🌈 Transições do Hidrogênio</h4>
                <div className="am-transitions">
                  {HYDROGEN_TRANSITIONS.map((tr, i) => (
                    <div key={i} className="am-transition">
                      <span className="am-tr-dot" style={{ background: tr.color }} />
                      <span>n={tr.from}→{tr.to}</span>
                      <span className="am-tr-series">{tr.series}</span>
                      <span className="am-tr-wave">{tr.wavelength}nm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="am-timeline">
          <div className="am-timeline-line" />
          {ATOMIC_MODELS.map((m, i) => (
            <button
              key={m.id}
              className={`am-timeline-btn ${selected === i ? 'active' : ''}`}
              onClick={() => setSelected(i)}
              style={{ '--model-color': m.color } as React.CSSProperties}
            >
              <span className="am-tl-icon">{m.icon}</span>
              <span className="am-tl-year">{m.year}</span>
              <span className="am-tl-name">{m.scientist.split(' ').pop()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
