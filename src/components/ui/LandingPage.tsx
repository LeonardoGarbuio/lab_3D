// src/components/ui/LandingPage.tsx
// Página inicial do Laboratório Virtual
import { useState, useEffect } from 'react'
import './LandingPage.css'

interface LandingPageProps {
    onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        setTimeout(() => setShowContent(true), 300)
    }, [])

    const features = [
        { icon: '⚛️', title: 'Tabela Periódica', desc: 'Monte moléculas elemento por elemento' },
        { icon: '🔥', title: 'Termodinâmica', desc: 'Simule aquecimento e resfriamento extremos' },
        { icon: '⚗️', title: 'Reações Químicas', desc: 'Sínteses, combustões e precipitados reais' },
        { icon: '🔬', title: 'Microscópio Quântico', desc: 'Visualize estruturas atômicas VSEPR 3D' },
        { icon: '💎', title: 'Cristalização', desc: 'Controle de saturação e hologramas' },
        { icon: '🧪', title: 'Laboratório Físico', desc: 'Béqueres e cristalizadores interativos' },
    ]

    return (
        <div className={`landing-page ${showContent ? 'visible' : ''}`}>
            {/* Background animado */}
            <div className="landing-bg">
                <div className="particle p1">⚛️</div>
                <div className="particle p2">🧪</div>
                <div className="particle p3">⚗️</div>
                <div className="particle p4">🔬</div>
                <div className="particle p5">💧</div>
            </div>

            <div className="landing-content">
                {/* Logo e título */}
                <div className="landing-header">
                    <div className="logo-container">
                        <span className="logo-icon">🧪</span>
                        <span className="logo-glow"></span>
                    </div>
                    <h1>Laboratório Virtual</h1>
                    <p className="subtitle">Simulador de Química 3D Interativo</p>
                </div>

                {/* Descrição */}
                <p className="description">
                    Explore o mundo da química de forma segura e interativa.
                    Combine elementos, realize reações e aprenda com experimentos guiados.
                </p>

                {/* Features */}
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                            <span className="feature-icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Botão de início */}
                <button className="start-button" onClick={onStart}>
                    <span>🚀 Começar Agora</span>
                    <div className="btn-glow"></div>
                </button>

                {/* Créditos */}
                <div className="credits">
                    <p>Trabalho de Conclusão de Curso</p>
                    <p className="author">Desenvolvido com React + Three.js</p>
                </div>
            </div>
        </div>
    )
}
