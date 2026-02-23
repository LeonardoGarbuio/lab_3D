// src/components/ui/ExperimentGuide.tsx
// Guia ativo durante um experimento com VALIDAÇÃO em tempo real
import { useState, useEffect } from 'react'
import { useLabStore } from '../../stores/useLabStore'
import type { Experiment } from '../../data/experiments'
import './ExperimentGuide.css'

interface ExperimentGuideProps {
    experiment: Experiment
    onComplete: () => void
    onQuit: () => void
}

interface StepValidation {
    passed: boolean
    feedback: string
    attempts: number
}

export default function ExperimentGuide({ experiment, onComplete, onQuit }: ExperimentGuideProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [showExplanation, setShowExplanation] = useState(false)
    const [validations, setValidations] = useState<Record<number, StepValidation>>({})
    const [score, setScore] = useState(0)
    const [showHint, setShowHint] = useState(false)

    // Acessar estado do laboratório
    const objects = useLabStore((state) => state.objects)
    const reactionLog = useLabStore((state) => state.reactionLog)

    const step = experiment.steps[currentStep]
    const progress = (completedSteps.length / experiment.steps.length) * 100
    const isLastStep = currentStep === experiment.steps.length - 1
    const validation = validations[currentStep]

    // Validar passo atual baseado no estado do laboratório
    const validateCurrentStep = (): { passed: boolean; feedback: string } => {
        const step = experiment.steps[currentStep]

        switch (step.action) {
            case 'add-element':
                // Verificar se algum béquer contém o elemento alvo
                const hasElement = objects.some(obj =>
                    obj.element?.symbol === step.target && obj.fillLevel > 0
                )
                return {
                    passed: hasElement,
                    feedback: hasElement
                        ? `✅ Perfeito! ${step.target} adicionado corretamente.`
                        : `❌ Adicione ${step.target} a um béquer. Use o menu Elementos.`
                }

            case 'add-reagent':
                // Verificar se algum béquer contém o reagente alvo
                const hasReagent = objects.some(obj =>
                    obj.formula === step.target && obj.fillLevel > 0
                )
                return {
                    passed: hasReagent,
                    feedback: hasReagent
                        ? `✅ Perfeito! ${step.target} adicionado corretamente.`
                        : `❌ Adicione ${step.target} a um béquer. Use o menu Reagentes.`
                }

            case 'mix':
                // Verificar se houve uma reação recente (últimos 10 segundos)
                const recentReactions = reactionLog.filter(r => {
                    const timeDiff = Date.now() - new Date(r.timestamp).getTime()
                    return timeDiff < 30000 // 30 segundos
                })
                const hasMixed = recentReactions.length > 0
                return {
                    passed: hasMixed,
                    feedback: hasMixed
                        ? `✅ Mistura realizada! ${recentReactions[recentReactions.length - 1]?.equation || ''}`
                        : `❌ Despeje uma substância em outra. Duplo clique no béquer de origem.`
                }

            case 'heat':
                // Verificar se algum béquer está aquecendo ou acima de 50°C
                const isHeating = objects.some(obj => obj.isHeating || obj.temperature > 50)
                return {
                    passed: isHeating,
                    feedback: isHeating
                        ? `✅ Aquecimento em progresso!`
                        : `❌ Aqueça um béquer com substância. Use o botão 🔥.`
                }

            case 'shake':
                // Verificar se algum béquer está agitando
                const isShaking = objects.some(obj => obj.isShaking)
                return {
                    passed: isShaking,
                    feedback: isShaking
                        ? `✅ Agitação realizada!`
                        : `❌ Agite um béquer. Use o botão 🌀.`
                }

            case 'observe':
                // Passos de observação sempre passam (é interpretativo)
                return {
                    passed: true,
                    feedback: `👁️ Observe o resultado e continue.`
                }

            default:
                return { passed: true, feedback: '' }
        }
    }

    // Verificar validação quando o estado muda
    useEffect(() => {
        const result = validateCurrentStep()
        const current = validations[currentStep]

        // Se ainda não foi validado e agora passou
        if (result.passed && !current?.passed) {
            setValidations(prev => ({
                ...prev,
                [currentStep]: {
                    passed: true,
                    feedback: result.feedback,
                    attempts: (prev[currentStep]?.attempts || 0) + 1
                }
            }))
        }
    }, [objects, reactionLog, currentStep])

    const completeStep = () => {
        const result = validateCurrentStep()

        // Atualizar validação
        setValidations(prev => ({
            ...prev,
            [currentStep]: {
                passed: result.passed,
                feedback: result.feedback,
                attempts: (prev[currentStep]?.attempts || 0) + 1
            }
        }))

        // Se não passou, mostrar feedback e não avançar
        if (!result.passed && step.action !== 'observe') {
            setShowHint(true)
            return
        }

        // Calcular pontuação (menos tentativas = mais pontos)
        const attempts = validations[currentStep]?.attempts || 1
        const stepScore = Math.max(10 - (attempts - 1) * 2, 5)
        setScore(prev => prev + stepScore)

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep])
        }

        if (isLastStep) {
            setShowExplanation(true)
        } else {
            setCurrentStep(currentStep + 1)
            setShowHint(false)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
            setShowHint(false)
        }
    }

    // Calcular nota final
    const calculateGrade = () => {
        const maxScore = experiment.steps.length * 10
        const percentage = (score / maxScore) * 100
        if (percentage >= 90) return { grade: 'A', emoji: '🏆', message: 'Excelente!' }
        if (percentage >= 80) return { grade: 'B', emoji: '🥈', message: 'Muito Bom!' }
        if (percentage >= 70) return { grade: 'C', emoji: '🥉', message: 'Bom!' }
        if (percentage >= 60) return { grade: 'D', emoji: '📚', message: 'Pode melhorar!' }
        return { grade: 'F', emoji: '📖', message: 'Tente novamente!' }
    }

    if (showExplanation) {
        const gradeInfo = calculateGrade()
        const maxScore = experiment.steps.length * 10

        return (
            <div className="experiment-guide complete">
                <div className="guide-header">
                    <span className="exp-icon">{experiment.icon}</span>
                    <h3>🎉 Experimento Concluído!</h3>
                </div>

                {/* NOTA E PONTUAÇÃO */}
                <div className="score-section">
                    <div className="grade-badge">
                        <span className="grade-emoji">{gradeInfo.emoji}</span>
                        <span className="grade-letter">{gradeInfo.grade}</span>
                    </div>
                    <div className="score-details">
                        <div className="score-value">{score} / {maxScore} pts</div>
                        <div className="score-message">{gradeInfo.message}</div>
                    </div>
                </div>

                {/* RESUMO DOS PASSOS */}
                <div className="validation-summary">
                    <h4>📋 Resumo dos Passos</h4>
                    <div className="summary-list">
                        {experiment.steps.map((s, i) => {
                            const v = validations[i]
                            const attempts = v?.attempts || 1
                            return (
                                <div key={s.id} className={`summary-item ${v?.passed ? 'passed' : 'failed'}`}>
                                    <span className="summary-icon">{v?.passed ? '✅' : '❌'}</span>
                                    <span className="summary-text">{s.instruction.slice(0, 35)}...</span>
                                    <span className="summary-attempts">{attempts === 1 ? '1ª tentativa' : `${attempts} tentativas`}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="result-section">
                    <h4>📊 Resultado Esperado</h4>
                    <p>{experiment.expectedResult}</p>
                </div>

                <div className="explanation-section">
                    <h4>📖 Explicação Científica</h4>
                    <p>{experiment.explanation}</p>
                </div>

                <div className="guide-actions">
                    <button onClick={onQuit}>Fechar</button>
                    <button onClick={onComplete} className="primary">✓ Concluir</button>
                </div>
            </div>
        )
    }

    return (
        <div className="experiment-guide">
            <div className="guide-header">
                <span className="exp-icon">{experiment.icon}</span>
                <div>
                    <h3>{experiment.title}</h3>
                    <span className="step-counter">Passo {currentStep + 1} de {experiment.steps.length}</span>
                </div>
                <button className="quit-btn" onClick={onQuit}>✕</button>
            </div>

            {/* Barra de progresso */}
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Pontuação atual */}
            <div className="current-score">
                🏆 {score} pts
            </div>

            {/* Instrução atual */}
            <div className={`current-instruction ${validation?.passed ? 'validated' : ''}`}>
                <div className="step-number">
                    {validation?.passed ? '✓' : currentStep + 1}
                </div>
                <div className="step-content">
                    <p className="instruction">{step.instruction}</p>
                    {step.hint && showHint && <p className="hint">💡 Dica: {step.hint}</p>}
                </div>
            </div>

            {/* Indicador de ação */}
            <div className="action-indicator">
                {step.action === 'add-element' && <span>⚛️ Adicionar elemento: <strong>{step.target}</strong></span>}
                {step.action === 'add-reagent' && <span>🧪 Adicionar reagente: <strong>{step.target}</strong></span>}
                {step.action === 'mix' && <span>🔀 Misturar substâncias</span>}
                {step.action === 'heat' && <span>🔥 Aquecer</span>}
                {step.action === 'shake' && <span>🌀 Agitar</span>}
                {step.action === 'observe' && <span>👁️ Observar resultado</span>}
            </div>

            {/* FEEDBACK DE VALIDAÇÃO */}
            {validation && (
                <div className={`validation-feedback ${validation.passed ? 'success' : 'error'}`}>
                    {validation.feedback}
                </div>
            )}

            {/* Lista de passos */}
            <div className="steps-list">
                {experiment.steps.map((s, i) => {
                    const v = validations[i]
                    return (
                        <div
                            key={s.id}
                            className={`step-item ${i === currentStep ? 'current' : ''} ${v?.passed ? 'completed' : ''}`}
                            onClick={() => { setCurrentStep(i); setShowHint(false) }}
                        >
                            <span className={`step-dot ${v?.passed ? 'valid' : ''}`}>
                                {v?.passed ? '✓' : i + 1}
                            </span>
                            <span className="step-text">{s.instruction.slice(0, 30)}...</span>
                        </div>
                    )
                })}
            </div>

            {/* Navegação */}
            <div className="guide-nav">
                <button onClick={prevStep} disabled={currentStep === 0}>← Anterior</button>
                <button onClick={completeStep} className={`primary ${validation?.passed ? 'ready' : ''}`}>
                    {isLastStep ? 'Finalizar ✓' : validation?.passed ? 'Próximo →' : 'Verificar ✓'}
                </button>
            </div>
        </div>
    )
}
