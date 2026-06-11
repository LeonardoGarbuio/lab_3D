import { useLabStore } from '../../stores/useLabStore'
import type { LabObject } from '../../stores/useLabStore'
import './LabHUD.css'

export default function CabinetPanel() {
    const isCabinetOpen = useLabStore(state => state.isCabinetOpen)
    const closeCabinet = useLabStore(state => state.closeCabinet)
    const addObject = useLabStore(state => state.addObject)

    if (!isCabinetOpen) return null

    const handleSpawn = (type: LabObject['type']) => {
        // Encontrar uma posição livre na bancada (x entre -3 e 3)
        // Uma heurística simples para não empilhar um em cima do outro:
        let newX = -3 + Math.random() * 6
        const newZ = 0.5 + Math.random() * 0.5

        const newObj: LabObject = {
            id: `${type}-${Date.now()}`,
            type,
            position: [newX, 1.05, newZ],
            formula: null,
            mols: 0,
            fillLevel: 0,
            color: '#4ecdc4',
            isBroken: false,
            temperature: 25,
            isHeating: false,
            isShocking: false,
            isShaking: false,
            activeEffect: 'none',
            effectColor: '#ffffff',
            effectIntensity: 1,
            ph: 7,
            concentration: 0,
            volume: 0,
            phase: 'liquid',
            boilingPoint: 100,
            freezingPoint: 0,
            isBoiling: false,
            isFreezing: false,
            density: 1.0,
            isSealed: false,
            pressure: 1.0,
            enthalpy: 0,
        }

        addObject(newObj)
        closeCabinet()
    }

    return (
        <div className="hud-modal" onClick={(e) => { if (e.target === e.currentTarget) closeCabinet() }}>
            <div className="hud-modal-content">
                <div className="hud-modal-header">
                    <h2>🗄️ Armário de Vidrarias</h2>
                    <button className="close-btn" onClick={closeCabinet}>✕</button>
                </div>
                <div className="cabinet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '20px' }}>
                    <button className="hud-btn" onClick={() => handleSpawn('beaker')}>Béquer</button>
                    <button className="hud-btn" onClick={() => handleSpawn('test-tube')}>Tubo de Ensaio</button>
                    <button className="hud-btn" onClick={() => handleSpawn('erlenmeyer')}>Erlenmeyer</button>
                    <button className="hud-btn" onClick={() => handleSpawn('roundflask')}>Balão Redondo</button>
                    <button className="hud-btn" onClick={() => handleSpawn('cylinder')}>Proveta</button>
                    <button className="hud-btn" onClick={() => handleSpawn('separating_funnel')}>Funil de Separação</button>
                    <button className="hud-btn" onClick={() => handleSpawn('pipette')}>Pipeta</button>
                </div>
                <div style={{ marginTop: '20px', color: '#888', fontSize: '0.9rem' }}>
                    *A vidraria será colocada aleatoriamente sobre a bancada central.
                </div>
            </div>
        </div>
    )
}
