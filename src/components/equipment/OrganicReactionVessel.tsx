// src/components/equipment/OrganicReactionVessel.tsx
// Componente 3D para visualizar reações orgânicas

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
    ORGANIC_REACTIONS,
    type OrganicReactionState,
    updateOrganicReaction,
    getReactionColor,
    getReactionStatus,
    createReactionState
} from '../../systems/OrganicReactionsSystem'

interface OrganicReactionVesselProps {
    position: [number, number, number]
    reactionId: keyof typeof ORGANIC_REACTIONS
    isActive?: boolean
    temperature?: number
    stirring?: boolean
    onStateChange?: (state: OrganicReactionState) => void
}

export function OrganicReactionVessel({
    position,
    reactionId,
    isActive = false,
    temperature = 25,
    stirring = false,
    onStateChange
}: OrganicReactionVesselProps) {
    const groupRef = useRef<THREE.Group>(null)
    const liquidRef = useRef<THREE.Mesh>(null)
    const stirrerRef = useRef<THREE.Group>(null)

    const reaction = ORGANIC_REACTIONS[reactionId]

    const [state, setState] = useState<OrganicReactionState>(() => ({
        ...createReactionState(reactionId),
        isReacting: isActive,
        temperature,
        stirring
    }))

    // Atualizar quando props mudam
    useFrame((_, delta) => {
        // Atualizar estado com props
        const updatedState = {
            ...state,
            reaction,
            isReacting: isActive && state.progress < 1,
            temperature,
            stirring
        }

        // Atualizar reação
        const newState = updateOrganicReaction(updatedState, delta)

        if (newState.progress !== state.progress) {
            setState(newState)
            onStateChange?.(newState)
        }

        // Animar agitador
        if (stirrerRef.current && stirring) {
            stirrerRef.current.rotation.y += delta * 5
        }

        // Animar líquido levemente
        if (liquidRef.current) {
            liquidRef.current.position.y = 0.08 + Math.sin(Date.now() * 0.002) * 0.003
        }
    })

    const liquidColor = useMemo(() => getReactionColor(state), [state])

    return (
        <group ref={groupRef} position={position}>
            {/* Béquer */}
            <mesh>
                <cylinderGeometry args={[0.1, 0.08, 0.25, 32, 1, true]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                    transmission={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Fundo do béquer */}
            <mesh position={[0, -0.125, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.08, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                    transmission={0.9}
                />
            </mesh>

            {/* Líquido */}
            <mesh ref={liquidRef} position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.095, 0.075, 0.15, 32]} />
                <meshPhysicalMaterial
                    color={liquidColor}
                    transparent
                    opacity={0.7 + (state.gelViscosity ?? 0) * 0.25}
                    roughness={0.1}
                    transmission={0.3 - (state.gelViscosity ?? 0) * 0.2}
                />
            </mesh>

            {/* Renderizar efeito específico da reação */}
            <ReactionEffect
                reactionType={reaction.type}
                state={state}
                isActive={isActive}
            />

            {/* Agitador magnético */}
            <group ref={stirrerRef} position={[0, -0.1, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <capsuleGeometry args={[0.01, 0.06, 4, 8]} />
                    <meshStandardMaterial color="#ffffff" metalness={0.8} />
                </mesh>
            </group>

            {/* Placa de aquecimento se precisar de calor */}
            {reaction.requiresHeat && (
                <group position={[0, -0.15, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
                        <meshStandardMaterial
                            color={temperature > 50 ? '#ff4400' : '#333333'}
                            metalness={0.7}
                            emissive={temperature > 50 ? '#ff2200' : '#000000'}
                            emissiveIntensity={temperature > 50 ? 0.3 : 0}
                        />
                    </mesh>

                    {temperature > 50 && (
                        <pointLight color="#ff4400" intensity={1} distance={0.3} />
                    )}
                </group>
            )}

            {/* Labels */}
            <group position={[0, 0.25, 0]}>
                <Text
                    fontSize={0.025}
                    color="#ffffff"
                    anchorX="center"
                >
                    {reaction.name}
                </Text>

                <Text
                    position={[0, -0.035, 0]}
                    fontSize={0.015}
                    color={isActive ? '#00ff00' : '#888888'}
                    anchorX="center"
                >
                    {getReactionStatus(state)}
                </Text>

                {/* Barra de progresso */}
                <mesh position={[0, -0.06, 0]}>
                    <boxGeometry args={[0.15, 0.01, 0.01]} />
                    <meshBasicMaterial color="#333333" />
                </mesh>
                <mesh position={[-0.075 + state.progress * 0.075, -0.06, 0.005]}>
                    <boxGeometry args={[state.progress * 0.15, 0.008, 0.008]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>
            </group>

            {/* Temperatura */}
            <Text
                position={[0.12, 0, 0]}
                fontSize={0.02}
                color={temperature > 60 ? '#ff4400' : '#00ccff'}
                anchorX="left"
            >
                {temperature.toFixed(0)}°C
            </Text>
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// EFEITOS VISUAIS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════════════

interface ReactionEffectProps {
    reactionType: string
    state: OrganicReactionState
    isActive: boolean
}

function ReactionEffect({ reactionType, state, isActive }: ReactionEffectProps) {
    switch (reactionType) {
        case 'nylon-synthesis':
            return <NylonThreadEffect threadLength={state.threadLength || 0} isActive={isActive} />
        case 'slime-synthesis':
            return <SlimeEffect viscosity={state.gelViscosity || 0} progress={state.progress} />
        case 'fermentation':
            return <BubbleEffect bubbleRate={state.bubbleRate || 0} isActive={isActive} />
        case 'oxidation':
            return <ColorChangeEffect progress={state.progress} />
        case 'esterification':
            return <AromaEffect progress={state.progress} isActive={isActive} />
        default:
            return null
    }
}

// Efeito de formação de fio de nylon
function NylonThreadEffect({ threadLength, isActive }: { threadLength: number; isActive: boolean }) {
    const threadRef = useRef<THREE.Group>(null)
    const timeRef = useRef(0)

    useFrame((_, delta) => {
        if (!threadRef.current) return
        timeRef.current += delta

        // Ondulação do fio
        threadRef.current.rotation.z = Math.sin(timeRef.current * 2) * 0.1
    })

    if (threadLength <= 0 || !isActive) return null

    // Número de segmentos do fio
    const segments = Math.floor(threadLength * 20)

    return (
        <group ref={threadRef} position={[0, 0.15, 0]}>
            {Array.from({ length: Math.min(segments, 30) }).map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        Math.sin(i * 0.3) * 0.02,
                        i * 0.02,
                        Math.cos(i * 0.3) * 0.02
                    ]}
                >
                    <sphereGeometry args={[0.005, 8, 8]} />
                    <meshStandardMaterial
                        color="#f5f5f5"
                        roughness={0.3}
                    />
                </mesh>
            ))}

            <Text
                position={[0.08, segments * 0.02 * 0.5, 0]}
                fontSize={0.015}
                color="#ffff00"
            >
                🧵 {threadLength.toFixed(2)}m
            </Text>
        </group>
    )
}

// Efeito de slime com deformação
function SlimeEffect({ viscosity, progress }: { viscosity: number; progress: number }) {
    const slimeRef = useRef<THREE.Mesh>(null)
    const timeRef = useRef(0)

    useFrame((_, delta) => {
        if (!slimeRef.current || viscosity < 0.3) return
        timeRef.current += delta

        // Deformação do slime
        const wobble = Math.sin(timeRef.current * 3) * 0.1 * viscosity
        slimeRef.current.scale.set(1 + wobble, 1 - wobble * 0.5, 1 + wobble)
    })

    if (progress < 0.2) return null

    return (
        <group position={[0, 0.05, 0]}>
            <mesh ref={slimeRef}>
                <sphereGeometry args={[0.06 * progress, 16, 16]} />
                <meshPhysicalMaterial
                    color="#7fff00"
                    transparent
                    opacity={0.7}
                    roughness={0.1}
                    metalness={0.1}
                    clearcoat={0.5}
                />
            </mesh>

            {/* Brilho do slime */}
            <pointLight color="#7fff00" intensity={viscosity * 2} distance={0.3} />
        </group>
    )
}

// Efeito de bolhas (fermentação)
function BubbleEffect({ bubbleRate, isActive }: { bubbleRate: number; isActive: boolean }) {
    const bubblesRef = useRef<THREE.Group>(null)

    // Função seeded para valores determinísticos (evita Math.random durante render)
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed * 12.9898) * 43758.5453
        return x - Math.floor(x)
    }

    // Gerar bolhas com valores determinísticos
    const bubbles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: (seededRandom(i * 1.1) - 0.5) * 0.15,
        z: (seededRandom(i * 2.2) - 0.5) * 0.15,
        y: seededRandom(i * 3.3) * 0.1,
        speed: 0.1 + seededRandom(i * 4.4) * 0.1,
        size: 0.005 + seededRandom(i * 5.5) * 0.01,
        offset: seededRandom(i * 6.6) * Math.PI * 2
    }))

    useFrame((_, delta) => {
        if (!bubblesRef.current || !isActive || bubbleRate <= 0) return

        bubblesRef.current.children.forEach((child, i) => {
            const bubble = bubbles[i]
            child.position.y += bubble.speed * delta * (bubbleRate / 10)

            // Reset quando sai do líquido
            if (child.position.y > 0.15) {
                child.position.y = 0
            }

            // Oscilação lateral
            child.position.x = bubble.x + Math.sin(Date.now() * 0.005 + bubble.offset) * 0.01
        })
    })

    if (bubbleRate <= 0) return null

    return (
        <group ref={bubblesRef} position={[0, 0, 0]}>
            {bubbles.map(bubble => (
                <mesh
                    key={bubble.id}
                    position={[bubble.x, bubble.y, bubble.z]}
                >
                    <sphereGeometry args={[bubble.size, 8, 8]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            ))}
        </group>
    )
}

