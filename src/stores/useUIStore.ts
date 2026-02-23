// src/stores/useUIStore.ts
import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════════
// STORE - Estado de UI (modais, painéis, seleção de ferramentas)
// ═══════════════════════════════════════════════════════════════════════
type Tool = 'select' | 'move' | 'rotate' | 'pour' | 'heat'

interface UIState {
    // Estado de modais
    isInstructionsOpen: boolean
    isInventoryOpen: boolean
    isSettingsOpen: boolean

    // Ferramenta ativa
    activeTool: Tool

    // Ações - Modais
    openInstructions: () => void
    closeInstructions: () => void
    toggleInventory: () => void
    toggleSettings: () => void
    closeAllModals: () => void

    // Ações - Ferramentas
    setActiveTool: (tool: Tool) => void
}

export const useUIStore = create<UIState>((set) => ({
    isInstructionsOpen: false,
    isInventoryOpen: false,
    isSettingsOpen: false,
    activeTool: 'select',

    openInstructions: () => set({ isInstructionsOpen: true }),
    closeInstructions: () => set({ isInstructionsOpen: false }),
    toggleInventory: () => set((state) => ({ isInventoryOpen: !state.isInventoryOpen })),
    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
    closeAllModals: () => set({
        isInstructionsOpen: false,
        isInventoryOpen: false,
        isSettingsOpen: false,
    }),
    setActiveTool: (tool) => set({ activeTool: tool }),
}))
