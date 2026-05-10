// src/components/canvas/equipment/Thermometer.tsx
// Termômetro 3D visual
import { Text } from '@react-three/drei'

interface ThermometerProps {
    position: [number, number, number]
    temperature?: number // °C
    scale?: number
}

export default function Thermometer({ position, temperature = 25, scale = 1 }: ThermometerProps) {
    // Altura do mercúrio baseada na temperatura (-20 a 120°C)
    const minTemp = -20
    const maxTemp = 120
    const normalizedTemp = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)))
    const mercuryHeight = 0.02 + normalizedTemp * 0.25

    // Cor do mercúrio
    const getColor = (temp: number) => {
        if (temp < 0) return '#3498db' // Azul frio
        if (temp < 30) return '#e74c3c' // Vermelho normal
        if (temp < 60) return '#ff4444' // Vermelho quente
        return '#ff0000' // Vermelho muito quente
    }

    return (
        <group position={position} scale={scale}>
            {/* Tubo de vidro */}
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.35, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    roughness={0.1}
                />
            </mesh>

            {/* Bulbo inferior */}
            <mesh position={[0, -0.03, 0]}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Mercúrio no bulbo */}
            <mesh position={[0, -0.03, 0]}>
                <sphereGeometry args={[0.025, 16, 16]} />
                <meshStandardMaterial color={getColor(temperature)} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Mercúrio no tubo */}
            <mesh
                position={[0, -0.01 + mercuryHeight / 2, 0]}
            >
                <cylinderGeometry args={[0.008, 0.008, mercuryHeight, 8]} />
                <meshStandardMaterial color={getColor(temperature)} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Marcações */}
            {[0, 25, 50, 75, 100].map(temp => {
                const y = 0.02 + ((temp - minTemp) / (maxTemp - minTemp)) * 0.25
                return (
                    <group key={temp} position={[0.02, y, 0]}>
                        <mesh>
                            <boxGeometry args={[0.01, 0.001, 0.002]} />
                            <meshBasicMaterial color="#333333" />
                        </mesh>
                    </group>
                )
            })}

            {/* Display de temperatura */}
            <Text
                position={[0.05, 0.15, 0]}
                fontSize={0.03}
                color="#ff4444"
                anchorX="left"
                anchorY="middle"
            >
                {temperature.toFixed(0)}°C
            </Text>
        </group>
    )
}
