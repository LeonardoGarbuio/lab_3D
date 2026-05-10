// src/components/canvas/equipment/AnalyticalBalance.tsx
// Balança analítica 3D
import { Text } from '@react-three/drei'

interface AnalyticalBalanceProps {
    position: [number, number, number]
    mass?: number // massa em gramas
    scale?: number
}

export default function AnalyticalBalance({ position, mass = 0, scale = 1 }: AnalyticalBalanceProps) {
    return (
        <group position={position} scale={scale}>
            {/* Base */}
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.6, 0.1, 0.4]} />
                <meshStandardMaterial color="#2c2c2c" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Corpo */}
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.5, 0.3, 0.35]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Display */}
            <mesh position={[0, 0.35, 0.18]}>
                <planeGeometry args={[0.3, 0.1]} />
                <meshBasicMaterial color="#001100" />
            </mesh>

            {/* Texto do display */}
            <Text
                position={[0, 0.35, 0.19]}
                fontSize={0.05}
                color="#00ff00"
                anchorX="center"
                anchorY="middle"
            >
                {mass.toFixed(4)} g
            </Text>

            {/* Câmara de pesagem */}
            <group position={[0, 0.5, 0]}>
                {/* Vidro lateral esquerdo */}
                <mesh position={[-0.2, 0.1, 0]}>
                    <boxGeometry args={[0.02, 0.2, 0.3]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
                </mesh>

                {/* Vidro lateral direito */}
                <mesh position={[0.2, 0.1, 0]}>
                    <boxGeometry args={[0.02, 0.2, 0.3]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
                </mesh>

                {/* Vidro traseiro */}
                <mesh position={[0, 0.1, -0.15]}>
                    <boxGeometry args={[0.4, 0.2, 0.02]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
                </mesh>

                {/* Vidro superior */}
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[0.4, 0.02, 0.3]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
                </mesh>

                {/* Prato de pesagem */}
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.01, 32]} />
                    <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
                </mesh>
            </group>
        </group>
    )
}
