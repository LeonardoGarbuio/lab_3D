// src/components/ui/StoichiometricHUD.tsx
import { useEffect, useState } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import { evaluateReactionThermo } from '../../systems/ChemistryEngine'
import type { ReactionResult } from '../../physics/ReactionEvaluator'
import './StoichiometricHUD.css'

function formatFormulaHTML(formula: string): string {
    if (!formula) return ''
    // Converte números na fórmula para subscript, ignorando coeficientes (números no começo ou após '+')
    // Ex: "2H2O" -> "2H<sub>2</sub>O"
    return formula.replace(/(?<=[A-Za-z\]\)])(\d+)/g, '<sub>$1</sub>')
}

export default function StoichiometricHUD() {
    const { pouringFromId, hoveredObjectId, objects, cancelPouring } = useLabStore()
    const [reactionData, setReactionData] = useState<ReactionResult | null>(null)

    const sourceObj = objects.find(o => o.id === pouringFromId)
    const targetObj = objects.find(o => o.id === hoveredObjectId)

    useEffect(() => {
        if (!sourceObj || !targetObj || sourceObj.id === targetObj.id) {
            setReactionData(null)
            return
        }

        const formula1 = sourceObj.formula
        const formula2 = targetObj.formula
        const temp = targetObj.temperature

        if (!formula1 || !formula2) {
            setReactionData(null)
            return
        }

        // Usa o motor termodinâmico para prever a reação!
        const result = evaluateReactionThermo(formula1, formula2, temp)
        setReactionData(result)

    }, [sourceObj, targetObj])

    if (!pouringFromId) return null

    return (
        <div className="stoic-hud">
            <div className="stoic-header">
                <h3>🫗 Modo de Mistura Ativo</h3>
                <button onClick={cancelPouring} className="cancel-btn">Cancelar (ESC)</button>
            </div>

            {targetObj && sourceObj?.id !== targetObj.id ? (
                <div className="stoic-body">
                    <p className="stoic-target">
                        Alvo: <strong>{targetObj.customName || targetObj.formula || 'Vazio'}</strong> 
                        ({targetObj.temperature}°C)
                    </p>

                    {reactionData ? (
                        <div className={`stoic-reaction ${reactionData.viable ? 'viable' : 'not-viable'}`}>
                            <div className="stoic-equation" dangerouslySetInnerHTML={{ __html: formatFormulaHTML(reactionData.equation) }} />
                            
                            <p className="stoic-desc">{reactionData.description}</p>
                            
                            {reactionData.deltaH !== null && (
                                <div className="stoic-thermo">
                                    <span className={reactionData.deltaH < 0 ? 'exo' : 'endo'}>
                                        ΔH: {reactionData.deltaH > 0 ? '+' : ''}{reactionData.deltaH.toFixed(1)} kJ/mol 
                                        ({reactionData.deltaH < 0 ? 'Exotérmica 🔥' : 'Endotérmica ❄️'})
                                    </span>
                                </div>
                            )}
                            
                            {!reactionData.viable && (
                                <div className="stoic-warning">
                                    ⚠️ Reação não ocorrerá espontaneamente nestas condições.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="stoic-mixture">
                            <p>Mistura física (Nenhuma reação química prevista)</p>
                            <div className="mixture-preview">
                                {formatFormulaHTML(sourceObj?.formula || '')} + {formatFormulaHTML(targetObj.formula || '')}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="stoic-hint">
                    Passe o mouse sobre um recipiente alvo...
                </div>
            )}
        </div>
    )
}
