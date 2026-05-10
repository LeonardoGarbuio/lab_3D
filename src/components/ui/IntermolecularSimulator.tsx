// src/components/ui/IntermolecularSimulator.tsx
import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { FluidEngine, type IMForceType } from '../../physics/FluidEngine'
import FluidContainer from '../canvas/FluidContainer'
import './IntermolecularSimulator.css'

interface IntermolecularSimulatorProps {
    isOpen: boolean
    onClose: () => void
}

const FORCE_DESCRIPTIONS: Record<IMForceType, { title: string; desc: string; color: string; example: string }> = {
    'london': {
        title: 'Forças de London',
        desc: 'Dipolo Induzido. Forças muito fracas presentes em moléculas apolares. Baixa tensão superficial e alta volatilidade.',
        color: '#aaaaaa',
        example: 'N₂, O₂, CH₄'
    },
    'dipole': {
        title: 'Dipolo-Dipolo',
        desc: 'Interação de média intensidade entre moléculas polares. Tensão superficial moderada.',
        color: '#ffaa00',
        example: 'HCl, H₂S, CO'
    },
    'h-bond': {
        title: 'Pontes de Hidrogênio',
        desc: 'Interação muito forte onde H está ligado a F, O, ou N. Gera alta tensão superficial e alto ponto de ebulição.',
        color: '#00f7ff',
        example: 'H₂O, NH₃, HF'
    },
    'ion-dipole': {
        title: 'Íon-Dipolo',
        desc: 'Interação extremamente forte entre um íon e o dipolo de uma molécula polar (ex: hidratação de sais).',
        color: '#ff3366',
        example: 'Na⁺ em H₂O'
    }
}

export default function IntermolecularSimulator({ isOpen, onClose }: IntermolecularSimulatorProps) {
    const [forceType, setForceType] = useState<IMForceType>('london')
    const engineRef = useRef<FluidEngine | null>(null)

    // Inicializa o motor apenas quando abrir
    if (!engineRef.current && isOpen) {
        engineRef.current = new FluidEngine(120, forceType)
    }

    // Atualiza a força quando mudar a aba
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.setForceType(forceType)
        }
    }, [forceType])

    if (!isOpen) return null

    const currentForce = FORCE_DESCRIPTIONS[forceType]

    return (
        <div className="im-overlay" onClick={onClose}>
            <div className="im-modal" onClick={e => e.stopPropagation()}>
                {/* TOPBAR */}
                <div className="im-topbar">
                    <div className="im-title">
                        <span className="im-icon">💧</span>
                        <h2>Simulador de Forças Intermoleculares</h2>
                    </div>
                    <button className="im-close" onClick={onClose}>✕</button>
                </div>

                <div className="im-content">
                    {/* CANVAS 3D */}
                    <div className="im-viewport">
                        <Canvas shadows gl={{ antialias: true, alpha: false }}>
                            <ambientLight intensity={0.2} />
                            <pointLight position={[5, 5, 5]} intensity={0.8} />
                            <pointLight position={[-5, -5, -5]} intensity={0.3} color={currentForce.color} />
                            <color attach="background" args={['#0a0f1a']} />
                            
                            <FluidContainer engine={engineRef.current!} particleColor={currentForce.color} />
                            
                            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
                            <OrbitControls makeDefault enablePan={false} autoRotate={true} autoRotateSpeed={1.0} />
                        </Canvas>

                        <div className="im-glass-overlay">
                            <div className="im-info-badge" style={{ borderColor: currentForce.color }}>
                                <h3 style={{ color: currentForce.color }}>{currentForce.title}</h3>
                                <p>{currentForce.desc}</p>
                                <p className="im-example"><strong>Exemplos:</strong> {currentForce.example}</p>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="im-sidebar">
                        <h3>Controle SPH</h3>
                        <p className="im-sub">Ajuste o tipo de interação intermolecular para observar a mudança na coesão (tensão superficial).</p>
                        
                        <div className="im-force-selector">
                            {(Object.keys(FORCE_DESCRIPTIONS) as IMForceType[]).map(type => (
                                <button
                                    key={type}
                                    className={`im-force-btn ${forceType === type ? 'active' : ''}`}
                                    onClick={() => setForceType(type)}
                                    style={{ '--accent': FORCE_DESCRIPTIONS[type].color } as any}
                                >
                                    <span className="btn-color-dot" style={{ background: FORCE_DESCRIPTIONS[type].color }} />
                                    {FORCE_DESCRIPTIONS[type].title}
                                </button>
                            ))}
                        </div>

                        <div className="im-actions">
                            <button 
                                className="im-action-btn"
                                onClick={() => engineRef.current?.reset(120)}
                            >
                                🔄 Agitar Recipiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
