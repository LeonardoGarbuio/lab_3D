// src/components/ui/ReagentPanel.tsx
// Painel de reagentes para adicionar substâncias ao laboratório
import { useState } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import { ALL_SUBSTANCES } from '../../systems/ChemistryEngine'
import './ReagentPanel.css'

interface ReagentPanelProps {
    isOpen: boolean
    onClose: () => void
}

// Categorias de reagentes
const REAGENT_CATEGORIES = {
    'Ácidos': ['HCl', 'H2SO4', 'HNO3', 'CH3COOH'],
    'Bases': ['NaOH', 'KOH', 'NH4OH', 'NaHCO3'],
    'Sais': ['NaCl', 'CuSO4', 'AgNO3'],
    'Solventes': ['H2O', 'C2H5OH', 'CH3OH'],
    'Gases': ['O2', 'CO2', 'H2'],
    'Indicadores': ['phenolphthalein', 'methyl_orange'],
}

export default function ReagentPanel({ isOpen, onClose }: ReagentPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Ácidos')
    const [selectedReagent, setSelectedReagent] = useState<string | null>(null)
    const [amount, setAmount] = useState(0.5)

    const { objects, addSubstanceToObject, selectedId } = useLabStore()

    const selectedObject = objects.find(o => o.id === selectedId)
    const canAdd = selectedObject && !selectedObject.isBroken

    const handleAddReagent = () => {
        if (!selectedReagent || !selectedId || !canAdd) return

        addSubstanceToObject(selectedId, selectedReagent, amount)
        setSelectedReagent(null)
    }

    if (!isOpen) return null

    return (
        <div className="reagent-overlay" onClick={onClose}>
            <div className="reagent-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2>🧪 Reagentes Disponíveis</h2>
                <p className="subtitle">
                    {canAdd
                        ? `Adicionar ao ${selectedObject?.type} selecionado`
                        : 'Selecione um recipiente vazio primeiro'}
                </p>

                {/* Categorias */}
                <div className="category-tabs">
                    {Object.keys(REAGENT_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Lista de reagentes */}
                <div className="reagent-grid">
                    {REAGENT_CATEGORIES[selectedCategory as keyof typeof REAGENT_CATEGORIES]?.map(formula => {
                        const substance = ALL_SUBSTANCES[formula]
                        if (!substance) return null

                        return (
                            <div
                                key={formula}
                                className={`reagent-card ${selectedReagent === formula ? 'selected' : ''}`}
                                onClick={() => setSelectedReagent(formula)}
                            >
                                <div
                                    className="reagent-color"
                                    style={{ backgroundColor: substance.color }}
                                />
                                <div className="reagent-info">
                                    <span className="reagent-name">{substance.name}</span>
                                    <span className="reagent-formula">{substance.formula}</span>
                                    <div className="reagent-tags">
                                        {substance.category === 'acid' && <span className="mini-tag acid">Ácido</span>}
                                        {substance.category === 'base' && <span className="mini-tag base">Base</span>}
                                        {substance.isFlammable && <span className="mini-tag danger">🔥</span>}
                                        {substance.isToxic && <span className="mini-tag warning">☠️</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Controles de quantidade */}
                {selectedReagent && (
                    <div className="amount-controls">
                        <h4>Quantidade</h4>
                        <div className="amount-slider">
                            <input
                                type="range"
                                min="0.1"
                                max="2"
                                step="0.1"
                                value={amount}
                                onChange={e => setAmount(parseFloat(e.target.value))}
                            />
                            <span className="amount-value">{amount.toFixed(1)} mol</span>
                        </div>

                        <div className="mass-info">
                            <span>
                                Massa: {(amount * (ALL_SUBSTANCES[selectedReagent]?.molarMass || 0)).toFixed(2)} g
                            </span>
                        </div>

                        <button
                            className="add-btn"
                            onClick={handleAddReagent}
                            disabled={!canAdd}
                        >
                            {canAdd ? '➕ Adicionar ao Recipiente' : 'Selecione um recipiente'}
                        </button>
                    </div>
                )}

                {/* Preview da substância selecionada */}
                {selectedReagent && ALL_SUBSTANCES[selectedReagent] && (
                    <div className="reagent-preview">
                        <h4>Propriedades</h4>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Massa Molar</td>
                                    <td>{ALL_SUBSTANCES[selectedReagent].molarMass} g/mol</td>
                                </tr>
                                {ALL_SUBSTANCES[selectedReagent].ph !== undefined && (
                                    <tr>
                                        <td>pH</td>
                                        <td>{ALL_SUBSTANCES[selectedReagent].ph}</td>
                                    </tr>
                                )}
                                {ALL_SUBSTANCES[selectedReagent].density && (
                                    <tr>
                                        <td>Densidade</td>
                                        <td>{ALL_SUBSTANCES[selectedReagent].density} g/cm³</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
