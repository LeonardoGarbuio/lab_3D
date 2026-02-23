// src/components/ui/ExperimentPanel.tsx
// Painel de experimentos guiados
import { useState } from 'react'
import { EXPERIMENTS } from '../../data/experiments'
import type { Experiment } from '../../data/experiments'
import './ExperimentPanel.css'

interface ExperimentPanelProps {
    isOpen: boolean
    onClose: () => void
    onStartExperiment: (experiment: Experiment) => void
}

export default function ExperimentPanel({ isOpen, onClose, onStartExperiment }: ExperimentPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)

    if (!isOpen) return null

    const filteredExperiments = selectedCategory
        ? EXPERIMENTS.filter(e => e.category === selectedCategory)
        : EXPERIMENTS

    const handleStart = () => {
        if (selectedExperiment) {
            onStartExperiment(selectedExperiment)
            onClose()
        }
    }

    return (
        <div className="experiment-overlay" onClick={onClose}>
            <div className="experiment-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2>📚 Experimentos Guiados</h2>
                <p className="subtitle">Aprenda química com experimentos passo-a-passo</p>

                {/* Filtros */}
                <div className="category-filters">
                    <button
                        className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'química' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('química')}
                    >
                        🧪 Química
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'física' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('física')}
                    >
                        ⚡ Física
                    </button>
                </div>

                {/* Lista de experimentos */}
                <div className="experiments-grid">
                    {filteredExperiments.map(exp => (
                        <div
                            key={exp.id}
                            className={`experiment-card ${selectedExperiment?.id === exp.id ? 'selected' : ''}`}
                            onClick={() => setSelectedExperiment(exp)}
                        >
                            <span className="exp-icon">{exp.icon}</span>
                            <div className="exp-info">
                                <h4>{exp.title}</h4>
                                <p>{exp.description}</p>
                                <div className="exp-meta">
                                    <span className={`difficulty ${exp.difficulty}`}>{exp.difficulty}</span>
                                    <span className="duration">⏱️ {exp.duration}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detalhes do experimento selecionado */}
                {selectedExperiment && (
                    <div className="experiment-details">
                        <h3>{selectedExperiment.icon} {selectedExperiment.title}</h3>

                        <div className="detail-section">
                            <h4>🎯 Objetivo</h4>
                            <p>{selectedExperiment.objective}</p>
                        </div>

                        <div className="detail-section">
                            <h4>📦 Materiais</h4>
                            <ul>
                                {selectedExperiment.materials.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        </div>

                        <div className="detail-section">
                            <h4>📋 Passos ({selectedExperiment.steps.length})</h4>
                            <ol>
                                {selectedExperiment.steps.map(step => (
                                    <li key={step.id}>{step.instruction}</li>
                                ))}
                            </ol>
                        </div>

                        <button className="start-btn" onClick={handleStart}>
                            ▶️ Iniciar Experimento
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
