// src/stores/useSimulationStore.ts
import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════════
// STORE - Controle de simulação (play/pause/velocidade)
// ═══════════════════════════════════════════════════════════════════════
interface SimulationState {
    // Estado
    isRunning: boolean
    speed: number // 0.5 = slow motion, 1 = normal, 2 = fast
    gravity: [number, number, number]

    // Ações
    play: () => void
    pause: () => void
    toggle: () => void
    setSpeed: (speed: number) => void
    setGravity: (gravity: [number, number, number]) => void
    reset: () => void
}

const DEFAULT_GRAVITY: [number, number, number] = [0, -9.81, 0]

export const useSimulationStore = create<SimulationState>((set) => ({
    isRunning: true,
    speed: 1,
    gravity: DEFAULT_GRAVITY,

    play: () => set({ isRunning: true }),
    pause: () => set({ isRunning: false }),
    toggle: () => set((state) => ({ isRunning: !state.isRunning })),
    setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(3, speed)) }),
    setGravity: (gravity) => set({ gravity }),
    reset: () => set({ isRunning: true, speed: 1, gravity: DEFAULT_GRAVITY }),
}))
