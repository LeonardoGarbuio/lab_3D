// src/components/equipment/ElectrolysisCell.tsx
// Célula eletrolítica 3D interativa

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Html } from '@react-three/drei'
import type { ElectrolysisState } from '../../systems/ElectrolysisSystem'
import {
    createInitialElectrolysisState,
    updateElectrolysis,
    predictElectrolysisProducts,
    calculateCurrent,
    ELECTROLYTES,
    getProductColor
} from '../../systems/ElectrolysisSystem'

interface ElectrolysisCellProps {
    position: [number, number, number]
    scale?: number
    electrolyteId?: keyof typeof ELECTROLYTES
    voltage?: number
    isRunning?: boolean
    onClick?: () => void
    onStateChange?: (state: ElectrolysisState) => void
}

interface Bubble {
    id: number
    x: number
    y: number
    z: number
    size: number
    speed: number
    electrode: 'cathode' | 'anode'
    active: boolean
}

export function ElectrolysisCell({
    position,
    scale = 1,
    electrolyteId = 'sulfuricAcid',
    voltage = 0,
    isRunning = false,
    onClick,
    onStateChange
}: ElectrolysisCellProps) {
    const containerRef = useRef<THREE.Group>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [state, setState] = useState<ElectrolysisState>(() => {
        const initial = createInitialElectrolysisState()
        initial.electrolyte = ELECTROLYTES[electrolyteId] || null
        return initial
    })
    const mutableState = useRef<ElectrolysisState>(state)
    const lastUiUpdate = useRef(0)

    // Otimização: Object pool para bolhas
    const MAX_BUBBLES = 40
    const bubblesData = useRef<Bubble[]>(Array.from({ length: MAX_BUBBLES }, (_, i) => ({
        id: i, x: 0, y: 10, z: 0, size: 0.02, speed: 0, electrode: 'cathode', active: false
    })))
    const bubbleRefs = useRef<(THREE.Mesh | null)[]>([])
    const lastBubbleTime = useRef({ cathode: 0, anode: 0 })

    // Calcular produtos
    const products = useMemo(() => {
        if (!state.electrolyte) return null
        return predictElectrolysisProducts(state.electrolyte)
    }, [state.electrolyte])

    // Cores dos produtos
    const cathodeColor = products ? getProductColor(products.cathodeProduct) : '#ffffff'
    const anodeColor = products ? getProductColor(products.anodeProduct) : '#ffffff'

    useFrame((_, delta) => {
        let simState = mutableState.current
        const wasRunning = simState.isRunning
        simState.voltage = voltage
        simState.isRunning = isRunning
        simState.electrolyte = ELECTROLYTES[electrolyteId] || null

        if (simState.electrolyte && isRunning) {
            simState = updateElectrolysis(simState, delta)
            mutableState.current = simState

            // Publish live data for UI panel
            const prods = products;
            (window as any).__electrolysisLiveData = {
                current: simState.current,
                gasCathode: simState.cathode.gasVolume,
                gasAnode: simState.anode.gasVolume,
                cathodeProduct: prods?.cathodeProduct || '',
                anodeProduct: prods?.anodeProduct || '',
                overallReaction: prods?.overallReaction || '',
                voltageRequired: prods?.voltageRequired || 0,
                concentration: simState.electrolyte?.concentration || 0,
            }
            
            // Limit UI React renders
            const now = performance.now()
            if (now - lastUiUpdate.current > 500) {
                setState({ ...simState })
                onStateChange?.({ ...simState })
                lastUiUpdate.current = now
            }
        } else if (wasRunning && !isRunning) {
            simState.cathode.isActive = false
            simState.anode.isActive = false
            mutableState.current = simState
            setState({ ...simState })
            onStateChange?.({ ...simState })
        }

        if (simState.electrolyte && isRunning) {
            const now = performance.now()
            if (simState.current > 0) {
                if (simState.cathode.bubbleRate > 0) {
                    const cathodeBubbleInterval = 1000 / simState.cathode.bubbleRate
                    if (now - lastBubbleTime.current.cathode > cathodeBubbleInterval) {
                        spawnBubble('cathode')
                        lastBubbleTime.current.cathode = now
                    }
                }

                if (simState.anode.bubbleRate > 0) {
                    const anodeBubbleInterval = 1000 / simState.anode.bubbleRate
                    if (now - lastBubbleTime.current.anode > anodeBubbleInterval) {
                        spawnBubble('anode')
                        lastBubbleTime.current.anode = now
                    }
                }
            }
        }

        // Atualizar físicas diretas das bolhas
        for (let i = 0; i < MAX_BUBBLES; i++) {
            const b = bubblesData.current[i]
            if (b.active) {
                b.y += b.speed * delta
                if (b.y > 0.8) {
                    b.active = false
                    b.y = 10 // Esconder fora da tela
                }
                const mesh = bubbleRefs.current[i]
                if (mesh) {
                    mesh.position.set(b.x, b.y, b.z)
                }
            }
        }
    })

    function spawnBubble(electrode: 'cathode' | 'anode') {
        // Encontrar bolha inativa (Pool)
        const bubbleIndex = bubblesData.current.findIndex(b => !b.active)
        if (bubbleIndex !== -1) {
            const b = bubblesData.current[bubbleIndex]
            b.electrode = electrode
            b.x = (electrode === 'cathode' ? -0.25 : 0.25) + (Math.random() - 0.5) * 0.1
            b.y = -0.3
            b.z = (Math.random() - 0.5) * 0.1
            b.size = 0.02 + Math.random() * 0.02
            b.speed = 0.3 + Math.random() * 0.2
            b.active = true
            
            const mesh = bubbleRefs.current[bubbleIndex]
            if (mesh) {
                mesh.scale.setScalar(b.size / 0.02) // Normalizando escala visual
                // Atualizar cor material hackish
                const material = mesh.material as THREE.MeshStandardMaterial
                material.color.set(electrode === 'cathode' ? cathodeColor : anodeColor)
            }
        }
    }

    // Cor do eletrólito
    const electrolyteColor = state.electrolyte?.color || '#4a90d9'

    // Verificar se há deposição de metal no cátodo
    const hasMetalDeposit = state.cathode.depositMass > 0 && products?.cathodeProduct !== 'H₂'

    return (
        <group ref={containerRef} position={position} scale={scale}>
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
                <boxGeometry args={[2.0, 3.0, 2.0]} />
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
                        Célula Eletrolítica
                    </div>
                </Html>
            )}

            {/* Recipiente de vidro */}
            <mesh>
                <boxGeometry args={[1.2, 1.5, 0.8]} />
                <meshStandardMaterial
                    color={isHovered ? "#e0f7fa" : "#ffffff"}
                    transparent
                    opacity={isHovered ? 0.3 : 0.15}
                    roughness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Solução eletrolítica */}
            <mesh position={[0, -0.15, 0]}>
                <boxGeometry args={[1.1, 1.1, 0.7]} />
                <meshStandardMaterial
                    color={electrolyteColor}
                    transparent
                    opacity={0.5}
                    roughness={0.1}
                />
            </mesh>

            {/* Cátodo (eletrodo negativo - esquerda) */}
            <group position={[-0.35, 0, 0]}>
                {/* Haste do eletrodo */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Placa do eletrodo */}
                <mesh position={[0, -0.2, 0]}>
                    <boxGeometry args={[0.02, 0.6, 0.4]} />
                    <meshStandardMaterial
                        color={hasMetalDeposit ? getProductColor(products?.cathodeProduct || '') : '#444'}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>

                {/* Brilho quando ativo */}
                {state.cathode.isActive && (
                    <pointLight
                        position={[0, -0.2, 0.3]}
                        color="#00ff00"
                        intensity={0.5}
                        distance={0.5}
                    />
                )}

                {/* Símbolo - */}
                <Text
                    position={[0, 0.65, 0]}
                    fontSize={0.12}
                    color="#ff4444"
                    anchorX="center"
                    anchorY="middle"
                >
                    − Cátodo
                </Text>
            </group>

            {/* Ânodo (eletrodo positivo - direita) */}
            <group position={[0.35, 0, 0]}>
                {/* Haste do eletrodo */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Placa do eletrodo */}
                <mesh position={[0, -0.2, 0]}>
                    <boxGeometry args={[0.02, 0.6, 0.4]} />
                    <meshStandardMaterial
                        color="#444"
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>

                {/* Brilho quando ativo */}
                {state.anode.isActive && (
                    <pointLight
                        position={[0, -0.2, 0.3]}
                        color="#ff6600"
                        intensity={0.5}
                        distance={0.5}
                    />
                )}

                {/* Símbolo + */}
                <Text
                    position={[0, 0.65, 0]}
                    fontSize={0.12}
                    color="#44ff44"
                    anchorX="center"
                    anchorY="middle"
                >
                    + Ânodo
                </Text>
            </group>

            {/* Bolhas de gás (Object Pool estático no React) */}
            {Array.from({ length: MAX_BUBBLES }).map((_, i) => (
                <mesh
                    key={i}
                    ref={el => bubbleRefs.current[i] = el}
                    position={[0, 10, 0]} // Escondido por padrão
                >
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.7}
                        roughness={0}
                    />
                </mesh>
            ))}

            {/* Fios elétricos */}
            <Wire from={[-0.35, 0.6, 0]} to={[-0.6, 0.8, 0]} color="#aa0000" />
            <Wire from={[0.35, 0.6, 0]} to={[0.6, 0.8, 0]} color="#00aa00" />

            {/* Fonte de energia (bateria visual) */}
            <group position={[0, 1.1, 0]}>
                <mesh>
                    <boxGeometry args={[0.6, 0.25, 0.2]} />
                    <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
                </mesh>

                {/* Terminal negativo */}
                <mesh position={[-0.22, 0.13, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.05]} />
                    <meshStandardMaterial color="#aa0000" metalness={0.8} />
                </mesh>

                {/* Terminal positivo */}
                <mesh position={[0.22, 0.13, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.05]} />
                    <meshStandardMaterial color="#00aa00" metalness={0.8} />
                </mesh>

                {/* Display de voltagem */}
                <Text
                    position={[0, 0, 0.11]}
                    fontSize={0.08}
                    color="#00ff00"
                    anchorX="center"
                    anchorY="middle"
                >
                    {voltage.toFixed(1)}V
                </Text>
            </group>

            {/* Informações do estado */}
            {isRunning && products && (
                <group position={[0, 1.8, 0]}>
                    <Text
                        position={[-0.4, 0, 0]}
                        fontSize={0.06}
                        color="#ffffff"
                        anchorX="center"
                    >
                        {products.cathodeProduct}: {state.cathode.gasVolume.toFixed(2)} mL
                    </Text>
                    <Text
                        position={[0.4, 0, 0]}
                        fontSize={0.06}
                        color="#ffffff"
                        anchorX="center"
                    >
                        {products.anodeProduct}: {state.anode.gasVolume.toFixed(2)} mL
                    </Text>
                    <Text
                        position={[0, -0.12, 0]}
                        fontSize={0.05}
                        color="#aaaaaa"
                        anchorX="center"
                    >
                        I = {(state.current * 1000).toFixed(1)} mA
                    </Text>
                    <Text
                        position={[0, -0.18, 0]}
                        fontSize={0.045}
                        color="#00ffff"
                        anchorX="center"
                    >
                        Nernst E_req: {products.voltageRequired.toFixed(2)}V
                    </Text>
                    <Text
                        position={[0, -0.24, 0]}
                        fontSize={0.045}
                        color="#ff00ff"
                        anchorX="center"
                    >
                        [Concentração]: {state.electrolyte?.concentration.toFixed(4)} M
                    </Text>
                </group>
            )}
        </group>
    )
}

// Componente de fio elétrico
function Wire({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
    const points = useMemo(() => {
        return [
            new THREE.Vector3(...from),
            new THREE.Vector3((from[0] + to[0]) / 2, from[1] + 0.1, from[2]),
            new THREE.Vector3(...to)
        ]
    }, [from, to])

    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])

    return (
        <mesh>
            <tubeGeometry args={[curve, 10, 0.01, 8, false]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
    )
}
