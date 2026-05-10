// src/components/ui/ElectronConfig.tsx
import { useState, useMemo } from 'react'
import { PP } from '../../data/periodicPropertiesData'
import './ElectronConfig.css'

interface Props { isOpen: boolean; onClose: () => void }

// Orbital order (Aufbau/Pauling diagonal)
const ORBITAL_ORDER = [
  '1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p','6s','4f','5d','6p','7s','5f','6d','7p'
]
const ORBITAL_MAX: Record<string,number> = { s:2, p:6, d:10, f:14 }
const ORBITAL_TYPE = (o: string) => o.slice(-1)

// Generate electron config for Z
function generateConfig(z: number): { orbital: string; electrons: number }[] {
  let remaining = z
  const config: { orbital: string; electrons: number }[] = []
  for (const orb of ORBITAL_ORDER) {
    if (remaining <= 0) break
    const type = ORBITAL_TYPE(orb)
    const max = ORBITAL_MAX[type]
    const fill = Math.min(remaining, max)
    config.push({ orbital: orb, electrons: fill })
    remaining -= fill
  }
  return config
}

// Generate orbital boxes for Hund's rule visualization
function getOrbitalBoxes(orbital: string, electrons: number) {
  const type = ORBITAL_TYPE(orbital)
  const numBoxes = ORBITAL_MAX[type] / 2
  const boxes: ('empty' | 'up' | 'pair')[] = Array(numBoxes).fill('empty')
  // Hund's rule: fill with spin-up first, then pair
  let remaining = electrons
  // First pass: one up in each
  for (let i = 0; i < numBoxes && remaining > 0; i++) {
    boxes[i] = 'up'; remaining--
  }
  // Second pass: pair up
  for (let i = 0; i < numBoxes && remaining > 0; i++) {
    boxes[i] = 'pair'; remaining--
  }
  return boxes
}

// Interactive Pauli validator
function PauliValidator() {
  const [box1, setBox1] = useState(0) // 0=empty, 1=up, 2=pair, 3=INVALID(3 arrows)
  const [showError, setShowError] = useState(false)

  const tryAdd = () => {
    if (box1 < 2) { setBox1(box1 + 1); setShowError(false) }
    else { setShowError(true); setTimeout(() => setShowError(false), 1500) }
  }
  const reset = () => { setBox1(0); setShowError(false) }

  return (
    <div className="ec-pauli">
      <h4>🚫 Princípio de Exclusão de Pauli</h4>
      <p className="ec-pauli-desc">Máximo 2 elétrons por orbital, com spins opostos (↑↓)</p>
      <div className="ec-pauli-demo">
        <div className={`ec-box-large ${showError ? 'error shake' : ''}`} onClick={tryAdd}>
          {box1 === 0 && <span className="ec-box-empty">⬜</span>}
          {box1 === 1 && <span className="ec-arrow up">↑</span>}
          {box1 === 2 && <><span className="ec-arrow up">↑</span><span className="ec-arrow down">↓</span></>}
        </div>
        <div className="ec-pauli-btns">
          <button onClick={tryAdd} className="ec-add-btn">+ Adicionar e⁻</button>
          <button onClick={reset} className="ec-reset-btn">Resetar</button>
        </div>
        {showError && (
          <div className="ec-error-msg">
            🚫 BLOQUEADO! Violação do Princípio de Pauli — máximo 2 elétrons por orbital!
          </div>
        )}
        {box1 === 2 && !showError && (
          <div className="ec-success-msg">✅ Orbital completo: spins antiparalelos (↑↓)</div>
        )}
      </div>
    </div>
  )
}

