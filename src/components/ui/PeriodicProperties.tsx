// src/components/ui/PeriodicProperties.tsx
import { useState, useMemo } from 'react'
import { PP, PERIOD_COLORS } from '../../data/periodicPropertiesData'
import './PeriodicProperties.css'

interface Props { isOpen: boolean; onClose: () => void }

type TabType = 'radius' | 'ie' | 'en' | 'ea' | 'compare'

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'radius', label: 'Raio Atômico', icon: '⭕' },
  { id: 'ie', label: 'Energia de Ionização', icon: '⚡' },
  { id: 'en', label: 'Eletronegatividade', icon: '🧲' },
  { id: 'ea', label: 'Afinidade Eletrônica', icon: '🎯' },
  { id: 'compare', label: 'EN Comparada', icon: '📊' },
]

function getPeriod(z: number): number {
  if (z <= 2) return 1; if (z <= 10) return 2; if (z <= 18) return 3
  if (z <= 36) return 4; if (z <= 54) return 5; if (z <= 86) return 6; return 7
}

// SVG bar chart
function BarChart({ data, yLabel, unit, colorBy }: {
  data: { z: number; sym: string; val: number }[]; yLabel: string; unit: string; colorBy: 'period' | 'value'
}) {
  const [hover, setHover] = useState<number | null>(null)
  const maxVal = Math.max(...data.map(d => d.val))
  const W = 900, H = 350, padL = 50, padB = 30, padT = 20, padR = 10
  const chartW = W - padL - padR, chartH = H - padB - padT
  const barW = Math.max(2, (chartW / data.length) - 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart">
      {/* Y axis */}
      <text x={padL - 5} y={padT - 5} fill="#888" fontSize="10" textAnchor="end">{yLabel} ({unit})</text>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = padT + chartH * (1 - f)
        return <g key={f}>
          <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.05)" />
          <text x={padL - 4} y={y + 3} fill="#555" fontSize="8" textAnchor="end">
            {Math.round(maxVal * f)}
          </text>
        </g>
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = padL + (i / data.length) * chartW
        const h = (d.val / maxVal) * chartH
        const y = padT + chartH - h
        const period = getPeriod(d.z)
        const color = colorBy === 'period'
          ? PERIOD_COLORS[period - 1]
          : `hsl(${(d.val / maxVal) * 200 + 160}, 70%, 55%)`
        const isHovered = hover === i
        return <g key={d.z} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <rect x={x} y={y} width={barW} height={h}
            fill={color} opacity={isHovered ? 1 : 0.7} rx={1}
            style={{ transition: 'opacity 0.15s' }} />
          {isHovered && <>
            <rect x={x - 30} y={y - 38} width={70} height={34} fill="rgba(0,0,0,0.9)"
              rx={4} stroke="rgba(78,205,196,0.3)" />
            <text x={x + 5} y={y - 22} fill="#4ecdc4" fontSize="10" fontWeight="700">{d.sym} (Z={d.z})</text>
            <text x={x + 5} y={y - 10} fill="#ddd" fontSize="9">{d.val} {unit}</text>
          </>}
          {/* X labels (every 10) */}
          {d.z % 10 === 0 && <text x={x + barW / 2} y={H - 5} fill="#555" fontSize="7" textAnchor="middle">{d.z}</text>}
        </g>
      })}
      {/* Noble gas labels */}
      {[2, 10, 18, 36, 54, 86].map(z => {
        const idx = data.findIndex(d => d.z === z)
        if (idx < 0) return null
        const x = padL + (idx / data.length) * chartW
        return <text key={z} x={x} y={padT - 3} fill="#4ecdc488" fontSize="7" textAnchor="middle">
          {data[idx].sym}
        </text>
      })}
    </svg>
  )
}

