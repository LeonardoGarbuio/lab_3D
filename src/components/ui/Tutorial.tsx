// src/components/ui/Tutorial.tsx
// Tutorial interativo para novos usuários
import { useState } from 'react'
import './Tutorial.css'

interface TutorialProps {
    isOpen: boolean
    onClose: () => void
}

const TUTORIAL_STEPS = [
    {
        title: 'Bem-vindo ao Laboratório! 🧪',
        content: 'Este é um simulador de química 3D. Aqui você pode fazer experimentos virtuais de forma segura e interativa.',
        highlight: null,
        icon: '👋'
    },
    {
        title: 'Selecionar Béqueres',
        content: 'Clique em qualquer béquer na bancada para selecioná-lo. O béquer selecionado ficará destacado.',
        highlight: 'beaker',
        icon: '🖱️'
    },
    {
        title: 'Adicionar Elementos',
        content: 'Com um béquer selecionado, clique em "⚛️ Elementos" no menu. Escolha um elemento da tabela periódica e ele será adicionado automaticamente.',
        highlight: 'periodic',
        icon: '⚛️'
    },
    {
        title: 'Adicionar Reagentes',
        content: 'Você também pode adicionar substâncias prontas como HCl, NaOH, água, etc. Clique em "🧪 Reagentes" no menu.',
        highlight: 'reagent',
        icon: '🧪'
    },
    {
        title: 'Misturar Substâncias',
        content: 'Para misturar: dê um DUPLO CLIQUE no béquer de origem, depois CLIQUE no béquer de destino. As substâncias serão misturadas!',
        highlight: 'pour',
        icon: '🫗'
    },
    {
        title: 'Observar Reações',
        content: 'Quando substâncias compatíveis se misturam, você verá reações com efeitos visuais: bolhas, fumaça, mudança de cor, etc.',
        highlight: 'reaction',
        icon: '⚗️'
    },
    {
        title: 'Aquecer Substâncias',
        content: 'Selecione um béquer com líquido e clique no botão 🔥 para aquecê-lo. A temperatura sobe até 100°C (fervura).',
        highlight: 'heat',
        icon: '🔥'
    },
    {
        title: 'Outras Ações',
        content: '🔬 Analisar - Ver propriedades detalhadas\n🌀 Agitar - Misturar o conteúdo\n❄️ Resfriar - Voltar a 25°C\n🗑️ Esvaziar - Remover conteúdo',
        highlight: 'actions',
        icon: '⚙️'
    },
    {
        title: 'Experimentos Guiados',
        content: 'Clique em "📚 Experimentos" para seguir tutoriais passo-a-passo de experimentos famosos como síntese da água, neutralização ácido-base, etc.',
        highlight: 'experiments',
        icon: '📚'
    },
    {
        title: 'Pronto para Começar!',
        content: 'Agora você sabe o básico! Explore, experimente e divirta-se aprendendo química. Boa sorte nos seus experimentos!',
        highlight: null,
        icon: '🎉'
    }
]

export default function Tutorial({ isOpen, onClose }: TutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)

    if (!isOpen) return null

    const step = TUTORIAL_STEPS[currentStep]
    const isLast = currentStep === TUTORIAL_STEPS.length - 1
    const isFirst = currentStep === 0

    const nextStep = () => {
        if (isLast) {
            onClose()
            setCurrentStep(0)
        } else {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const skip = () => {
        onClose()
        setCurrentStep(0)
    }

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-card">
                {/* Progress dots */}
                <div className="tutorial-progress">
                    {TUTORIAL_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(i)}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="tutorial-content">
                    <div className="tutorial-icon">{step.icon}</div>
                    <h2>{step.title}</h2>
                    <p>{step.content}</p>
                </div>

                {/* Navigation */}
                <div className="tutorial-nav">
                    {!isFirst && (
                        <button className="nav-btn prev" onClick={prevStep}>
                            ← Anterior
                        </button>
                    )}

                    <button className="nav-btn skip" onClick={skip}>
                        Pular Tutorial
                    </button>

                    <button className="nav-btn next" onClick={nextStep}>
                        {isLast ? 'Começar! 🚀' : 'Próximo →'}
                    </button>
                </div>

                {/* Step counter */}
                <div className="step-counter">
                    {currentStep + 1} / {TUTORIAL_STEPS.length}
                </div>
            </div>
        </div>
    )
}
