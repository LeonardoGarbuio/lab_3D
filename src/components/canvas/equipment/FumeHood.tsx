// src/components/canvas/equipment/FumeHood.tsx
// Capela de exaustão para trabalho com substâncias perigosas
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

interface FumeHoodProps {
    position: [number, number, number]
    scale?: number
    isOn?: boolean          // Exaustor ligado
    sashHeight?: number     // Altura da guilhotina (0 a 1)
    interiorColor?: string
}

export default function FumeHood({
    position,
    scale = 1,
    isOn = true,
    sashHeight = 0.5,
    interiorColor = '#e8e8e8'
}: FumeHoodProps) {
    const groupRef = useRef<Group>(null)
    const fanRef = useRef<Mesh>(null)

    const width = 0.8 * scale
    const height = 0.7 * scale
    const depth = 0.5 * scale
    const wallThickness = 0.015 * scale

    // Animação do ventilador
    useFrame(() => {
        if (fanRef.current && isOn) {
            fanRef.current.rotation.z += 0.3
        }
    })

    return (
        <group ref={groupRef} position={position}>
            {/* Base/bancada da capela */}
            <mesh position={[0, -height / 2 - 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[width + 0.1, 0.2 * scale, depth + 0.1]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>

            {/* Paredes laterais */}
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[side * (width / 2 + wallThickness / 2), 0, 0]}
                    castShadow
                >
                    <boxGeometry args={[wallThickness, height, depth]} />
                    <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
                </mesh>
            ))}

            {/* Parede traseira */}
            <mesh position={[0, 0, -depth / 2]} castShadow>
                <boxGeometry args={[width, height, wallThickness]} />
                <meshStandardMaterial color={interiorColor} roughness={0.7} />
            </mesh>

            {/* Teto */}
            <mesh position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[width + wallThickness * 2, wallThickness * 2, depth]} />
                <meshStandardMaterial color="#d0d0d0" roughness={0.5} />
            </mesh>

            {/* Piso da capela */}
            <mesh position={[0, -height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial
                    color="#3a3a3a"
                    roughness={0.3}
                    metalness={0.2}
                />
            </mesh>

            {/* Guilhotina de vidro (sash) */}
            <mesh
                position={[0, -height / 2 + height * sashHeight / 2, depth / 2 - 0.01]}
                castShadow
            >
                <boxGeometry args={[width - 0.02, height * sashHeight, 0.008 * scale]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.15}
                    roughness={0.02}
                />
            </mesh>

            {/* Frame da guilhotina */}
            <mesh position={[0, -height / 2 + height * sashHeight, depth / 2]}>
                <boxGeometry args={[width, 0.02 * scale, 0.02 * scale]} />
                <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Exaustor no topo */}
            <group position={[0, height / 2 + 0.08, -depth / 4]}>
                {/* Caixa do exaustor */}
                <mesh>
                    <boxGeometry args={[0.2 * scale, 0.15 * scale, 0.2 * scale]} />
                    <meshStandardMaterial color="#444444" roughness={0.7} />
                </mesh>

                {/* Grade do ventilador */}
                <mesh position={[0, -0.076, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.08 * scale, 24]} />
                    <meshStandardMaterial
                        color="#333333"
                        wireframe
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* Pás do ventilador */}
                <group ref={fanRef} position={[0, -0.05, 0]}>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh
                            key={i}
                            rotation={[Math.PI / 2, 0, (i * Math.PI) / 2]}
                            position={[
                                Math.cos((i * Math.PI) / 2) * 0.04 * scale,
                                0,
                                Math.sin((i * Math.PI) / 2) * 0.04 * scale
                            ]}
                        >
                            <boxGeometry args={[0.06 * scale, 0.01 * scale, 0.015 * scale]} />
                            <meshStandardMaterial
                                color={isOn ? "#666666" : "#888888"}
                                metalness={0.5}
                            />
                        </mesh>
                    ))}
                </group>

                {/* Duto de exaustão */}
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.06 * scale, 0.08 * scale, 0.1 * scale, 12]} />
                    <meshStandardMaterial color="#555555" roughness={0.6} />
                </mesh>
            </group>

            {/* Luz interna */}
            <group position={[0, height / 2 - 0.08, 0]}>
                <mesh>
                    <boxGeometry args={[width * 0.7, 0.02 * scale, 0.06 * scale]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive={isOn ? "#ffffee" : "#000000"}
                        emissiveIntensity={isOn ? 0.5 : 0}
                    />
                </mesh>
                {isOn && (
                    <rectAreaLight
                        intensity={2}
                        width={width * 0.6}
                        height={0.05}
                        position={[0, -0.02, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                )}
            </group>

            {/* Painel de controle */}
            <group position={[-width / 2 - 0.04, 0, depth / 2 - 0.05]}>
                <mesh>
                    <boxGeometry args={[0.06 * scale, 0.12 * scale, 0.02 * scale]} />
                    <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>

                {/* LED indicador */}
                <mesh position={[0, 0.04, 0.011]}>
                    <circleGeometry args={[0.008 * scale, 12]} />
                    <meshStandardMaterial
                        color={isOn ? "#00ff00" : "#333333"}
                        emissive={isOn ? "#00ff00" : "#000000"}
                        emissiveIntensity={isOn ? 2 : 0}
                    />
                </mesh>

                {/* Botão */}
                <mesh position={[0, -0.02, 0.012]}>
                    <cylinderGeometry args={[0.012 * scale, 0.012 * scale, 0.01 * scale, 12]} />
                    <meshStandardMaterial color="#cc0000" roughness={0.4} />
                </mesh>
            </group>

            {/* Etiqueta de segurança */}
            <mesh position={[width / 3, height / 2 - 0.05, depth / 2 + 0.001]}>
                <planeGeometry args={[0.1 * scale, 0.04 * scale]} />
                <meshStandardMaterial color="#ffcc00" />
            </mesh>

            {/* Indicador de fluxo de ar (quando ligado) */}
            {isOn && (
                <pointLight
                    position={[0, height / 4, 0]}
                    color="#e8f4ff"
                    intensity={0.2}
                    distance={1}
                />
            )}
        </group>
    )
}
