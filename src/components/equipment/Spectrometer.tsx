// src/components/equipment/Spectrometer.tsx
// Espectrômetro 3D para análise espectral

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
    getElementSpectrum,
    wavelengthToPosition,
    type SpectralLine
} from '../../systems/SpectroscopySystem'

interface SpectrometerProps {
    position: [number, number, number]
    sampleElement?: string          // Símbolo do elemento (ex: "Na", "Cu")
    isActive?: boolean
    showSpectrum?: boolean
    onAnalysisComplete?: (element: string, lines: SpectralLine[]) => void
}

export function Spectrometer({
    position,
    sampleElement,
    isActive = false,
    showSpectrum = true,
    onAnalysisComplete
}: SpectrometerProps) {
    const groupRef = useRef<THREE.Group>(null)
    const prismRef = useRef<THREE.Mesh>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [analysisProgress, setAnalysisProgress] = useState(0)

    const spectrum = useMemo(() =>
        sampleElement ? getElementSpectrum(sampleElement) : null,
        [sampleElement]
    )

    useFrame((_, delta) => {
        // Rotação lenta do prisma quando ativo
        if (prismRef.current && isActive) {
            prismRef.current.rotation.y += delta * 0.5
        }

        // Simulação de análise
        if (isActive && sampleElement && !analyzing && analysisProgress === 0) {
            setAnalyzing(true)
        }

        if (analyzing) {
            setAnalysisProgress(prev => {
                const newProgress = prev + delta * 0.5
                if (newProgress >= 1) {
                    setAnalyzing(false)
                    if (spectrum) {
                        onAnalysisComplete?.(spectrum.element, spectrum.lines)
                    }
                    return 1
                }
                return newProgress
            })
        }
    })

    return (
        <group ref={groupRef} position={position}>
            {/* Base do espectrômetro */}
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[0.5, 0.03, 0.3]} />
                <meshStandardMaterial color="#222233" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Corpo principal */}
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.45, 0.12, 0.25]} />
                <meshStandardMaterial color="#111122" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Entrada de amostra (tubo) */}
            <mesh position={[-0.2, 0.12, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 16]} />
                <meshStandardMaterial color="#444444" metalness={0.7} />
            </mesh>

            {/* Fenda de colimação */}
            <mesh position={[-0.15, 0.05, 0.13]}>
                <boxGeometry args={[0.02, 0.06, 0.02]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Prisma de dispersão */}
            <group position={[0, 0.05, 0]}>
                <mesh ref={prismRef} rotation={[0, Math.PI / 4, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.08, 3]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.5}
                        roughness={0}
                        ior={1.5}
                    />
                </mesh>

                {/* Efeito arco-íris quando ativo */}
                {isActive && (
                    <RainbowEffect intensity={analysisProgress} />
                )}
            </group>

            {/* Tela de observação */}
            <mesh position={[0.18, 0.05, 0]} rotation={[0, -Math.PI / 6, 0]}>
                <boxGeometry args={[0.02, 0.08, 0.15]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Display de espectro */}
            {showSpectrum && spectrum && analysisProgress > 0.5 && (
                <SpectrumDisplay
                    position={[0, 0.2, 0]}
                    spectrum={spectrum}
                    progress={analysisProgress}
                />
            )}

            {/* Indicador de amostra */}
            <group position={[-0.2, 0.2, 0]}>
                <Text
                    fontSize={0.02}
                    color={sampleElement ? '#00ff00' : '#888888'}
                    anchorX="center"
                >
                    {sampleElement ? `Amostra: ${spectrum?.element || sampleElement}` : 'Sem amostra'}
                </Text>
            </group>

            {/* Status */}
            <group position={[0, -0.1, 0.16]}>
                <mesh>
                    <boxGeometry args={[0.2, 0.03, 0.01]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.015}
                    color={isActive ? '#00ff00' : '#888888'}
                    anchorX="center"
                >
                    {analyzing ? `Analisando... ${Math.round(analysisProgress * 100)}%` :
                        analysisProgress >= 1 ? 'Análise completa' :
                            isActive ? 'Pronto' : 'Desligado'}
                </Text>
            </group>

            {/* Luz indicadora */}
            <mesh position={[0.2, 0.12, 0]}>
                <sphereGeometry args={[0.01, 16, 16]} />
                <meshBasicMaterial color={isActive ? '#00ff00' : '#333333'} />
            </mesh>
            {isActive && (
                <pointLight position={[0.2, 0.12, 0]} color="#00ff00" intensity={0.5} distance={0.1} />
            )}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

