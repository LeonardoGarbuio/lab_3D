// src/hooks/useFrameLoop.ts
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

/**
 * Hook que encapsula useFrame com controle de delta time
 * Use para lógica que precisa rodar a cada frame de forma consistente
 * 
 * @example
 * useFrameLoop((delta) => {
 *   meshRef.current.rotation.y += delta * 0.5
 * })
 */
export function useFrameLoop(callback: (delta: number, elapsedTime: number) => void) {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useFrame((state, delta) => {
        callbackRef.current(delta, state.clock.elapsedTime)
    })
}
