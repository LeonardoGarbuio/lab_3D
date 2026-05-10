// src/components/canvas/equipment/PHMeter.tsx
// pHmetro digital 3D
import { Text } from '@react-three/drei'

interface PHMeterProps {
    position: [number, number, number]
    ph?: number
    scale?: number
}

export default function PHMeter({ position, ph = 7, scale = 1 }: PHMeterProps) {
    // Cor baseada no pH
    const getPhColor = (pH: number): string => {
        if (pH < 3) return '#ff0000' // Muito ácido
        if (pH < 6) return '#ff6600' // Ácido
        if (pH < 7) return '#ffff00' // Levemente ácido
        if (pH === 7) return '#00ff00' // Neutro
        if (pH < 9) return '#00ffff' // Levemente básico
        if (pH < 12) return '#0066ff' // Básico
        return '#6600ff' // Muito básico
    }

    return (
        <group position={position} scale={scale}>
            {/* Corpo principal */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.15, 0.3, 0.05]} />
                <meshStandardMaterial color="#f5f5f5" metalness={0.2} roughness={0.5} />
            </mesh>

            {/* Display */}
            <mesh position={[0, 0.22, 0.026]}>
                <planeGeometry args={[0.1, 0.08]} />
                <meshBasicMaterial color="#001122" />
            </mesh>

            {/* Valor do pH */}
            <Text
                position={[0, 0.22, 0.03]}
                fontSize={0.04}
                color={getPhColor(ph)}
                anchorX="center"
                anchorY="middle"
            >
                pH {ph.toFixed(1)}
            </Text>

            {/* Botões */}
            <mesh position={[-0.03, 0.08, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[0.03, 0.08, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>

            {/* Sonda */}
            <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.01, 0.005, 0.2, 16]} />
                <meshStandardMaterial color="#333333" />
            </mesh>

            {/* Ponta da sonda (vidro) */}
            <mesh position={[0, -0.28, 0]}>
                <sphereGeometry args={[0.015, 16, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>

            {/* Cabo */}
            <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.008, 0.008, 0.15, 8]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
        </group>
    )
}
