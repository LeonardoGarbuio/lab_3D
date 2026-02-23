// src/components/equipment/DistillationApparatus.tsx
// Equipamento de destilação fracionada 3D completo

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
    DistillationState,
    createInitialDistillationState,
    updateDistillation,
    DISTILLATION_MIXTURES,
    generateDistillationCurve
} from '../../systems/DistillationSystem'

interface DistillationApparatusProps {
    position: [number, number, number]
    scale?: number
    mixtureId?: keyof typeof DISTILLATION_MIXTURES
    isHeating?: boolean
    onStateChange?: (state: DistillationState) => void
}

interface VaporParticle {
    id: number
    position: THREE.Vector3
    progress: number
    speed: number
}

export function DistillationApparatus({
    position,
    scale = 1,
    mixtureId = 'ethanolWater',
    isHeating = false,
    onStateChange
}: DistillationApparatusProps) {
    const groupRef = useRef<THREE.Group>(null)
    const [state, setState] = useState<DistillationState>(() => createInitialDistillationState(mixtureId))
    const [vaporParticles, setVaporParticles] = useState<VaporParticle[]>([])
    const particleIdRef = useRef(0)
    const lastParticleTime = useRef(0)

    // Caminho do vapor (curva)
    const vaporPath = useMemo(() => {
        const points = [
            new THREE.Vector3(-0.8, 0.8, 0),    // Do frasco
            new THREE.Vector3(-0.8, 1.2, 0),    // Subindo
            new THREE.Vector3(-0.4, 1.4, 0),    // Curva para condensador
            new THREE.Vector3(0.2, 1.3, 0),     // No condensador
            new THREE.Vector3(0.6, 1.0, 0),     // Saindo do condensador
            new THREE.Vector3(0.8, 0.6, 0),     // Descendo
            new THREE.Vector3(0.8, 0.0, 0),     // Para o coletor
        ]
        return new THREE.CatmullRomCurve3(points)
    }, [])

    // Atualização do estado
    useFrame((_, delta) => {
        const newState = { ...state, isHeating }
        const updated = updateDistillation(newState, delta)
        setState(updated)
        onStateChange?.(updated)

        // Criar partículas de vapor
        if (updated.vaporizing && updated.vaporRate > 0) {
            const now = performance.now()
            const interval = 1000 / (updated.vaporRate * 10)

            if (now - lastParticleTime.current > interval) {
                setVaporParticles(prev => [
                    ...prev,
                    {
                        id: particleIdRef.current++,
                        position: new THREE.Vector3(-0.8, 0.8, 0),
                        progress: 0,
                        speed: 0.2 + Math.random() * 0.1
                    }
                ])
                lastParticleTime.current = now
            }
        }

        // Atualizar partículas
        setVaporParticles(prev =>
            prev
                .map(p => ({
                    ...p,
                    progress: p.progress + p.speed * delta,
                    position: vaporPath.getPoint(Math.min(p.progress, 1))
                }))
                .filter(p => p.progress < 1.05)
        )
    })

    // Cor do líquido atual
    const liquidColor = useMemo(() => {
        if (!state.mixture) return '#4a90d9'
        // Misturar cores dos componentes restantes
        const remaining = state.mixture.components.filter(c => !c.isCollected)
        if (remaining.length === 0) return '#f0f0f0'

        // Média simples das cores
        let r = 0, g = 0, b = 0
        for (const c of remaining) {
            const color = new THREE.Color(c.color)
            r += color.r
            g += color.g
            b += color.b
        }
        return new THREE.Color(r / remaining.length, g / remaining.length, b / remaining.length).getHexString()
    }, [state.mixture])

    // Cor do destilado
    const distillateColor = state.currentFraction?.color || '#ffffff'

    // Volume do líquido no frasco (diminui conforme destila)
    const remainingVolume = state.mixture
        ? state.mixture.totalVolume - state.distillateVolume
        : 0
    const liquidLevel = (remainingVolume / (state.mixture?.totalVolume || 1)) * 0.5

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* BALÃO DE DESTILAÇÃO (Frasco de Fundo Redondo) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[-0.8, 0, 0]}>
                {/* Corpo esférico */}
                <mesh position={[0, 0.2, 0]}>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                        thickness={0.02}
                    />
                </mesh>

                {/* Pescoço */}
                <mesh position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[0.05, 0.1, 0.4]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                    />
                </mesh>

                {/* Líquido */}
                {liquidLevel > 0 && (
                    <mesh position={[0, 0.2 - (0.3 - liquidLevel * 0.5) / 2, 0]}>
                        <sphereGeometry args={[0.28 * Math.sqrt(liquidLevel / 0.5), 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                        <meshPhysicalMaterial
                            color={`#${liquidColor}`}
                            transparent
                            opacity={0.6}
                            roughness={0.1}
                        />
                    </mesh>
                )}

                {/* Chama do bico de Bunsen */}
                {isHeating && (
                    <group position={[0, -0.25, 0]}>
                        {/* Base do bico */}
                        <mesh>
                            <cylinderGeometry args={[0.08, 0.1, 0.15]} />
                            <meshStandardMaterial color="#333" metalness={0.8} />
                        </mesh>

                        {/* Chama */}
                        <mesh position={[0, 0.15, 0]}>
                            <coneGeometry args={[0.05, 0.2, 16]} />
                            <meshBasicMaterial color="#3399ff" transparent opacity={0.8} />
                        </mesh>
                        <mesh position={[0, 0.2, 0]}>
                            <coneGeometry args={[0.03, 0.15, 16]} />
                            <meshBasicMaterial color="#66ccff" transparent opacity={0.9} />
                        </mesh>

                        <pointLight color="#3399ff" intensity={2} distance={1} />
                    </group>
                )}

                {/* Termômetro */}
                <group position={[0, 0.85, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.015, 0.015, 0.3]} />
                        <meshPhysicalMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.3}
                            roughness={0}
                            transmission={0.8}
                        />
                    </mesh>
                    {/* Bulbo do termômetro */}
                    <mesh position={[0, -0.15, 0]}>
                        <sphereGeometry args={[0.025, 16, 16]} />
                        <meshStandardMaterial color="#ff0000" />
                    </mesh>
                    {/* Mercúrio */}
                    <mesh position={[0, -0.05 + (state.temperature / 200) * 0.1, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, Math.min(state.temperature / 100, 0.2)]} />
                        <meshStandardMaterial color="#ff0000" />
                    </mesh>
                </group>
            </group>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* COLUNA DE FRACIONAMENTO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[-0.6, 1.1, 0]}>
                <mesh rotation={[0, 0, Math.PI / 6]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.5]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                    />
                </mesh>

                {/* Anéis internos (representando pratos) */}
                {[0.1, 0.2, 0.3].map((y, i) => (
                    <mesh key={i} position={[y * 0.5, 0.9 + y * 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
                        <torusGeometry args={[0.04, 0.008, 8, 16]} />
                        <meshStandardMaterial color="#aaaaaa" metalness={0.5} />
                    </mesh>
                ))}
            </group>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CONDENSADOR */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[0.2, 1.2, 0]} rotation={[0, 0, -Math.PI / 8]}>
                {/* Tubo externo (jaqueta de água) */}
                <mesh>
                    <cylinderGeometry args={[0.12, 0.12, 0.8]} />
                    <meshPhysicalMaterial
                        color="#e0f7ff"
                        transparent
                        opacity={0.3}
                        roughness={0}
                        transmission={0.8}
                    />
                </mesh>

                {/* Tubo interno */}
                <mesh>
                    <cylinderGeometry args={[0.04, 0.04, 0.9]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                    />
                </mesh>

                {/* Água de refrigeração (visual) */}
                <mesh>
                    <cylinderGeometry args={[0.1, 0.1, 0.75]} />
                    <meshPhysicalMaterial
                        color="#4a90d9"
                        transparent
                        opacity={0.3}
                        roughness={0.2}
                    />
                </mesh>

                {/* Entrada de água (em baixo) */}
                <mesh position={[0.12, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} />
                </mesh>

                {/* Saída de água (em cima) */}
                <mesh position={[0.12, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} />
                </mesh>

                {/* Texto */}
                <Text
                    position={[0.2, 0, 0]}
                    fontSize={0.06}
                    color="#00aaff"
                    rotation={[0, 0, Math.PI / 8]}
                >
                    Condensador
                </Text>
            </group>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TUBO DE SAÍDA */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <mesh position={[0.7, 0.6, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <cylinderGeometry args={[0.03, 0.03, 0.4]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                    transmission={0.9}
                />
            </mesh>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FRASCO COLETOR (Erlenmeyer) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[0.8, 0, 0]}>
                {/* Corpo cônico */}
                <mesh>
                    <cylinderGeometry args={[0.05, 0.2, 0.4, 32]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                    />
                </mesh>

                {/* Pescoço */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.04, 0.05, 0.15]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                        transmission={0.9}
                    />
                </mesh>

                {/* Destilado coletado */}
                {state.distillateVolume > 0 && (
                    <mesh position={[0, -0.15 + (state.distillateVolume / 200) * 0.15, 0]}>
                        <cylinderGeometry args={[
                            0.08 + (state.distillateVolume / 200) * 0.1,
                            0.18,
                            Math.min(state.distillateVolume / 200, 0.35),
                            24
                        ]} />
                        <meshPhysicalMaterial
                            color={distillateColor}
                            transparent
                            opacity={0.6}
                            roughness={0.1}
                        />
                    </mesh>
                )}

                {/* Label */}
                <Text
                    position={[0, -0.35, 0.2]}
                    fontSize={0.06}
                    color="#ffffff"
                >
                    {state.distillateVolume.toFixed(1)} mL
                </Text>
            </group>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SUPORTE / TRIPÉ */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[0, -0.3, 0]}>
                {/* Base */}
                <mesh position={[-0.8, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.15, 0.2, 32]} />
                    <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
                </mesh>

                {/* Pernas do tripé */}
                {[0, 2, 4].map((i) => (
                    <mesh
                        key={i}
                        position={[
                            -0.8 + Math.cos(i * Math.PI / 3) * 0.18,
                            -0.15,
                            Math.sin(i * Math.PI / 3) * 0.18
                        ]}
                    >
                        <cylinderGeometry args={[0.015, 0.02, 0.3]} />
                        <meshStandardMaterial color="#333" metalness={0.8} />
                    </mesh>
                ))}
            </group>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PARTÍCULAS DE VAPOR */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {vaporParticles.map(particle => (
                <mesh key={particle.id} position={particle.position}>
                    <sphereGeometry args={[0.02 + Math.random() * 0.01, 8, 8]} />
                    <meshBasicMaterial
                        color={distillateColor}
                        transparent
                        opacity={0.6 * (1 - particle.progress)}
                    />
                </mesh>
            ))}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* DISPLAY DE INFORMAÇÕES */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[0, -0.7, 0]}>
                <Text
                    fontSize={0.08}
                    color="#ff8800"
                >
                    T: {state.temperature.toFixed(1)}°C
                </Text>

                {state.currentFraction && (
                    <Text
                        position={[0, -0.12, 0]}
                        fontSize={0.06}
                        color="#00ff00"
                    >
                        Destilando: {state.currentFraction.name} ({state.currentFraction.formula})
                    </Text>
                )}

                {state.fractionCollected.length > 0 && (
                    <Text
                        position={[0, -0.24, 0]}
                        fontSize={0.05}
                        color="#aaaaaa"
                    >
                        Frações: {state.fractionCollected.map(f => f.component.name).join(', ')}
                    </Text>
                )}
            </group>
        </group>
    )
}
