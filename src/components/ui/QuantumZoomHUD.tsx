// src/components/ui/QuantumZoomHUD.tsx
import { useState, useEffect } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import './QuantumZoomHUD.css'

export default function QuantumZoomHUD() {
  const isQuantumZoomOpen = useLabStore(state => state.isQuantumZoomOpen)
  const closeQuantumZoom = useLabStore(state => state.closeQuantumZoom)
  const activeQuantumFormula = useLabStore(state => state.activeQuantumFormula)
  
  const [photonData, setPhotonData] = useState<{ energy: string, wavelength: string } | null>(null)
  const [flash, setFlash] = useState(false)

  // Subatomic dive entry effect
  useEffect(() => {
    if (isQuantumZoomOpen) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 800)
      return () => clearTimeout(timer)
    }
  }, [isQuantumZoomOpen])

  if (!isQuantumZoomOpen) return null

  // Extract primary element from formula
  const match = activeQuantumFormula?.match(/^[A-Z][a-z]?/)
  const symbol = match ? match[0] : 'H'

  const atomicNumbers: Record<string, number> = {
      'H': 1, 'He': 2, 'Li': 3, 'Be': 4, 'B': 5, 'C': 6, 'N': 7, 'O': 8, 'F': 9, 'Ne': 10,
      'Na': 11, 'Mg': 12, 'Al': 13, 'Si': 14, 'P': 15, 'S': 16, 'Cl': 17, 'Ar': 18,
      'K': 19, 'Ca': 20, 'Fe': 26, 'Cu': 29, 'Zn': 30, 'Ag': 47, 'Au': 79, 'Hg': 80, 'Pb': 82, 'U': 92
  }
  
  const Z = atomicNumbers[symbol] || 1
  const neutrons = Math.round(Z * 1.2) // approximation
  
  const getElectronShells = (z: number) => {
    const shells = []
    let remaining = z
    const maxShells = [2, 8, 18, 32, 32, 18, 8]
    for (let max of maxShells) {
      if (remaining <= 0) break
      const fill = Math.min(remaining, max)
      shells.push(fill)
      remaining -= fill
    }
    return shells
  }
  
  const shells = getElectronShells(Z)
  const shellLabels = ['K', 'L', 'M', 'N', 'O', 'P', 'Q']
  const shellDistribution = shells.map((count, i) => `${shellLabels[i]}=${count}`).join(', ')

  const handleQuantumLeap = () => {
    // Disparar evento para o componente 3D
    window.dispatchEvent(new Event('trigger-quantum-leap'))
    
    // Gerar dados do fóton aleatório (simplificado para demonstração visual)
    const wavelengths = [
      { wl: '656 nm (Vermelho)', e: '1.89 eV', type: 'Balmer H-alfa' },
      { wl: '486 nm (Ciano)', e: '2.55 eV', type: 'Balmer H-beta' },
      { wl: '434 nm (Azul)', e: '2.86 eV', type: 'Balmer H-gama' },
      { wl: '122 nm (UV)', e: '10.2 eV', type: 'Lyman-alfa' }
    ]
    const randomLeap = wavelengths[Math.floor(Math.random() * wavelengths.length)]
    
    setPhotonData({ energy: randomLeap.e, wavelength: randomLeap.wl })
    
    setTimeout(() => setPhotonData(null), 4000)
  }

  return (
    <div className="quantum-zoom-hud-overlay">
      {flash && <div className="subatomic-warp-flash"></div>}
      
      <div className="qz-hud-header">
        <div className="qz-hud-title">
          <span className="qz-icon">⚛️</span>
          <h2>Mergulho Subatômico</h2>
          <span className="qz-badge">FASE 3</span>
        </div>
        <button className="qz-hud-close" onClick={closeQuantumZoom}>✕ Sair do Zoom</button>
      </div>

      <div className="qz-hud-content">
        <div className="qz-hud-panel left-panel">
          <h3>Dados do Átomo Alvo ({symbol})</h3>
          <p><strong>Número Atômico (Z):</strong> {Z} Prótons</p>
          <p><strong>Nêutrons:</strong> ~{neutrons}</p>
          <p><strong>Total de Elétrons:</strong> {Z}</p>
          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,255,255,0.1)', borderRadius: '4px', borderLeft: '3px solid #00ffff' }}>
            <p style={{ margin: 0 }}><strong>Distribuição de Bohr:</strong></p>
            <p style={{ margin: '0.2rem 0 0 0', fontFamily: 'monospace', color: '#00ffff' }}>[{shellDistribution}]</p>
          </div>
          <p style={{ marginTop: '1rem' }}><strong>Nuvem de Probabilidade:</strong> Ativada</p>
          <p><strong>Escala:</strong> ~10⁻¹⁰ metros</p>
          <p className="qz-hud-desc">
            Você está visualizando a densidade de probabilidade de encontrar um elétron usando a aproximação de Schrödinger e o modelo em camadas de Bohr.
          </p>
        </div>

        <div className="qz-hud-panel right-panel">
          <h3>Controles Quânticos</h3>
          <button className="qz-hud-btn" onClick={handleQuantumLeap}>
            ⚡ Excitar Elétron
          </button>
          <p className="qz-hud-desc">
            Injeta energia no átomo forçando um elétron a saltar para um orbital externo e depois decair, emitindo um fóton.
          </p>
          
          {photonData && (
            <div className="qz-photon-alert">
              <h4>🌈 Fóton Emitido!</h4>
              <p>Energia: {photonData.energy}</p>
              <p>Comprimento de onda: {photonData.wavelength}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