function RainbowEffect({ intensity }: { intensity: number }) {
    const ref = useRef<THREE.Group>(null)

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 2
        }
    })

    return (
        <group ref={ref}>
            {['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8800ff'].map((color, i) => (
                <mesh
                    key={i}
                    position={[
                        Math.cos((i / 7) * Math.PI * 2) * 0.08,
                        0,
                        Math.sin((i / 7) * Math.PI * 2) * 0.08
                    ]}
                >
                    <sphereGeometry args={[0.005 * intensity, 8, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={intensity} />
                </mesh>
            ))}
            <pointLight color="#ffffff" intensity={intensity * 2} distance={0.2} />
        </group>
    )
}

interface SpectrumDisplayProps {
    position: [number, number, number]
    spectrum: { element: string; symbol: string; lines: SpectralLine[]; dominantColor: string }
    progress: number
}

function SpectrumDisplay({ position, spectrum, progress }: SpectrumDisplayProps) {
    return (
        <group position={position}>
            {/* Fundo do espectro */}
            <mesh>
                <planeGeometry args={[0.35, 0.08]} />
                <meshBasicMaterial color="#000000" />
            </mesh>

            {/* Gradiente do espectro visível */}
            <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[0.33, 0.04]} />
                <meshBasicMaterial
                    color="#444444"
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Linhas espectrais */}
            {spectrum.lines.map((line, i) => {
                const xPos = ((wavelengthToPosition(line.wavelength) / 100) - 0.5) * 0.33
                return (
                    <group key={i}>
                        {/* Linha */}
                        <mesh position={[xPos, 0, 0.002]} scale={[1, progress, 1]}>
                            <planeGeometry args={[0.003, 0.035]} />
                            <meshBasicMaterial
                                color={line.color}
                                transparent
                                opacity={line.intensity * progress}
                            />
                        </mesh>

                        {/* Glow */}
                        <pointLight
                            position={[xPos, 0, 0.01]}
                            color={line.color}
                            intensity={line.intensity * progress * 0.5}
                            distance={0.05}
                        />
                    </group>
                )
            })}

            {/* Escala de comprimento de onda */}
            <Text
                position={[-0.165, -0.05, 0]}
                fontSize={0.012}
                color="#888888"
            >
                380nm
            </Text>
            <Text
                position={[0, -0.05, 0]}
                fontSize={0.012}
                color="#888888"
                anchorX="center"
            >
                540nm
            </Text>
            <Text
                position={[0.165, -0.05, 0]}
                fontSize={0.012}
                color="#888888"
                anchorX="right"
            >
                700nm
            </Text>

            {/* Nome do elemento */}
            <Text
                position={[0, 0.055, 0]}
                fontSize={0.015}
                color={spectrum.dominantColor}
                anchorX="center"
            >
                {spectrum.element} ({spectrum.symbol})
            </Text>
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE DE GRÁFICO DE ESPECTRO (UI)
// ═══════════════════════════════════════════════════════════════════════

export function SpectrumGraph({
    elementSymbol,
    width = 400,
    height = 150
}: {
    elementSymbol: string
    width?: number
    height?: number
}) {
    const spectrum = getElementSpectrum(elementSymbol)

    if (!spectrum) {
        return (
            <div style={{
                width,
                height,
                background: '#111',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
            }}>
                Elemento não encontrado
            </div>
        )
    }

    const margin = 40
    const graphWidth = width - margin * 2
    const graphHeight = height - margin * 2

    return (
        <svg width={width} height={height} style={{ background: '#0a0a0a', borderRadius: 8 }}>
            {/* Título */}
            <text x={width / 2} y={20} textAnchor="middle" fill={spectrum.dominantColor} fontSize={14}>
                Espectro de Emissão - {spectrum.element} ({spectrum.symbol})
            </text>

            {/* Gradiente do espectro visível */}
            <defs>
                <linearGradient id="spectrumGradient">
                    <stop offset="0%" stopColor="#8B00FF" />
                    <stop offset="15%" stopColor="#0000FF" />
                    <stop offset="30%" stopColor="#00FFFF" />
                    <stop offset="45%" stopColor="#00FF00" />
                    <stop offset="60%" stopColor="#FFFF00" />
                    <stop offset="80%" stopColor="#FF8C00" />
                    <stop offset="100%" stopColor="#FF0000" />
                </linearGradient>
            </defs>

            {/* Fundo do gráfico */}
            <rect
                x={margin}
                y={margin}
                width={graphWidth}
                height={graphHeight}
                fill="#111"
                stroke="#333"
            />

            {/* Barra de referência do espectro */}
            <rect
                x={margin}
                y={height - 25}
                width={graphWidth}
                height={10}
                fill="url(#spectrumGradient)"
                opacity={0.5}
            />

            {/* Linhas espectrais */}
            {spectrum.lines.map((line, i) => {
                const xPos = margin + (wavelengthToPosition(line.wavelength) / 100) * graphWidth
                const lineHeight = graphHeight * line.intensity

                return (
                    <g key={i}>
                        <line
                            x1={xPos}
                            y1={margin + graphHeight - lineHeight}
                            x2={xPos}
                            y2={margin + graphHeight}
                            stroke={line.color}
                            strokeWidth={3}
                            opacity={0.9}
                        />
                        {/* Glow effect */}
                        <line
                            x1={xPos}
                            y1={margin + graphHeight - lineHeight}
                            x2={xPos}
                            y2={margin + graphHeight}
                            stroke={line.color}
                            strokeWidth={8}
                            opacity={0.3}
                        />
                        {/* Wavelength label */}
                        {line.intensity > 0.5 && (
                            <text
                                x={xPos}
                                y={margin + graphHeight - lineHeight - 5}
                                textAnchor="middle"
                                fill={line.color}
                                fontSize={9}
                            >
                                {line.wavelength.toFixed(0)}
                            </text>
                        )}
                    </g>
                )
            })}

            {/* Eixo X labels */}
            <text x={margin} y={height - 5} fill="#666" fontSize={10}>380nm</text>
            <text x={width / 2} y={height - 5} textAnchor="middle" fill="#666" fontSize={10}>540nm</text>
            <text x={width - margin} y={height - 5} textAnchor="end" fill="#666" fontSize={10}>700nm</text>

            {/* Eixo Y label */}
            <text
                x={15}
                y={height / 2}
                transform={`rotate(-90, 15, ${height / 2})`}
                textAnchor="middle"
                fill="#666"
                fontSize={10}
            >
                Intensidade
            </text>
        </svg>
    )
}
