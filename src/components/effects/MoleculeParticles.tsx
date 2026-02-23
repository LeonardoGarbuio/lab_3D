// src/components/effects/MoleculeParticles.tsx
// Visualização de moléculas se movendo - demonstra velocidade vs temperatura

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { calculateMolecularSpeed, celsiusToKelvin } from '../../systems/GasPhysics'

interface MoleculeParticlesProps {
    position: [number, number, number]
    containerSize: [number, number, number]  // largura, altura, profundidade
    temperature: number                       // Celsius
    molarMass: number                         // g/mol
    particleCount?: number
    particleColor?: string
    showContainer?: boolean
}

export function MoleculeParticles({
    position,
    containerSize,
    temperature,
    molarMass,
    particleCount = 50,
    particleColor = '#4ecdc4',
    showContainer = true
}: MoleculeParticlesProps) {
    const pointsRef = useRef<THREE.Points>(null)
    const velocitiesRef = useRef<Float32Array>()

    // Calcular velocidade baseada na temperatura
    const speed = useMemo(() => {
        const tempK = celsiusToKelvin(temperature)
        // Escalar para visualização (velocidade real seria muito rápida)
        return calculateMolecularSpeed(tempK, molarMass) * 0.00001
    }, [temperature, molarMass])

    // Criar posições e velocidades iniciais
    useMemo(() => {
        const velocities = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            // Velocidades aleatórias em todas direções
            velocities[i3] = (Math.random() - 0.5) * 2
            velocities[i3 + 1] = (Math.random() - 0.5) * 2
            velocities[i3 + 2] = (Math.random() - 0.5) * 2

            // Normalizar
            const mag = Math.sqrt(
                velocities[i3] ** 2 +
                velocities[i3 + 1] ** 2 +
                velocities[i3 + 2] ** 2
            )
            velocities[i3] /= mag
            velocities[i3 + 1] /= mag
            velocities[i3 + 2] /= mag
        }

        velocitiesRef.current = velocities
    }, [particleCount])

    // Posições iniciais
    const positions = useMemo(() => {
        const pos = new Float32Array(particleCount * 3)
        const [w, h, d] = containerSize

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            pos[i3] = (Math.random() - 0.5) * w * 0.9
            pos[i3 + 1] = (Math.random() - 0.5) * h * 0.9
            pos[i3 + 2] = (Math.random() - 0.5) * d * 0.9
        }

        return pos
    }, [particleCount, containerSize])

    // Animação das partículas
    useFrame(() => {
        if (!pointsRef.current || !velocitiesRef.current) return

        const geometry = pointsRef.current.geometry
        const posAttr = geometry.attributes.position
        const posArray = posAttr.array as Float32Array
        const velocities = velocitiesRef.current

        const [w, h, d] = containerSize
        const halfW = w / 2
        const halfH = h / 2
        const halfD = d / 2

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3

            // Mover partícula
            posArray[i3] += velocities[i3] * speed
            posArray[i3 + 1] += velocities[i3 + 1] * speed
            posArray[i3 + 2] += velocities[i3 + 2] * speed

            // Colisão com paredes (refletir)
            if (Math.abs(posArray[i3]) > halfW) {
                velocities[i3] *= -1
                posArray[i3] = Math.sign(posArray[i3]) * halfW
            }
            if (Math.abs(posArray[i3 + 1]) > halfH) {
                velocities[i3 + 1] *= -1
                posArray[i3 + 1] = Math.sign(posArray[i3 + 1]) * halfH
            }
            if (Math.abs(posArray[i3 + 2]) > halfD) {
                velocities[i3 + 2] *= -1
                posArray[i3 + 2] = Math.sign(posArray[i3 + 2]) * halfD
            }
        }

        posAttr.needsUpdate = true
    })

    // Tamanho da partícula baseado na temperatura (mais quente = mais energia visual)
    const particleSize = 0.02 + (temperature / 500) * 0.02

    return (
        <group position={position}>
            {/* Container (opcional) */}
            {showContainer && (
                <mesh>
                    <boxGeometry args={containerSize} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.1}
                        roughness={0}
                        transmission={0.9}
                        side={THREE.BackSide}
                    />
                </mesh>
            )}

            {/* Partículas */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={positions}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color={particleColor}
                    size={particleSize}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                />
            </points>

            {/* Indicador visual de temperatura */}
            <mesh position={[0, containerSize[1] / 2 + 0.05, 0]}>
                <planeGeometry args={[0.1, 0.02]} />
                <meshBasicMaterial
                    color={getTemperatureColor(temperature)}
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    )
}

function getTemperatureColor(tempCelsius: number): string {
    if (tempCelsius < 0) return '#0066ff'     // Frio - azul
    if (tempCelsius < 25) return '#00ccff'    // Fresco - ciano
    if (tempCelsius < 50) return '#00ff00'    // Ambiente - verde
    if (tempCelsius < 100) return '#ffcc00'   // Quente - amarelo
    if (tempCelsius < 200) return '#ff6600'   // Muito quente - laranja
    return '#ff0000'                           // Extremo - vermelho
}
