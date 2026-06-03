// src/components/ui/SafetyWarnings.tsx
// Componente de avisos de segurança em tempo real

import { useState, useEffect } from 'react'
import {
    type SafetyWarning,
    type HazardLevel,
    getHazardColor,
    sortWarningsByPriority
} from '../../systems/SafetySystem'
import './SafetyWarnings.css'

interface SafetyWarningsProps {
    warnings: SafetyWarning[]
    onDismiss?: (id: string) => void
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    maxVisible?: number
}

export function SafetyWarnings({
    warnings,
    onDismiss,
    position = 'top-right',
    maxVisible = 5
}: SafetyWarningsProps) {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Filtrar e ordenar avisos
    const visibleWarnings = sortWarningsByPriority(
        warnings.filter(w => !dismissedIds.has(w.id))
    ).slice(0, maxVisible)

    // Limpar avisos antigos
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setDismissedIds(prev => {
                const newSet = new Set(prev)
                warnings.forEach(w => {
                    // Auto-dismiss avisos 'caution' após 30 segundos
                    if (w.level === 'caution' && now - w.timestamp > 30000) {
                        newSet.add(w.id)
                    }
                })
                return newSet
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [warnings])

    function handleDismiss(id: string) {
        setDismissedIds(prev => new Set([...prev, id]))
        onDismiss?.(id)
    }

    if (visibleWarnings.length === 0) return null

    return (
        <div className={`safety-warnings ${position}`}>
            {/* Indicador de nível geral */}
            <div className="safety-indicator" style={{
                backgroundColor: getHazardColor(visibleWarnings[0]?.level || 'safe')
            }}>
                <span className="safety-indicator-pulse" style={{
                    backgroundColor: getHazardColor(visibleWarnings[0]?.level || 'safe')
                }} />
                <span className="safety-indicator-count">{visibleWarnings.length}</span>
            </div>

            {/* Lista de avisos */}
            <div className="safety-warnings-list">
                {visibleWarnings.map((warning, index) => (
                    <WarningCard
                        key={warning.id}
                        warning={warning}
                        isExpanded={expandedId === warning.id}
                        onToggle={() => setExpandedId(
                            expandedId === warning.id ? null : warning.id
                        )}
                        onDismiss={warning.level !== 'critical' ? () => handleDismiss(warning.id) : undefined}
                        style={{
                            animationDelay: `${index * 0.1}s`
                        }}
                    />
                ))}
            </div>

            {/* Aviso de mais itens */}
            {warnings.length > maxVisible && (
                <div className="safety-more-indicator">
                    +{warnings.length - maxVisible} avisos adicionais
                </div>
            )}
        </div>
    )
}

interface WarningCardProps {
    warning: SafetyWarning
    isExpanded: boolean
    onToggle: () => void
    onDismiss?: () => void
    style?: React.CSSProperties
}

function WarningCard({ warning, isExpanded, onToggle, onDismiss, style }: WarningCardProps) {
    const color = getHazardColor(warning.level)
    const isCritical = warning.level === 'critical' || warning.level === 'danger'

    return (
        <div
            className={`warning-card level-${warning.level} ${isExpanded ? 'expanded' : ''}`}
            style={{
                ...style,
                borderColor: color,
                boxShadow: isCritical ? `0 0 20px ${color}40` : undefined
            }}
            onClick={onToggle}
        >
            {/* Cabeçalho */}
            <div className="warning-header">
                <span className="warning-icon">{warning.icon}</span>
                <span className="warning-title">{warning.title}</span>
                <span className="warning-level-badge" style={{ backgroundColor: color }}>
                    {warning.level.toUpperCase()}
                </span>
                {onDismiss && (
                    <button
                        className="warning-dismiss"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDismiss()
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Conteúdo expandido */}
            {isExpanded && (
                <div className="warning-content">
                    <p className="warning-message">{warning.message}</p>
                    {warning.action && (
                        <div className="warning-action">
                            <span className="action-icon">💡</span>
                            <span className="action-text">{warning.action}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Barra de progresso para avisos auto-dismiss */}
            {warning.level === 'caution' && (
                <div className="warning-timer-bar" />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// Componente de EPI
// ═══════════════════════════════════════════════════════════════════════

interface PPEIndicatorProps {
    required: string[]
    equipped: string[]
}

export function PPEIndicator({ required, equipped }: PPEIndicatorProps) {
    const ppeIcons: Record<string, { icon: string; name: string }> = {
        'goggles': { icon: '🥽', name: 'Óculos' },
        'gloves': { icon: '🧤', name: 'Luvas' },
        'labcoat': { icon: '🥼', name: 'Jaleco' },
        'ventilation': { icon: '🌬️', name: 'Ventilação' },
        'respirator': { icon: '😷', name: 'Respirador' },
        'no-water': { icon: '🚫💧', name: 'Sem água' },
        'no-sparks': { icon: '🚫⚡', name: 'Sem faíscas' },
        'fire-extinguisher-D': { icon: '🧯', name: 'Extintor classe D' }
    }

    return (
        <div className="ppe-indicator">
            <div className="ppe-title">Equipamentos Necessários:</div>
            <div className="ppe-list">
                {required.map(ppe => {
                    const info = ppeIcons[ppe] || { icon: '❓', name: ppe }
                    const isEquipped = equipped.includes(ppe)

                    return (
                        <div
                            key={ppe}
                            className={`ppe-item ${isEquipped ? 'equipped' : 'missing'}`}
                            title={info.name}
                        >
                            <span className="ppe-icon">{info.icon}</span>
                            <span className="ppe-status">
                                {isEquipped ? '✓' : '✗'}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// Indicador de Nível de Segurança Geral
// ═══════════════════════════════════════════════════════════════════════

interface SafetyMeterProps {
    level: HazardLevel
    message?: string
}

export function SafetyMeter({ level, message }: SafetyMeterProps) {
    const levels: HazardLevel[] = ['safe', 'caution', 'warning', 'danger', 'critical']
    const currentIndex = levels.indexOf(level)

    const labels = {
        safe: 'Seguro',
        caution: 'Atenção',
        warning: 'Cuidado',
        danger: 'Perigo',
        critical: 'Crítico'
    }

    return (
        <div className="safety-meter">
            <div className="meter-label">Nível de Segurança</div>
            <div className="meter-bar">
                {levels.map((l, i) => (
                    <div
                        key={l}
                        className={`meter-segment ${i <= currentIndex ? 'active' : ''}`}
                        style={{ backgroundColor: i <= currentIndex ? getHazardColor(l) : '#333' }}
                    />
                ))}
            </div>
            <div className="meter-status" style={{ color: getHazardColor(level) }}>
                {labels[level]}
            </div>
            {message && <div className="meter-message">{message}</div>}
        </div>
    )
}
