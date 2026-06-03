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
          <h3>Dados do Átomo</h3>
          <p><strong>Alvo:</strong> {activeQuantumFormula || 'Desconhecido'}</p>
          <p><strong>Nuvem de Probabilidade:</strong> Ativada</p>
          <p><strong>Escala:</strong> ~10⁻¹⁰ metros</p>
          <p className="qz-hud-desc">
            Você está visualizando a densidade de probabilidade de encontrar um elétron (Equação de Schrödinger).
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
