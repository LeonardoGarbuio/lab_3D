// src/components/equipment/DistillationApparatus.tsx
// Equipamento de destilação fracionada 3D completo

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Html } from '@react-three/drei'
import type { DistillationState } from '../../systems/DistillationSystem'
import {
    createInitialDistillationState,
    updateDistillation,
    DISTILLATION_MIXTURES,
} from '../../systems/DistillationSystem'

interface DistillationApparatusProps {
    position: [number, number, number]
    scale?: number
    mixtureId?: keyof typeof DISTILLATION_MIXTURES
    isHeating?: boolean
    onClick?: () => void
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
    onClick,
    onStateChange
}: DistillationApparatusProps) {
    const groupRef = useRef<THREE.Group>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [state, setState] = useState<DistillationState>(() => createInitialDistillationState(mixtureId))
    const mutableState = useRef<DistillationState>(state)
    const lastUiUpdate = useRef(0)

    // Otimização: Object pool para vapor
    const MAX_PARTICLES = 30
    const vaporData = useRef<VaporParticle[]>(Array.from({ length: MAX_PARTICLES }, (_, i) => ({
        id: i, position: new THREE.Vector3(), progress: 2, speed: 0 // progress > 1 means inactive
    })))
    const vaporRefs = useRef<(THREE.Mesh | null)[]>([])
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
        let simState = mutableState.current
        simState.isHeating = isHeating
        
        // updateDistillation retorna um novo estado! Devemos reatribuir!
        simState = updateDistillation(simState, delta)
        mutableState.current = simState

        const now = performance.now()

        // Publish live data for UI panel
        ;(window as any).__distillationLiveData = {
            temperature: simState.temperature,
            vaporizing: simState.vaporizing,
            vaporRate: simState.vaporRate,
            distillateVolume: simState.distillateVolume,
            currentFraction: simState.currentFraction?.name || null,
            condenserTemp: simState.condenserTemperature,
            fractionCollected: simState.fractionCollected?.map((f: any) => ({
                name: f.name || f.component?.name || 'Fração',
                volume: f.volume || 0,
                bp: f.boilingPoint || f.component?.boilingPoint || 0,
            })) || [],
        }

        // Throttle UI updates
        if (now - lastUiUpdate.current > 500) {
            setState({ ...simState })
            onStateChange?.({ ...simState })
            lastUiUpdate.current = now
        }

        // Criar partículas de vapor
        if (simState.vaporizing && simState.vaporRate > 0) {
            const interval = 1000 / (simState.vaporRate * 10)

            if (now - lastParticleTime.current > interval) {
                // Encontrar partícula livre
                const idleIndex = vaporData.current.findIndex(p => p.progress > 1.05)
                if (idleIndex !== -1) {
                    const p = vaporData.current[idleIndex]
                    p.progress = 0
                    p.speed = 0.2 + Math.random() * 0.1
                    lastParticleTime.current = now
                }
            }
        }

        // Atualizar físicas do vapor diretamente nos refs
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = vaporData.current[i]
            if (p.progress <= 1.05) {
                p.progress += p.speed * delta
                // Obter ponto da curva se estiver visível
                if (p.progress <= 1.0) {
                    vaporPath.getPoint(p.progress, p.position)
                }
                
                const mesh = vaporRefs.current[i]
                if (mesh) {
                    if (p.progress <= 1.0) {
                        mesh.position.copy(p.position)
                        mesh.visible = true
                        const mat = mesh.material as THREE.MeshBasicMaterial
                        mat.opacity = 0.6 * (1 - p.progress)
                    } else {
                        mesh.visible = false
                    }
                }
            }
        }
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
            {/* HITBOX INVISÍVEL OTIMIZADA PARA RAYCAST */}
            <mesh 
                position={[0, 0.5, 0]}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick?.(); 
                }}
                onPointerEnter={(e) => { 
                    e.stopPropagation(); 
                    setIsHovered(true); 
                    document.body.style.cursor = 'pointer'; 
                }}
                onPointerLeave={(e) => { 
                    e.stopPropagation(); 
                    setIsHovered(false); 
                    document.body.style.cursor = 'default'; 
                }}
            >
                <boxGeometry args={[3.0, 3.0, 2.0]} />
                <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
            </mesh>

            {/* Tooltip Hover */}
            {isHovered && (
                <Html position={[0, 2.0, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Destilação Fracionada
                    </div>
                </Html>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* BALÃO DE DESTILAÇÃO (Frasco de Fundo Redondo) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[-0.8, 0, 0]}>
                {/* Corpo esférico */}
                <mesh position={[0, 0.2, 0]}>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshStandardMaterial
                        color={isHovered ? "#e0f7fa" : "#ffffff"}
                        transparent
                        opacity={isHovered ? 0.35 : 0.2}
                        roughness={0}
                    />
                </mesh>

                {/* Pescoço */}
                <mesh position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[0.05, 0.1, 0.4]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                    />
                </mesh>

                {/* Líquido */}
                {liquidLevel > 0 && (
                    <mesh position={[0, 0.2 - (0.3 - liquidLevel * 0.5) / 2, 0]}>
                        <sphereGeometry args={[0.28 * Math.sqrt(liquidLevel / 0.5), 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                        <meshStandardMaterial
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
                        <meshStandardMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.3}
                            roughness={0}
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
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
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
                    <meshStandardMaterial
                        color="#e0f7ff"
                        transparent
                        opacity={0.3}
                        roughness={0}
                    />
                </mesh>

                {/* Tubo interno */}
                <mesh>
                    <cylinderGeometry args={[0.04, 0.04, 0.9]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                    />
                </mesh>

                {/* Água de refrigeração (visual) */}
                <mesh>
                    <cylinderGeometry args={[0.1, 0.1, 0.75]} />
                    <meshStandardMaterial
                        color="#4a90d9"
                        transparent
                        opacity={0.3}
                        roughness={0.2}
                    />
                </mesh>

                {/* Entrada de água (em baixo) */}
                <mesh position={[0.12, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
                </mesh>

                {/* Saída de água (em cima) */}
                <mesh position={[0.12, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
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
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.2}
                    roughness={0}
                />
            </mesh>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FRASCO COLETOR (Erlenmeyer) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <group position={[0.8, 0, 0]}>
                {/* Corpo cônico */}
                <mesh>
                    <cylinderGeometry args={[0.05, 0.2, 0.4, 32]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
                    />
                </mesh>

                {/* Pescoço */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.04, 0.05, 0.15]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.2}
                        roughness={0}
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
                        <meshStandardMaterial
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
            {/* PARTÍCULAS DE VAPOR (Object Pool estático) */}
            {Array.from({ length: MAX_PARTICLES }).map((_, i) => (
                <mesh 
                    key={i} 
                    ref={el => vaporRefs.current[i] = el}
                    visible={false}
                >
                    <sphereGeometry args={[0.025, 8, 8]} />
                    <meshBasicMaterial
                        color={distillateColor}
                        transparent
                        opacity={0.6}
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

                {state.mixture && (
                    <Text
                        position={[0, -0.32, 0]}
                        fontSize={0.045}
                        color="#00ffff"
                    >
                        Total Vapor P: {(state.vaporRate * 100 > 0 ? (760 * Math.min(1, state.vaporRate / 0.15)).toFixed(0) : (state.temperature * 7.6).toFixed(0))} mmHg
                    </Text>
                )}
            </group>
        </group>
    )
}