// Efeito de mudança de cor (oxidação)
function ColorChangeEffect({ progress }: { progress: number }) {
    // Cor muda de laranja (dicromato) para verde (Cr³⁺)
    const color = useMemo(() => {
        const r = Math.round(255 * (1 - progress) + 0 * progress)
        const g = Math.round(140 * (1 - progress) + 200 * progress)
        const b = Math.round(0 * (1 - progress) + 0 * progress)
        return `rgb(${r}, ${g}, ${b})`
    }, [progress])

    if (progress < 0.05) return null

    return (
        <pointLight
            position={[0, 0.05, 0]}
            color={color}
            intensity={2}
            distance={0.3}
        />
    )
}

// Efeito de aroma (partículas saindo)
function AromaEffect({ progress, isActive }: { progress: number; isActive: boolean }) {
    const particlesRef = useRef<THREE.Points>(null)

    const count = 30

    // Função seeded para valores determinísticos (evita Math.random durante render)
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed * 12.9898) * 43758.5453
        return x - Math.floor(x)
    }

    // Posições determinísticas
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (seededRandom(i * 1.1) - 0.5) * 0.1
        positions[i * 3 + 1] = 0.15 + seededRandom(i * 2.2) * 0.1
        positions[i * 3 + 2] = (seededRandom(i * 3.3) - 0.5) * 0.1
    }

    useFrame(() => {
        if (!particlesRef.current || !isActive || progress < 0.3) return

        const posAttr = particlesRef.current.geometry.attributes.position
        const posArray = posAttr.array as Float32Array

        for (let i = 0; i < count; i++) {
            posArray[i * 3 + 1] += 0.002 // Subir

            // Reset
            if (posArray[i * 3 + 1] > 0.4) {
                posArray[i * 3 + 1] = 0.15
            }
        }

        posAttr.needsUpdate = true
    })

    if (progress < 0.3 || !isActive) return null

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#fffacd"
                size={0.008}
                transparent
                opacity={0.5}
            />
        </points>
    )
}

