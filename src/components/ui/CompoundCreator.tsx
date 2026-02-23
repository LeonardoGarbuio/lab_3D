// src/components/ui/CompoundCreator.tsx
// Criador de compostos a partir de elementos
import { useState } from 'react'
import { ELEMENTS, getElement, CATEGORY_COLORS } from '../../data/elements'
import type { Element } from '../../data/elements'
import './CompoundCreator.css'

interface CompoundCreatorProps {
    isOpen: boolean
    onClose: () => void
    onCreateCompound: (formula: string, name: string, color: string) => void
}

interface FormulaElement {
    element: Element
    count: number
}

// Elementos mais usados para compostos
const QUICK_ELEMENTS = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pb']

export default function CompoundCreator({ isOpen, onClose, onCreateCompound }: CompoundCreatorProps) {
    const [formulaElements, setFormulaElements] = useState<FormulaElement[]>([])
    const [compoundName, setCompoundName] = useState('')
    const [showAllElements, setShowAllElements] = useState(false)

    const addElement = (symbol: string) => {
        const element = getElement(symbol)
        if (!element) return

        setFormulaElements(prev => {
            const existing = prev.find(e => e.element.symbol === symbol)
            if (existing) {
                return prev.map(e =>
                    e.element.symbol === symbol ? { ...e, count: e.count + 1 } : e
                )
            }
            return [...prev, { element, count: 1 }]
        })
    }

    const removeElement = (symbol: string) => {
        setFormulaElements(prev => {
            const existing = prev.find(e => e.element.symbol === symbol)
            if (existing && existing.count > 1) {
                return prev.map(e =>
                    e.element.symbol === symbol ? { ...e, count: e.count - 1 } : e
                )
            }
            return prev.filter(e => e.element.symbol !== symbol)
        })
    }

    const clearFormula = () => {
        setFormulaElements([])
        setCompoundName('')
    }

    // Gerar fórmula química
    const formula = formulaElements
        .map(fe => `${fe.element.symbol}${fe.count > 1 ? fe.count : ''}`)
        .join('')

    // Calcular massa molar
    const molarMass = formulaElements.reduce(
        (sum, fe) => sum + fe.element.atomicMass * fe.count,
        0
    )

    // Gerar cor baseada nos elementos
    const generateColor = () => {
        if (formulaElements.length === 0) return '#4a90d9'

        // Média das cores dos elementos
        let r = 0, g = 0, b = 0
        formulaElements.forEach(fe => {
            const color = parseInt(fe.element.color.slice(1), 16)
            r += (color >> 16) & 255
            g += (color >> 8) & 255
            b += color & 255
        })
        const n = formulaElements.length
        r = Math.round(r / n)
        g = Math.round(g / n)
        b = Math.round(b / n)

        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
    }

    const handleCreate = () => {
        if (formulaElements.length === 0) return

        const name = compoundName || formula
        const color = generateColor()

        onCreateCompound(formula, name, color)
        clearFormula()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="creator-overlay" onClick={onClose}>
            <div className="creator-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2>⚛️ Criar Composto</h2>
                <p className="subtitle">Combine elementos para criar uma nova substância</p>

                {/* Fórmula atual */}
                <div className="formula-display">
                    <div className="formula-elements">
                        {formulaElements.length === 0 ? (
                            <span className="placeholder">Clique nos elementos abaixo...</span>
                        ) : (
                            formulaElements.map(fe => (
                                <div
                                    key={fe.element.symbol}
                                    className="formula-item"
                                    style={{
                                        backgroundColor: CATEGORY_COLORS[fe.element.category],
                                        color: '#000'
                                    }}
                                >
                                    <span className="formula-symbol">{fe.element.symbol}</span>
                                    {fe.count > 1 && <sub className="formula-count">{fe.count}</sub>}
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeElement(fe.element.symbol)}
                                    >
                                        −
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {formulaElements.length > 0 && (
                        <div className="formula-info">
                            <span className="formula-text">{formula}</span>
                            <span className="molar-mass">{molarMass.toFixed(2)} g/mol</span>
                        </div>
                    )}
                </div>

                {/* Elementos rápidos */}
                <div className="element-section">
                    <h4>Elementos Comuns</h4>
                    <div className="quick-elements">
                        {QUICK_ELEMENTS.map(symbol => {
                            const element = getElement(symbol)
                            if (!element) return null

                            const count = formulaElements.find(fe => fe.element.symbol === symbol)?.count || 0

                            return (
                                <button
                                    key={symbol}
                                    className={`element-btn ${count > 0 ? 'active' : ''}`}
                                    style={{
                                        backgroundColor: count > 0 ? CATEGORY_COLORS[element.category] : undefined,
                                        color: count > 0 ? '#000' : undefined
                                    }}
                                    onClick={() => addElement(symbol)}
                                >
                                    <span className="el-symbol">{symbol}</span>
                                    <span className="el-name">{element.namePt}</span>
                                    {count > 0 && <span className="el-count">{count}</span>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Mostrar mais elementos */}
                <button
                    className="show-more-btn"
                    onClick={() => setShowAllElements(!showAllElements)}
                >
                    {showAllElements ? '▲ Menos elementos' : '▼ Mais elementos'}
                </button>

                {showAllElements && (
                    <div className="all-elements">
                        {ELEMENTS.filter(e => !QUICK_ELEMENTS.includes(e.symbol)).map(element => (
                            <button
                                key={element.symbol}
                                className="element-mini"
                                style={{ backgroundColor: CATEGORY_COLORS[element.category] }}
                                onClick={() => addElement(element.symbol)}
                                title={element.namePt}
                            >
                                {element.symbol}
                            </button>
                        ))}
                    </div>
                )}

                {/* Nome do composto */}
                {formulaElements.length > 0 && (
                    <div className="name-input">
                        <h4>Nome do Composto (opcional)</h4>
                        <input
                            type="text"
                            placeholder="Ex: Água, Ácido Sulfúrico..."
                            value={compoundName}
                            onChange={e => setCompoundName(e.target.value)}
                        />
                    </div>
                )}

                {/* Botões de ação */}
                <div className="action-buttons">
                    <button className="clear-btn" onClick={clearFormula}>
                        🗑️ Limpar
                    </button>
                    <button
                        className="create-btn"
                        onClick={handleCreate}
                        disabled={formulaElements.length === 0}
                    >
                        ✨ Criar Composto
                    </button>
                </div>

                {/* Preview */}
                {formulaElements.length > 0 && (
                    <div className="compound-preview">
                        <div
                            className="preview-color"
                            style={{ backgroundColor: generateColor() }}
                        />
                        <div className="preview-info">
                            <span className="preview-formula">{formula}</span>
                            <span className="preview-name">{compoundName || 'Composto personalizado'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
