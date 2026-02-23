// src/components/ui/PeriodicTable.tsx
// Tabela periódica interativa - Clique direto adiciona ao béquer
import { useState } from 'react'
import { ELEMENTS, CATEGORY_COLORS } from '../../data/elements'
import type { Element } from '../../data/elements'
import { useLabStore } from '../../stores/useLabStore'
import './PeriodicTable.css'

export default function PeriodicTable() {
    const [hoveredElement, setHoveredElement] = useState<Element | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const {
        isPeriodicTableOpen,
        closePeriodicTable,
        selectedId,
        objects,
        addElementToObject
    } = useLabStore()

    const selectedObject = objects.find(o => o.id === selectedId)
    const canAdd = selectedObject && !selectedObject.isBroken

    if (!isPeriodicTableOpen) return null

    // Criar grid da tabela
    const grid: (Element | null)[][] = Array.from({ length: 10 }, () =>
        Array.from({ length: 18 }, () => null)
    )

    // Posicionar elementos
    ELEMENTS.forEach(element => {
        let row = element.period - 1
        let col = element.group - 1

        // Ajustar lantanídeos e actinídeos
        if (element.category === 'lanthanide') {
            row = 8
            col = element.atomicNumber - 57 + 2
        } else if (element.category === 'actinide') {
            row = 9
            col = element.atomicNumber - 89 + 2
        }

        if (row < 10 && col < 18) {
            grid[row][col] = element
        }
    })

    const categories = [
        { id: 'alkali-metal', name: 'Metais Alcalinos' },
        { id: 'alkaline-earth', name: 'Alcalino-terrosos' },
        { id: 'transition-metal', name: 'Transição' },
        { id: 'nonmetal', name: 'Não-metais' },
        { id: 'halogen', name: 'Halogênios' },
        { id: 'noble-gas', name: 'Gases Nobres' },
    ]

    const handleSelectElement = (element: Element) => {
        if (!canAdd) return

        addElementToObject(selectedId!, element)
        closePeriodicTable()
    }

    return (
        <div className="periodic-overlay" onClick={closePeriodicTable}>
            <div className="periodic-container" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={closePeriodicTable}>✕</button>

                <h2>⚛️ Tabela Periódica</h2>
                <p className="subtitle">
                    {canAdd
                        ? `Clique em um elemento para adicionar ao ${selectedObject?.type}`
                        : '⚠️ Selecione um béquer vazio primeiro!'}
                </p>

                {/* Filtros de categoria */}
                <div className="category-filters">
                    <button
                        className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            style={{
                                backgroundColor: selectedCategory === cat.id
                                    ? CATEGORY_COLORS[cat.id]
                                    : 'transparent',
                                borderColor: CATEGORY_COLORS[cat.id]
                            }}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid da tabela */}
                <div className="periodic-grid">
                    {grid.map((row, rowIndex) => (
                        <div key={rowIndex} className="periodic-row">
                            {row.map((element, colIndex) => {
                                if (!element) {
                                    return <div key={colIndex} className="element-cell empty" />
                                }

                                const isFiltered = selectedCategory && element.category !== selectedCategory
                                const isClickable = canAdd && !isFiltered

                                return (
                                    <div
                                        key={element.symbol}
                                        className={`element-cell ${isFiltered ? 'filtered' : ''} ${isClickable ? 'clickable' : ''}`}
                                        style={{
                                            backgroundColor: CATEGORY_COLORS[element.category],
                                            opacity: isFiltered ? 0.2 : 1
                                        }}
                                        onMouseEnter={() => setHoveredElement(element)}
                                        onMouseLeave={() => setHoveredElement(null)}
                                        onClick={() => isClickable && handleSelectElement(element)}
                                    >
                                        <span className="atomic-number">{element.atomicNumber}</span>
                                        <span className="symbol">{element.symbol}</span>
                                        <span className="name">{element.namePt}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Info do elemento hover */}
                {hoveredElement && (
                    <div className="element-info">
                        <div className="info-header" style={{ backgroundColor: CATEGORY_COLORS[hoveredElement.category] }}>
                            <span className="big-symbol">{hoveredElement.symbol}</span>
                            <div>
                                <h3>{hoveredElement.namePt}</h3>
                                <span className="english-name">({hoveredElement.name})</span>
                            </div>
                        </div>
                        <div className="info-body">
                            <div className="info-row">
                                <span>Número Atômico</span>
                                <span>{hoveredElement.atomicNumber}</span>
                            </div>
                            <div className="info-row">
                                <span>Massa Atômica</span>
                                <span>{hoveredElement.atomicMass} u</span>
                            </div>
                            <div className="info-row">
                                <span>Estado (25°C)</span>
                                <span>{hoveredElement.phase === 'solid' ? 'Sólido' : hoveredElement.phase === 'liquid' ? 'Líquido' : 'Gás'}</span>
                            </div>
                            {hoveredElement.electronegativity && (
                                <div className="info-row">
                                    <span>Eletronegatividade</span>
                                    <span>{hoveredElement.electronegativity}</span>
                                </div>
                            )}
                            {canAdd && (
                                <div className="click-hint">
                                    Clique para adicionar
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
