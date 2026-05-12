// src/components/ui/IntermolecularSimulator.tsx
// ═══════════════════════════════════════════════════════════════════════
// 🎛️ SIMULADOR DE FORÇAS INTERMOLECULARES
// Coordena a comunicação entre a UI (React) e o Cérebro (Web Worker).
//
// Fluxo:
//   1. Ao abrir → cria Worker → envia INIT
//   2. Worker roda a física em background a 60Hz
//   3. Worker devolve Float32Array de posições via postMessage
//   4. React armazena num ref → FluidContainer lê no useFrame
//   5. Ao fechar → worker.terminate()
// ═══════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import FluidContainer from '../canvas/FluidContainer'
import './IntermolecularSimulator.css'

// Tipo de força (espelhado do FluidEngine — sem importar o módulo pesado)
type IMForceType = 'london' | 'dipole' | 'h-bond' | 'ion-dipole'

const NUM_PARTICLES = 120

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
    const workerRef = useRef<Worker | null>(null)
    const positionsRef = useRef<Float32Array | null>(null)
    const [ready, setReady] = useState(false)

    // ─── Ciclo de vida do Worker ──────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return

        // Criar o Worker via import nativo do Vite
        const worker = new Worker(
            new URL('../../workers/physics.worker.ts', import.meta.url),
            { type: 'module' }
        )
        workerRef.current = worker

        // Escutar mensagens do Worker
        worker.onmessage = (event: MessageEvent) => {
            const { type } = event.data

            if (type === 'READY') {
                setReady(true)
            }

            if (type === 'FRAME') {
                // Guardar as posições recebidas do Worker
                // O Float32Array veio via Transferable (zero-copy)
                positionsRef.current = event.data.positions as Float32Array
            }
        }

        worker.onerror = (err) => {
            console.error('[IntermolecularSimulator] Worker error:', err)
        }

        // Inicializar a simulação
        worker.postMessage({
            type: 'INIT',
            numParticles: NUM_PARTICLES,
            forceType: forceType,
        })

        // Cleanup: matar o Worker quando o componente desmontar ou fechar
        return () => {
            worker.terminate()
            workerRef.current = null
            positionsRef.current = null
            setReady(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]) // Só recriar quando abrir/fechar

    // ─── Enviar mudança de força para o Worker ────────────────────────
    useEffect(() => {
        if (workerRef.current && ready) {
            workerRef.current.postMessage({
                type: 'SET_FORCE',
                forceType: forceType,
            })
        }
    }, [forceType, ready])

    // ─── Agitar Recipiente ────────────────────────────────────────────
    const handleReset = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'RESET',
                numParticles: NUM_PARTICLES,
            })
        }
    }, [])

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

                            <FluidContainer
                                positionsRef={positionsRef}
                                particleCount={NUM_PARTICLES}
                                particleColor={currentForce.color}
                            />

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
                                    style={{ '--accent': FORCE_DESCRIPTIONS[type].color } as React.CSSProperties}
                                >
                                    <span className="btn-color-dot" style={{ background: FORCE_DESCRIPTIONS[type].color }} />
                                    {FORCE_DESCRIPTIONS[type].title}
                                </button>
                            ))}
                        </div>

                        <div className="im-actions">
                            <button
                                className="im-action-btn"
                                onClick={handleReset}
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
