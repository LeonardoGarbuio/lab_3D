// src/components/equipment/Thermometer.tsx
// Termômetro visual 3D para laboratório

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface ThermometerProps {
    position: [number, number, number]
    temperature: number          // Temperatura em Celsius
    minTemp?: number             // Temperatura mínima da escala
    maxTemp?: number             // Temperatura máxima da escala
    unit?: 'C' | 'K' | 'F'
    size?: number
    orientation?: 'vertical' | 'horizontal'
    showDigital?: boolean
    dangerTemp?: number          // Temperatura a partir da qual fica vermelho
}

export function Thermometer({
    position,
    temperature,
    minTemp = -20,
    maxTemp = 120,
    unit = 'C',
    size = 1,
    orientation = 'vertical',
    showDigital = true,
    dangerTemp = 100
}: ThermometerProps) {
    const mercuryRef = useRef<THREE.Mesh>(null)
    const currentHeightRef = useRef(0)

    // Converter temperatura para outras unidades
    const convertTemp = (celsius: number): number => {
        switch (unit) {
            case 'K': return celsius + 273.15
            case 'F': return (celsius * 9 / 5) + 32
            default: return celsius
        }
    }

    // Calcular altura do mercúrio
    const targetHeight = useMemo(() => {
        const normalized = (temperature - minTemp) / (maxTemp - minTemp)
        return Math.max(0, Math.min(1, normalized)) * size * 0.7
    }, [temperature, minTemp, maxTemp, size])

    // Animação suave do mercúrio
    useFrame((_, delta) => {
        if (!mercuryRef.current) return

        const diff = targetHeight - currentHeightRef.current
        currentHeightRef.current += diff * Math.min(delta * 3, 1)

        mercuryRef.current.scale.y = Math.max(0.01, currentHeightRef.current / (size * 0.35))
        mercuryRef.current.position.y = -size * 0.35 + currentHeightRef.current / 2
    })

    // Cor do mercúrio baseada na temperatura
    const getMercuryColor = () => {
        if (temperature >= dangerTemp) return '#ff0000'
        if (temperature >= dangerTemp * 0.8) return '#ff4400'
        if (temperature >= 0) return '#cc0000'
        return '#0066cc' // Azul para temperaturas negativas
    }

    // Gerar marcas da escala
    const scaleMarks = useMemo(() => {
        const marks = []
        const step = (maxTemp - minTemp) / 10

        for (let temp = minTemp; temp <= maxTemp; temp += step) {
            const normalized = (temp - minTemp) / (maxTemp - minTemp)
            const y = -size * 0.35 + normalized * size * 0.7
            const isMajor = Math.abs(temp % (step * 2)) < 0.1

            marks.push({
                y,
                temp,
                major: isMajor
            })
        }

        return marks
    }, [minTemp, maxTemp, size])

    const displayValue = convertTemp(temperature)
    const rotation: [number, number, number] = orientation === 'horizontal'
        ? [0, 0, Math.PI / 2]
        : [0, 0, 0]

    return (
        <group position={position} rotation={rotation}>
            {/* Tubo de vidro */}
            <mesh>
                <cylinderGeometry args={[size * 0.04, size * 0.04, size * 0.8, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0}
                    transmission={0.9}
                    thickness={0.01}
                />
            </mesh>

            {/* Tubo interno (para o mercúrio) */}
            <mesh>
                <cylinderGeometry args={[size * 0.02, size * 0.02, size * 0.75, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.1}
                    roughness={0}
                />
            </mesh>

            {/* Bulbo */}
            <mesh position={[0, -size * 0.45, 0]}>
                <sphereGeometry args={[size * 0.06, 16, 16]} />
                <meshStandardMaterial color={getMercuryColor()} />
            </mesh>

            {/* Mercúrio */}
            <mesh
                ref={mercuryRef}
                position={[0, -size * 0.35, 0]}
            >
                <cylinderGeometry args={[size * 0.015, size * 0.015, size * 0.7, 8]} />
                <meshStandardMaterial
                    color={getMercuryColor()}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Escala de fundo */}
            <mesh position={[size * 0.05, 0, -size * 0.02]}>
                <boxGeometry args={[size * 0.08, size * 0.75, size * 0.01]} />
                <meshStandardMaterial color="#f5f5f0" />
            </mesh>

            {/* Marcas da escala */}
            {scaleMarks.map((mark, i) => (
                <group key={i} position={[size * 0.05, mark.y, 0]}>
                    {/* Linha da marca */}
                    <mesh position={[-size * 0.02, 0, 0]}>
                        <boxGeometry args={[
                            mark.major ? size * 0.04 : size * 0.02,
                            0.002,
                            0.002
                        ]} />
                        <meshBasicMaterial color={
                            mark.temp >= dangerTemp ? '#ff0000' : '#333'
                        } />
                    </mesh>

                    {/* Número nas marcas principais */}
                    {mark.major && (
                        <Text
                            position={[size * 0.04, 0, 0]}
                            fontSize={size * 0.04}
                            color="#333"
                            anchorX="left"
                            anchorY="middle"
                        >
                            {mark.temp.toFixed(0)}°
                        </Text>
                    )}
                </group>
            ))}

            {/* Zona de perigo */}
            {dangerTemp <= maxTemp && (
                <mesh position={[
                    size * 0.05,
                    -size * 0.35 + ((dangerTemp - minTemp) / (maxTemp - minTemp) + 1) * size * 0.35,
                    -size * 0.015
                ]}>
                    <boxGeometry args={[
                        size * 0.08,
                        ((maxTemp - dangerTemp) / (maxTemp - minTemp)) * size * 0.7,
                        size * 0.005
                    ]} />
                    <meshBasicMaterial color="#ff000020" transparent />
                </mesh>
            )}

            {/* Topo do termômetro */}
            <mesh position={[0, size * 0.42, 0]}>
                <sphereGeometry args={[size * 0.04, 16, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0}
                    transmission={0.9}
                />
            </mesh>

            {/* Display digital */}
            {showDigital && (
                <group position={[0, size * 0.55, 0]}>
                    <mesh>
                        <boxGeometry args={[size * 0.2, size * 0.08, size * 0.02]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <Text
                        position={[0, 0, size * 0.015]}
                        fontSize={size * 0.04}
                        color={temperature >= dangerTemp ? '#ff0000' : '#00ff00'}
                        anchorX="center"
                        anchorY="middle"
                        font="monospace"
                    >
                        {displayValue.toFixed(1)}°{unit}
                    </Text>
                </group>
            )}

            {/* Unidade */}
            <Text
                position={[size * 0.1, -size * 0.45, 0]}
                fontSize={size * 0.05}
                color="#333"
            >
                °{unit}
            </Text>
        </group>
    )
}

// Termômetro infravermelho (pistola)
interface IRThermometerProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    temperature: number
    isActive?: boolean
    targetPosition?: [number, number, number]
}

export function IRThermometer({
    position,
    rotation = [0, 0, 0],
    temperature,
    isActive = false,
    targetPosition
}: IRThermometerProps) {
    const laserRef = useRef<THREE.Line>(null)

    // Atualizar laser
    useFrame(() => {
        if (!laserRef.current || !targetPosition || !isActive) return

        const geometry = laserRef.current.geometry as THREE.BufferGeometry
        const positions = geometry.attributes.position.array as Float32Array

        positions[0] = 0
        positions[1] = 0
        positions[2] = 0.15
        positions[3] = targetPosition[0] - position[0]
        positions[4] = targetPosition[1] - position[1]
        positions[5] = targetPosition[2] - position[2]

        geometry.attributes.position.needsUpdate = true
    })

    const getTempColor = () => {
        if (temperature > 100) return '#ff0000'
        if (temperature > 50) return '#ff8800'
        if (temperature > 25) return '#ffcc00'
        if (temperature > 0) return '#00ff00'
        return '#00ccff'
    }

    return (
        <group position={position} rotation={rotation}>
            {/* Corpo da pistola */}
            <mesh>
                <boxGeometry args={[0.06, 0.1, 0.15]} />
                <meshStandardMaterial color="#333" metalness={0.3} roughness={0.7} />
            </mesh>

            {/* Cabo */}
            <mesh position={[0, -0.08, -0.02]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.04, 0.1, 0.04]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Lente */}
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
                <meshStandardMaterial color="#111" metalness={0.5} />
            </mesh>

            {/* Display */}
            <mesh position={[0, 0.03, -0.03]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.04, 0.025, 0.002]} />
                <meshBasicMaterial color="#001100" />
            </mesh>
            <Text
                position={[0, 0.035, -0.025]}
                rotation={[-0.3, 0, 0]}
                fontSize={0.015}
                color={getTempColor()}
            >
                {temperature.toFixed(1)}°C
            </Text>

            {/* Laser */}
            {isActive && (
                <>
                    <line ref={laserRef}>
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                args={[new Float32Array([0, 0, 0.15, 0, 0, 2]), 3]}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial color="#ff0000" transparent opacity={0.5} />
                    </line>

                    {/* Ponto de laser */}
                    <pointLight
                        position={[0, 0, 0.1]}
                        color="#ff0000"
                        intensity={0.5}
                        distance={0.5}
                    />
                </>
            )}
        </group>
    )
}
