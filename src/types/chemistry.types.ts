// src/types/chemistry.types.ts

/**
 * Substância química com propriedades físicas
 */
export interface Substance {
    id: string
    name: string
    formula?: string // Ex: "H2O", "NaCl"
    color: string
    opacity: number // 0-1, para líquidos transparentes

    // Propriedades físicas
    density: number // kg/m³
    viscosity: number // Pa·s
    boilingPoint?: number // °C
    freezingPoint?: number // °C

    // Reatividade
    reactsWith?: string[] // IDs de substâncias que reagem
    isFlammable?: boolean
    isToxic?: boolean
}

/**
 * Reação química entre duas substâncias
 */
export interface Reaction {
    id: string
    reactants: [string, string] // IDs das substâncias reagentes
    products: string[] // IDs das substâncias produzidas
    energyChange: 'exothermic' | 'endothermic'
    effectType: 'bubbles' | 'smoke' | 'explosion' | 'color-change' | 'precipitate'
    activationTemp?: number // Temperatura mínima para reagir
}

/**
 * Estado de um líquido em um recipiente
 */
export interface LiquidState {
    substanceId: string
    volume: number // mL
    temperature: number // °C
}