export default function ElectronConfig({ isOpen, onClose }: Props) {
  const [selectedZ, setSelectedZ] = useState(26) // Iron
  const [showPauling, setShowPauling] = useState(true)

  const config = useMemo(() => generateConfig(selectedZ), [selectedZ])
  const element = useMemo(() => PP.find(p => p.z === selectedZ), [selectedZ])

  if (!isOpen) return null

  // Pauling diagonal visualization
  const diagonalRows = [
    [['1s']],
    [['2s'],['2p']],
    [['3s'],['3p']],
    [['4s'],['3d'],['4p']],
    [['5s'],['4d'],['5p']],
    [['6s'],['4f'],['5d'],['6p']],
    [['7s'],['5f'],['6d'],['7p']],
  ]

  // Which orbitals are filled
  const filledOrbitals = new Map(config.map(c => [c.orbital, c.electrons]))

  return (
    <div className="ec-overlay" onClick={onClose}>
      <div className="ec-container" onClick={e => e.stopPropagation()}>
        <div className="ec-topbar">
          <div className="ec-header">
            <span>⚡</span>
            <h2>Configuração Eletrônica</h2>
            <span className="ec-badge">PAULING · HUND · AUFBAU</span>
          </div>
          <div className="ec-controls">
            <button className={`ec-toggle ${showPauling ? 'active' : ''}`} onClick={() => setShowPauling(!showPauling)}>
              {showPauling ? '📐 Diagonal' : '📦 Caixas'}
            </button>
            <button className="am-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="ec-content">
          {/* Element selector */}
          <div className="ec-selector">
            <h3>Selecionar Elemento</h3>
            <div className="ec-element-grid">
              {PP.filter(p => p.z <= 36).map(p => (
                <button
                  key={p.z}
                  className={`ec-el-btn ${selectedZ === p.z ? 'active' : ''}`}
                  onClick={() => setSelectedZ(p.z)}
                >
                  <span className="ec-el-z">{p.z}</span>
                  <span className="ec-el-sym">{p.sym}</span>
                </button>
              ))}
            </div>
            <div className="ec-element-grid secondary">
              {PP.filter(p => p.z > 36 && p.z <= 56).map(p => (
                <button key={p.z} className={`ec-el-btn ${selectedZ === p.z ? 'active' : ''}`}
                  onClick={() => setSelectedZ(p.z)}>
                  <span className="ec-el-z">{p.z}</span>
                  <span className="ec-el-sym">{p.sym}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main visualization */}
          <div className="ec-main">
            {/* Element info header */}
            <div className="ec-element-info">
              <span className="ec-big-z">{selectedZ}</span>
              <div>
                <h3>{element?.sym}</h3>
                <p className="ec-config-text">{element?.config}</p>
              </div>
            </div>

            {showPauling ? (
              /* Pauling Diagonal */
              <div className="ec-pauling">
                <h4>📐 Diagrama de Linus Pauling (Ordem de Aufbau)</h4>
                <div className="ec-diagonal">
                  {diagonalRows.map((row, ri) => (
                    <div key={ri} className="ec-diag-row">
                      {row.map((orbitals, ci) => (
                        <div key={ci} className="ec-diag-group">
                          {orbitals.map(orb => {
                            const filled = filledOrbitals.get(orb) || 0
                            const max = ORBITAL_MAX[ORBITAL_TYPE(orb)]
                            const isFull = filled === max
                            const isPartial = filled > 0 && !isFull
                            return (
                              <div key={orb} className={`ec-orbital-pill ${isFull ? 'full' : isPartial ? 'partial' : 'empty'}`}>
                                <span className="ec-orb-name">{orb}</span>
                                <span className="ec-orb-count">{filled > 0 ? `${filled}` : ''}</span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      {/* Diagonal arrow */}
                      {ri < 6 && <div className="ec-diag-arrow">↙</div>}
                    </div>
                  ))}
                </div>
                <p className="ec-order-text">
                  Ordem: {config.map(c => `${c.orbital}${toSuperscript(c.electrons)}`).join(' ')}
                </p>
              </div>
            ) : (
              /* Hund's Rule Boxes */
              <div className="ec-hund">
                <h4>📦 Diagrama de Caixas (Regra de Hund)</h4>
                <div className="ec-boxes-container">
                  {config.map(c => {
                    const boxes = getOrbitalBoxes(c.orbital, c.electrons)
                    return (
                      <div key={c.orbital} className="ec-orbital-group">
                        <div className="ec-boxes-row">
                          {boxes.map((box, i) => (
                            <div key={i} className={`ec-box ${box}`}>
                              {box === 'up' && <span className="ec-arrow up">↑</span>}
                              {box === 'pair' && (
                                <><span className="ec-arrow up">↑</span><span className="ec-arrow down">↓</span></>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="ec-orbital-label">{c.orbital}{toSuperscript(c.electrons)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="ec-hund-rule">
                  Regra de Hund: preencher com spins paralelos (↑) primeiro, depois parear (↑↓)
                </p>
              </div>
            )}

            {/* Pauli Exclusion */}
            <PauliValidator />
          </div>
        </div>
      </div>
    </div>
  )
}

function toSuperscript(n: number): string {
  const sup: Record<string, string> = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','10':'¹⁰','11':'¹¹','12':'¹²','13':'¹³','14':'¹⁴'}
  return sup[String(n)] || String(n)
}
