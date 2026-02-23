// src/components/equipment/CrystallizationDish.tsx
// Recipiente de cristalização com aquecimento/resfriamento integrado

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { Crystal } from '../effects/Crystal'
import {
    CRYSTAL_SUBSTANCES,
    type CrystallizationState,
    calculateSaturation,
    getSolubilityForSubstance,
    type CrystalType
} from '../../systems/CrystallizationSystem'

interface CrystallizationDishProps {
    position: [number, number, number]
    substanceId?: keyof typeof CRYSTAL_SUBSTANCES
    initialConcentration?: number    // g/L
    initialTemperature?: number      // °C
    isHeating?: boolean
    isCooling?: boolean
    heatingRate?: number             // °C/s
    onStateChange?: (state: CrystallizationState) => void
}

interface CrystalInstance {
    id: number
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number
    growthProgress: number
    type: CrystalType
}

export function CrystallizationDish({
    position,
    substanceId = 'NaCl',
    initialConcentration = 400,
    initialTemperature = 80,
    isHeating = false,
    isCooling = false,
    heatingRate = 5,
    onStateChange
}: CrystallizationDishProps) {
    const dishRef = useRef<THREE.Group>(null)

    const substance = CRYSTAL_SUBSTANCES[substanceId]

    // Estado da cristalização
    const [state, setState] = useState<CrystallizationState>({
        substance,
        concentration: initialConcentration,
        temperature: initialTemperature,
        saturation: calculateSaturation(initialConcentration, initialTemperature, substance),
        isSaturated: false,
        isSupersaturated: false,
        crystalsFormed: 0,
        crystallizationRate: 0
    })

    // Cristais formados
    const [crystals, setCrystals] = useState<CrystalInstance[]>([])
    const crystalIdCounter = useRef(0)
    const lastCrystalTime = useRef(0)

    // Cor da solução baseada na concentração
    const solutionColor = useMemo(() => {
        const baseColor = new THREE.Color(substance.color)
        // Mais concentrado = mais saturado
        const saturation = Math.min(state.concentration / (getSolubilityForSubstance(state.temperature, substance) * 1.5), 1)
        return baseColor.multiplyScalar(0.3 + saturation * 0.7)
    }, [state.concentration, state.temperature, substance])

    // Atualização do sistema
    useFrame((_, delta) => {
        // Atualizar temperatura
        let newTemp = state.temperature
        if (isHeating) {
            newTemp = Math.min(state.temperature + heatingRate * delta, 100)
        } else if (isCooling) {
            newTemp = Math.max(state.temperature - heatingRate * delta, 0)
        } else {
            // Esfriamento natural para temperatura ambiente
            if (state.temperature > 25) {
                newTemp = state.temperature - delta * 0.5
            } else if (state.temperature < 25) {
                newTemp = state.temperature + delta * 0.2
            }
        }

        // Calcular saturação
        const solubility = getSolubilityForSubstance(newTemp, substance)
        const saturation = state.concentration / solubility
        const isSaturated = saturation >= 1
        const isSupersaturated = saturation > 1.2

        // Taxa de cristalização
        let crystallizationRate = 0
        if (isSupersaturated && !isHeating) {
            // Cristalização acontece quando supersaturado e esfriando
            crystallizationRate = (saturation - 1) * (substance.crystallizationSpeed ?? 0.3) * 10
        }

        // Formar cristais
        const now = performance.now()
        if (crystallizationRate > 0 && now - lastCrystalTime.current > 1000 / crystallizationRate) {
            const newCrystal: CrystalInstance = {
                id: crystalIdCounter.current++,
                position: [
                    (Math.random() - 0.5) * 0.15,
                    -0.02 + crystals.length * 0.01,
                    (Math.random() - 0.5) * 0.15
                ],
                rotation: [
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                ],
                scale: 0.01 + Math.random() * 0.02,
                growthProgress: 0,
                type: substance
            }

            setCrystals(prev => [...prev, newCrystal])
            lastCrystalTime.current = now
        }

        // Crescer cristais existentes
        setCrystals(prev => prev.map(crystal => ({
            ...crystal,
            growthProgress: Math.min(crystal.growthProgress + delta * 0.1 * crystallizationRate, 1)
        })))

        // Reduzir concentração conforme cristais se formam
        const concentrationReduction = crystallizationRate * delta * 5
        const newConcentration = Math.max(
            state.concentration - concentrationReduction,
            solubility * 0.9 // Não fica abaixo da saturação
        )

        const newState: CrystallizationState = {
            ...state,
            temperature: newTemp,
            concentration: newConcentration,
            saturation,
            isSaturated,
            isSupersaturated,
            crystalsFormed: crystals.length,
            crystallizationRate
        }

        setState(newState)
        onStateChange?.(newState)
    })

    // Nível do líquido
    const liquidLevel = 0.04

    return (
        <group ref={dishRef} position={position}>
            {/* Recipiente de cristalização (vidro de relógio grande) */}
            <mesh rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.12, 0.08, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                    transmission={0.9}
                    thickness={0.01}
                />
            </mesh>

            {/* Borda do recipiente */}
            <mesh position={[0, 0.04, 0]}>
                <torusGeometry args={[0.15, 0.005, 8, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0}
                />
            </mesh>

            {/* Solução */}
            <mesh position={[0, -0.01, 0]}>
                <cylinderGeometry args={[0.14, 0.11, liquidLevel, 32]} />
                <meshPhysicalMaterial
                    color={solutionColor}
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                    transmission={0.3}
                />
            </mesh>

            {/* Cristais */}
            {crystals.map(crystal => (
                <Crystal
                    key={crystal.id}
                    type={crystal.type}
                    position={crystal.position}
                    rotation={crystal.rotation}
                    scale={crystal.scale}
                    growthProgress={crystal.growthProgress}
                    isGrowing={(state.crystallizationRate ?? 0) > 0}
                />
            ))}

            {/* Placa de aquecimento (se aquecendo) */}
            {isHeating && (
                <group position={[0, -0.06, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
                        <meshStandardMaterial color="#333" metalness={0.7} />
                    </mesh>

                    {/* Glow de aquecimento */}
                    <HeatingGlow />

                    <pointLight color="#ff4400" intensity={2} distance={0.3} />
                </group>
            )}

            {/* Indicador de resfriamento */}
            {isCooling && (
                <group position={[0, -0.06, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
                        <meshStandardMaterial color="#334455" metalness={0.7} />
                    </mesh>

                    {/* Glow de resfriamento */}
                    <mesh position={[0, 0.015, 0]}>
                        <cylinderGeometry args={[0.16, 0.16, 0.005, 32]} />
                        <meshBasicMaterial color="#0088ff" transparent opacity={0.3} />
                    </mesh>

                    <pointLight color="#0088ff" intensity={1} distance={0.3} />
                </group>
            )}

            {/* Informações */}
            <group position={[0, 0.12, 0]}>
                <Text
                    fontSize={0.025}
                    color={state.temperature > 80 ? '#ff4400' : state.temperature < 30 ? '#0088ff' : '#ffffff'}
                    anchorX="center"
                >
                    {state.temperature.toFixed(1)}°C
                </Text>

                <Text
                    position={[0, -0.03, 0]}
                    fontSize={0.02}
                    color={state.isSupersaturated ? '#ffff00' : state.isSaturated ? '#00ff00' : '#888888'}
                    anchorX="center"
                >
                    {state.isSupersaturated ? '⚠️ Supersaturada' :
                        state.isSaturated ? '✓ Saturada' :
                            `${((state.saturation ?? 0) * 100).toFixed(0)}% saturação`}
                </Text>

                {crystals.length > 0 && (
                    <Text
                        position={[0, -0.055, 0]}
                        fontSize={0.018}
                        color="#ffffff"
                        anchorX="center"
                    >
                        💎 {crystals.length} cristais formados
                    </Text>
                )}
            </group>

            {/* Etiqueta da substância */}
            <Text
                position={[0, -0.08, 0.16]}
                fontSize={0.02}
                color="#ffffff"
                anchorX="center"
            >
                {substance.name} ({substance.formula})
            </Text>
        </group>
    )
}

// Componente separado para evitar Date.now() durante render
function HeatingGlow() {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (!meshRef.current) return
        const material = meshRef.current.material as THREE.MeshBasicMaterial
        material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.1
    })

    return (
        <mesh ref={meshRef} position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.005, 32]} />
            <meshBasicMaterial
                color="#ff4400"
                transparent
                opacity={0.3}
            />
        </mesh>
    )
}

