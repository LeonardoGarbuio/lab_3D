// src/components/canvas/equipment/InteractiveDevices.tsx
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useLabStore } from '../../../stores/useLabStore'

interface DeviceProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    scale?: number
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE BASE: TOOLTIP E INTERAÇÃO
// ═══════════════════════════════════════════════════════════════════════
function InteractiveDeviceWrapper({
    children, name, onClick, position, rotation, scale = 1
}: { children: React.ReactNode, name: string, onClick: () => void } & DeviceProps) {
    const [hovered, setHovered] = useState(false)
    const { isSoundEnabled } = useLabStore()

    // Efeito de flutuar levemente o tooltip
    const htmlRef = useRef<HTMLDivElement>(null)

    // Animação de escala suave (vetor cacheado para evitar GC)
    const innerGroupRef = useRef<THREE.Group>(null)
    const _targetVec = useRef(new THREE.Vector3(1, 1, 1))
    useFrame((_, delta) => {
        if (innerGroupRef.current) {
            const s = hovered ? 1.05 : 1
            _targetVec.current.set(s, s, s)
            innerGroupRef.current.scale.lerp(_targetVec.current, Math.min(10 * delta, 1))
        }
    })

    return (
        <group 
            position={position} 
            rotation={rotation || [0, 0, 0]} 
            scale={scale}
        >
            {/* HITBOX INVISÍVEL OTIMIZADA PARA RAYCAST */}
            <mesh 
                visible={false}
                position={[0, 0.5, 0]}
                onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                }}
                onPointerOver={(e) => {
                    e.stopPropagation()
                    setHovered(true)
                    document.body.style.cursor = 'pointer'
                }}
                onPointerOut={(e) => {
                    setHovered(false)
                    document.body.style.cursor = 'auto'
                }}
            >
                <boxGeometry args={[1.5, 2.5, 1.5]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Outline Effect ou leve aumento de escala no hover */}
            <group ref={innerGroupRef}>
                {children}
            </group>

            {hovered && (
                <Html position={[0, 1.5, 0]} center ref={htmlRef} style={{ pointerEvents: 'none' }}>
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
                        {name}
                    </div>
                </Html>
            )}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════════
// EQUIPAMENTOS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════════════