// Line chart for EN comparison
function ENCompareChart() {
  const [hover, setHover] = useState<number | null>(null)
  const data = PP.filter(p => p.z <= 86 && p.pauling !== null)
  const W = 900, H = 350, padL = 50, padB = 30, padT = 20, padR = 10
  const chartW = W - padL - padR, chartH = H - padB - padT
  const maxEN = 4.2

  const scales: { key: 'pauling' | 'mulliken' | 'allred'; label: string; color: string }[] = [
    { key: 'pauling', label: 'Pauling', color: '#ef4444' },
    { key: 'mulliken', label: 'Mulliken', color: '#3b82f6' },
    { key: 'allred', label: 'Allred-Rochow', color: '#22c55e' },
  ]

  return (
    <div className="pp-compare">
      <div className="pp-legend">
        {scales.map(s => (
          <span key={s.key} className="pp-legend-item">
            <span className="pp-legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart">
        {/* Grid */}
        {[0, 1, 2, 3, 4].map(v => {
          const y = padT + chartH * (1 - v / maxEN)
          return <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={padL - 4} y={y + 3} fill="#555" fontSize="8" textAnchor="end">{v}</text>
          </g>
        })}
        {/* Lines */}
        {scales.map(scale => {
          const points = data
            .filter(d => d[scale.key] !== null)
            .map(d => {
              const x = padL + ((d.z - 1) / 86) * chartW
              const y = padT + chartH * (1 - (d[scale.key]! / maxEN))
              return `${x},${y}`
            })
          return <polyline key={scale.key} points={points.join(' ')}
            fill="none" stroke={scale.color} strokeWidth={1.5} opacity={0.8} />
        })}
        {/* Hover dots */}
        {data.map((d, i) => {
          const x = padL + ((d.z - 1) / 86) * chartW
          return <rect key={d.z} x={x - 4} y={padT} width={8} height={chartH}
            fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        })}
        {hover !== null && (() => {
          const d = data[hover]
          const x = padL + ((d.z - 1) / 86) * chartW
          return <>
            <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="rgba(255,255,255,0.2)" strokeDasharray="3" />
            <rect x={x - 40} y={padT} width={90} height={55} fill="rgba(0,0,0,0.9)" rx={4}
              stroke="rgba(78,205,196,0.3)" />
            <text x={x - 35} y={padT + 14} fill="#4ecdc4" fontSize="10" fontWeight="700">{d.sym} (Z={d.z})</text>
            {d.pauling && <text x={x - 35} y={padT + 26} fill="#ef4444" fontSize="8">P: {d.pauling}</text>}
            {d.mulliken && <text x={x - 35} y={padT + 36} fill="#3b82f6" fontSize="8">M: {d.mulliken}</text>}
            {d.allred && <text x={x - 35} y={padT + 46} fill="#22c55e" fontSize="8">AR: {d.allred}</text>}
          </>
        })()}
        {/* X labels */}
        {data.filter(d => d.z % 10 === 0).map(d => {
          const x = padL + ((d.z - 1) / 86) * chartW
          return <text key={d.z} x={x} y={H - 5} fill="#555" fontSize="7" textAnchor="middle">{d.z}</text>
        })}
      </svg>
    </div>
  )
}

export default function PeriodicProperties({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<TabType>('radius')

  const radiusData = useMemo(() => PP.filter(p => p.radius !== null).map(p => ({ z: p.z, sym: p.sym, val: p.radius! })), [])
  const ieData = useMemo(() => PP.filter(p => p.ie !== null).map(p => ({ z: p.z, sym: p.sym, val: p.ie! })), [])
  const enData = useMemo(() => PP.filter(p => p.pauling !== null).map(p => ({ z: p.z, sym: p.sym, val: p.pauling! })), [])
  const eaData = useMemo(() => PP.filter(p => p.ea !== null && p.ea > 0).map(p => ({ z: p.z, sym: p.sym, val: p.ea! })), [])

  const trendInfo: Record<TabType, { period: string; group: string }> = {
    radius: { period: '← Diminui ao longo do período', group: '↓ Aumenta no grupo' },
    ie: { period: '→ Aumenta ao longo do período', group: '↑ Diminui no grupo' },
    en: { period: '→ Aumenta ao longo do período', group: '↑ Diminui no grupo' },
    ea: { period: '→ Geralmente aumenta no período', group: '↑ Diminui no grupo' },
    compare: { period: 'Comparação entre 3 escalas', group: '' },
  }

  if (!isOpen) return null;

  return (
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-container" onClick={e => e.stopPropagation()}>
        <div className="pp-topbar">
          <div className="pp-title">
            <span>📈</span>
            <h2>Propriedades Periódicas</h2>
          </div>
          <div className="pp-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`pp-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
          <button className="am-close" onClick={onClose}>✕</button>
        </div>

        <div className="pp-content">
          {/* Trend arrows */}
          <div className="pp-trends">
            <span className="pp-trend period">{trendInfo[tab].period}</span>
            {trendInfo[tab].group && <span className="pp-trend group">{trendInfo[tab].group}</span>}
          </div>

          {/* Charts */}
          <div className="pp-chart-area">
            {tab === 'radius' && <BarChart data={radiusData} yLabel="Raio Atômico" unit="pm" colorBy="period" />}
            {tab === 'ie' && <BarChart data={ieData} yLabel="1ª Energia de Ionização" unit="kJ/mol" colorBy="period" />}
            {tab === 'en' && <BarChart data={enData} yLabel="Eletronegatividade (Pauling)" unit="" colorBy="value" />}
            {tab === 'ea' && <BarChart data={eaData} yLabel="Afinidade Eletrônica" unit="kJ/mol" colorBy="period" />}
            {tab === 'compare' && <ENCompareChart />}
          </div>
        </div>
      </div>
    </div>
  )
}
