// src/components/equipment/Manometer.tsx
// Manômetro visual para medição de pressão de gases

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Html } from '@react-three/drei'

interface ManometerProps {
    position: [number, number, number]
    pressure: number             // Pressão em atm
    minPressure?: number         // Pressão mínima da escala
    maxPressure?: number         // Pressão máxima da escala
    unit?: 'atm' | 'kPa' | 'bar' | 'psi'
    size?: number
    showDigital?: boolean
    dangerZone?: number          // Pressão a partir da qual fica vermelho
}

export function Manometer({
    position,
    pressure,
    minPressure = 0,
    maxPressure = 5,
    unit = 'atm',
    size = 0.3,
    showDigital = true,
    dangerZone = 4
}: ManometerProps) {
    const needleRef = useRef<THREE.Group>(null)
    const currentAngleRef = useRef(0)
    const [hovered, setHovered] = useState(false)

    // Converter pressão para outras unidades
    const convertPressure = (atmPressure: number): number => {
        switch (unit) {
            case 'kPa': return atmPressure * 101.325
            case 'bar': return atmPressure * 1.01325
            case 'psi': return atmPressure * 14.696
            default: return atmPressure
        }
    }

    // Calcular ângulo do ponteiro (0° = minPressure, 270° = maxPressure)
    const targetAngle = (() => {
        const normalizedPressure = (pressure - minPressure) / (maxPressure - minPressure)
        const clampedPressure = Math.max(0, Math.min(1, normalizedPressure))
        // Ângulo varia de -135° a +135° (270° total)
        return -135 + clampedPressure * 270
    })()

    // Animação suave do ponteiro
    useFrame((_, delta) => {
        if (!needleRef.current) return

        // Interpolação suave
        const angleDiff = targetAngle - currentAngleRef.current
        currentAngleRef.current += angleDiff * Math.min(delta * 5, 1)

        needleRef.current.rotation.z = THREE.MathUtils.degToRad(-currentAngleRef.current)
    })

    // Cor baseada na pressão
    const getPressureColor = () => {
        if (pressure >= dangerZone) return '#ff0000'
        if (pressure >= dangerZone * 0.8) return '#ff8800'
        if (pressure >= dangerZone * 0.6) return '#ffff00'
        return '#00ff00'
    }

    // Gerar marcas da escala
    const scaleMarks = []
    const numMarks = 11
    for (let i = 0; i <= numMarks; i++) {
        const angle = -135 + (i / numMarks) * 270
        const radAngle = THREE.MathUtils.degToRad(angle)
        const innerRadius = size * 0.7
        const outerRadius = size * 0.85
        const isMajor = i % 2 === 0

        scaleMarks.push({
            angle,
            x1: Math.sin(radAngle) * innerRadius,
            y1: Math.cos(radAngle) * innerRadius,
            x2: Math.sin(radAngle) * outerRadius,
            y2: Math.cos(radAngle) * outerRadius,
            major: isMajor,
            value: minPressure + (i / numMarks) * (maxPressure - minPressure)
        })
    }

    const displayValue = convertPressure(pressure)

    return (
        <group position={position}>
            {/* HITBOX INTERATIVA */}
            <mesh
                visible={false}
                position={[0, 0, 0]}
                onClick={(e) => e.stopPropagation()}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
            >
                <cylinderGeometry args={[size * 1.2, size * 1.2, size * 0.5, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {hovered && (
                <Html position={[0, size * 0.6, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 247, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #00f7ff',
                        padding: '8px 16px', borderRadius: '8px',
                        color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,247,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                        Manometro
                    </div>
                </Html>
            )}

            {/* Caixa do manometro */}
            <mesh>
                <cylinderGeometry args={[size, size * 1.1, size * 0.3, 32]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Face do manômetro */}
            <mesh position={[0, 0, size * 0.16]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[size * 0.9, 64]} />
                <meshStandardMaterial color="#f5f5f0" />
            </mesh>

            {/* Vidro protetor */}
            <mesh position={[0, 0, size * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[size * 0.88, 64]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.1}
                    roughness={0}
                />
            </mesh>

            {/* Marcas da escala */}
            {scaleMarks.map((mark, i) => (
                <group key={i}>
                    <mesh position={[(mark.x1 + mark.x2) / 2, 0, (mark.y1 + mark.y2) / 2 + size * 0.16]}>
                        <boxGeometry args={[
                            0.003,
                            size * 0.02,
                            mark.major ? 0.03 : 0.015
                        ]} />
                        <meshBasicMaterial color={
                            mark.value >= dangerZone ? '#ff0000' : '#333'
                        } />
                    </mesh>

                    {/* Números nas marcas principais */}
                    {mark.major && (
                        <Text
                            position={[
                                Math.sin(THREE.MathUtils.degToRad(mark.angle)) * size * 0.55,
                                size * 0.17,
                                Math.cos(THREE.MathUtils.degToRad(mark.angle)) * size * 0.55
                            ]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={size * 0.1}
                            color="#333"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {mark.value.toFixed(1)}
                        </Text>
                    )}
                </group>
            ))}

            {/* Zona de perigo (arco vermelho) */}
            <mesh position={[0, size * 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[
                    size * 0.75,
                    size * 0.85,
                    32,
                    1,
                    THREE.MathUtils.degToRad(135 - ((maxPressure - dangerZone) / (maxPressure - minPressure)) * 270),
                    THREE.MathUtils.degToRad(((maxPressure - dangerZone) / (maxPressure - minPressure)) * 270)
                ]} />
                <meshBasicMaterial color="#ff0000" opacity={0.25} transparent side={THREE.DoubleSide} />
            </mesh>

            {/* Ponteiro */}
            <group ref={needleRef} position={[0, size * 0.17, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[size * 0.03, size * 0.75, 8]} />
                    <meshStandardMaterial color={getPressureColor()} metalness={0.5} />
                </mesh>

                {/* Centro do ponteiro */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[size * 0.05, size * 0.05, 0.01]} />
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>
            </group>

            {/* Display digital */}
            {showDigital && (
                <group position={[0, size * 0.18, -size * 0.3]}>
                    <mesh>
                        <boxGeometry args={[size * 0.6, 0.02, size * 0.2]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <Text
                        position={[0, 0.015, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={size * 0.12}
                        color={getPressureColor()}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {displayValue.toFixed(2)} {unit}
                    </Text>
                </group>
            )}

            {/* Unidade no centro */}
            <Text
                position={[0, size * 0.17, -size * 0.15]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={size * 0.08}
                color="#666"
                anchorX="center"
            >
                {unit.toUpperCase()}
            </Text>

            {/* Conexão (tubo) */}
            <mesh position={[0, -size * 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[size * 0.08, size * 0.08, size * 0.15]} />
                <meshStandardMaterial color="#777" metalness={0.7} />
            </mesh>
        </group>
    )
}