export function DeviceMicroscope(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Microscópio Quântico" onClick={store.openQuantumMicroscope} {...props}>
            <group position={[0, 0.5, 0]}>
                <mesh position={[0, -0.4, 0]}>
                    <boxGeometry args={[0.6, 0.2, 0.8]} />
                    <meshStandardMaterial color="#222" roughness={0.7} metalness={0.5} />
                </mesh>
                <mesh position={[0, 0.2, -0.2]} rotation={[0.4, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
                    <meshStandardMaterial color="#444" roughness={0.3} metalness={0.8} />
                </mesh>
                <mesh position={[0, -0.1, 0.1]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceNotebook(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Anotações" onClick={store.openNotebook} {...props}>
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.8, 0.1, 1.1]} />
                <meshStandardMaterial color="#1e3a5f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.11, 0]}>
                <planeGeometry args={[0.7, 1.0]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceReagentCabinet(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Estoque de Reagentes" onClick={store.openReagentPanel} {...props}>
            <group position={[0, 1.5, 0]}>
                <mesh>
                    <boxGeometry args={[2, 3, 1]} />
                    <meshStandardMaterial color="#aaa" roughness={0.4} metalness={0.8} />
                </mesh>
                <mesh position={[0, 0, 0.51]}>
                    <planeGeometry args={[1.8, 2.8]} />
                    <meshPhysicalMaterial color="#fff" transmission={0.9} opacity={1} transparent roughness={0.1} />
                </mesh>
                {/* Prateleiras representativas */}
                <mesh position={[0, 0.5, 0.2]}><boxGeometry args={[1.8, 0.05, 0.6]} /><meshStandardMaterial color="#888" /></mesh>
                <mesh position={[0, -0.5, 0.2]}><boxGeometry args={[1.8, 0.05, 0.6]} /><meshStandardMaterial color="#888" /></mesh>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceExperimentClipboard(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Guia de Experimentos" onClick={store.openExperimentPanel} {...props}>
            <group position={[0, 0.05, 0]}>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.9, 0.05, 1.2]} />
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.03, 0]}>
                    <planeGeometry args={[0.8, 1.1]} />
                    <meshStandardMaterial color="#eee" />
                </mesh>
                <mesh position={[0, 0.04, -0.5]}>
                    <boxGeometry args={[0.5, 0.05, 0.1]} />
                    <meshStandardMaterial color="#aaa" metalness={0.8} />
                </mesh>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceComputerTerminal(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Configuração Eletrônica" onClick={store.openElectronConfig} {...props}>
            <group position={[0, 0.5, 0]}>
                {/* Base */}
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.6, 0.1, 0.5]} /><meshStandardMaterial color="#222" /></mesh>
                <mesh position={[0, -0.2, -0.1]}><boxGeometry args={[0.2, 0.4, 0.2]} /><meshStandardMaterial color="#222" /></mesh>
                {/* Monitor */}
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[1.2, 0.8, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Tela */}
                <mesh position={[0, 0.2, 0.06]}>
                    <planeGeometry args={[1.1, 0.7]} />
                    <meshBasicMaterial color="#001100" />
                </mesh>
                {/* Texto verde fake */}
                <Text position={[-0.45, 0.4, 0.07]} fontSize={0.08} color="#00ff00" anchorX="left" anchorY="top">
                    {`> INIT\n> 1s2 2s2 2p6`}
                </Text>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceProjector(props: DeviceProps) {
    const store = useLabStore()
    const groupRef = useRef<THREE.Group>(null)
    
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.5
        }
    })

    return (
        <InteractiveDeviceWrapper name="Modelos Atômicos" onClick={store.openAtomicModels} {...props}>
            <group position={[0, 0.3, 0]}>
                {/* Base projetor */}
                <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.3, 0.4, 0.2, 16]} /><meshStandardMaterial color="#666" metalness={0.7} /></mesh>
                {/* Lente e holograma fake */}
                <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#00f7ff" emissive="#00f7ff" emissiveIntensity={0.5} /></mesh>
                <group ref={groupRef} position={[0, 0.8, 0]}>
                    <mesh><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="#ff0055" /></mesh>
                    <mesh position={[0.3, 0, 0]}><sphereGeometry args={[0.02, 16, 16]} /><meshStandardMaterial color="#00f7ff" /></mesh>
                    <mesh rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[0.3, 0.005, 16, 32]} /><meshBasicMaterial color="#00f7ff" opacity={0.3} transparent /></mesh>
                </group>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceSolidState(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Estado Sólido (Cristais)" onClick={store.openSolidState} {...props}>
            <group position={[0, 0.4, 0]}>
                <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.4, 0.4, 0.1, 16]} /><meshStandardMaterial color="#222" /></mesh>
                <group rotation={[0.5, 0.5, 0]}>
                    <mesh position={[-0.2, -0.2, -0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[0.2, -0.2, -0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[-0.2, 0.2, -0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[0.2, 0.2, -0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[-0.2, -0.2, 0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[0.2, -0.2, 0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[-0.2, 0.2, 0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    <mesh position={[0.2, 0.2, 0.2]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    {/* Centro */}
                    <mesh position={[0, 0, 0]}><sphereGeometry args={[0.08]} /><meshStandardMaterial color="#ffaa00" /></mesh>
                    {/* Linhas (GridHelper fake) */}
                    <gridHelper args={[0.4, 1, '#ffaa00', '#ffaa00']} rotation={[0, 0, 0]} position={[0, -0.2, 0]} />
                    <gridHelper args={[0.4, 1, '#ffaa00', '#ffaa00']} rotation={[0, 0, 0]} position={[0, 0.2, 0]} />
                </group>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceSPHTank(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Simulador SPH (Fluidos)" onClick={store.openIntermolecular} {...props}>
            <group position={[0, 0.5, 0]}>
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[1, 0.1, 1]} /><meshStandardMaterial color="#444" /></mesh>
                <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[0.9, 0.9, 0.9]} />
                    <meshPhysicalMaterial color="#4ecdc4" transmission={0.9} transparent opacity={1} roughness={0.1} thickness={0.5} />
                </mesh>
                {/* Partículas fake dentro do tanque */}
                <mesh position={[-0.2, -0.2, 0]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#fff" /></mesh>
                <mesh position={[0.1, 0.2, 0.2]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#fff" /></mesh>
                <mesh position={[0.2, -0.1, -0.2]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#fff" /></mesh>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DeviceNuclearReactor(props: DeviceProps) {
    const store = useLabStore()
    return (
        <InteractiveDeviceWrapper name="Física Nuclear" onClick={store.openNuclearPhysics} {...props}>
            <group position={[0, 0.6, 0]}>
                <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.6, 0.8, 0.2, 32]} /><meshStandardMaterial color="#222" /></mesh>
                <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 0.8, 32]} /><meshStandardMaterial color="#ddd" metalness={0.6} /></mesh>
                <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.5, 0.5, 0.2, 32]} /><meshStandardMaterial color="#ffff00" /></mesh>
                <Text position={[0, 0, 0.51]} fontSize={0.3} color="#000" rotation={[0, 0, 0]}>☢</Text>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DevicePeriodicTablePoster(props: DeviceProps) {
    const store = useLabStore()
    // Cores das famílias da tabela periódica
    const families = [
        { color: '#ff5555', positions: [[-1.5, 0.3], [-1.5, 0], [-1.5, -0.3]] },  // Alcalinos
        { color: '#ffaa00', positions: [[-1.3, 0], [-1.3, -0.3]] },                 // Alcalino-terrosos
        { color: '#fca311', positions: [[-1.1, -0.3], [-0.9, -0.3], [-0.7, -0.3], [-0.5, -0.3], [-0.3, -0.3], [-0.1, -0.3], [0.1, -0.3], [0.3, -0.3], [0.5, -0.3], [0.7, -0.3]] }, // Transição
        { color: '#4ecdc4', positions: [[0.9, -0.3], [1.1, -0.3]] },               // Metais
        { color: '#55aaff', positions: [[1.3, 0.3], [1.1, 0], [0.9, 0], [1.3, 0], [1.3, -0.3]] }, // Ametais
        { color: '#bd93f9', positions: [[1.5, 0], [1.5, -0.3]] },                   // Halogênios
        { color: '#ff79c6', positions: [[1.7, 0.3], [1.7, 0], [1.7, -0.3]] },       // Gases Nobres
    ]
    return (
        <InteractiveDeviceWrapper name="Tabela Periódica" onClick={store.openPeriodicTable} {...props}>
            <group position={[0, 0, 0]}>
                {/* Fundo escuro */}
                <mesh>
                    <planeGeometry args={[4.2, 2.7]} />
                    <meshStandardMaterial color="#050a15" />
                </mesh>
                {/* Moldura */}
                <mesh position={[0, 0, -0.02]}>
                    <planeGeometry args={[4.4, 2.9]} />
                    <meshStandardMaterial color="#00f7ff" emissive="#00f7ff" emissiveIntensity={0.1} />
                </mesh>
                {/* Título */}
                <Text position={[0, 1.0, 0.01]} fontSize={0.18} color="#00f7ff">
                    TABELA PERIÓDICA DOS ELEMENTOS
                </Text>
                {/* Grid de elementos como pequenas caixas coloridas */}
                <group position={[0, 0.1, 0.01]}>
                    {families.map((fam, fi) => 
                        fam.positions.map(([x, y], pi) => (
                            <mesh key={`${fi}-${pi}`} position={[x, y, 0]}>
                                <planeGeometry args={[0.15, 0.22]} />
                                <meshBasicMaterial color={fam.color} />
                            </mesh>
                        ))
                    )}
                </group>
                {/* Legenda */}
                <Text position={[0, -1.1, 0.01]} fontSize={0.1} color="#aaa">
                    Clique para abrir a tabela interativa
                </Text>
            </group>
        </InteractiveDeviceWrapper>
    )
}

export function DevicePropertiesPoster(props: DeviceProps) {
    const store = useLabStore()
    const bars = [
        { height: 0.5, color: '#ff6b6b', x: -0.6 },
        { height: 0.8, color: '#fca311', x: -0.2 },
        { height: 1.2, color: '#4ecdc4', x: 0.2 },
        { height: 1.5, color: '#00f7ff', x: 0.6 },
    ]
    return (
        <InteractiveDeviceWrapper name="Propriedades Periódicas" onClick={store.openPeriodicProperties} {...props}>
            <group position={[0, 0, 0]}>
                {/* Fundo */}
                <mesh>
                    <planeGeometry args={[3.2, 2.2]} />
                    <meshStandardMaterial color="#050a15" />
                </mesh>
                {/* Moldura */}
                <mesh position={[0, 0, -0.02]}>
                    <planeGeometry args={[3.4, 2.4]} />
                    <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.1} />
                </mesh>
                {/* Título */}
                <Text position={[0, 0.85, 0.01]} fontSize={0.15} color="#4ecdc4">
                    PROPRIEDADES PERIÓDICAS
                </Text>
                {/* Barras do gráfico */}
                <group position={[0, -0.2, 0.01]}>
                    {bars.map((bar, i) => (
                        <mesh key={i} position={[bar.x, bar.height / 2 - 0.3, 0]}>
                            <planeGeometry args={[0.3, bar.height]} />
                            <meshBasicMaterial color={bar.color} />
                        </mesh>
                    ))}
                    {/* Eixo X */}
                    <mesh position={[0, -0.32, 0]}>
                        <planeGeometry args={[2.0, 0.01]} />
                        <meshBasicMaterial color="#555" />
                    </mesh>
                </group>
                {/* Legenda */}
                <Text position={[0, -0.9, 0.01]} fontSize={0.08} color="#aaa">
                    Raio · Eletronegatividade · Energia de Ionização
                </Text>
            </group>
        </InteractiveDeviceWrapper>
    )
}
