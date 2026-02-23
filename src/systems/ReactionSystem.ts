// src/systems/ReactionSystem.ts
// Sistema de reações químicas

export interface Substance {
    id: string
    name: string
    formula: string
    color: string
    type: 'liquid' | 'solid' | 'gas'
    density: number
    ph?: number
    isFlammable?: boolean
    isToxic?: boolean
    isAcid?: boolean
    isBase?: boolean
}

export interface Reaction {
    id: string
    reactant1: string
    reactant2: string
    products: string[]
    effect: 'bubbles' | 'smoke' | 'explosion' | 'color-change' | 'precipitate' | 'heat'
    description: string
}

// Catálogo de substâncias
export const SUBSTANCES: Record<string, Substance> = {
    water: {
        id: 'water',
        name: 'Água',
        formula: 'H₂O',
        color: '#4a90d9',
        type: 'liquid',
        density: 1.0,
        ph: 7,
    },
    hcl: {
        id: 'hcl',
        name: 'Ácido Clorídrico',
        formula: 'HCl',
        color: '#f0e68c',
        type: 'liquid',
        density: 1.18,
        ph: 1,
        isAcid: true,
        isToxic: true,
    },
    naoh: {
        id: 'naoh',
        name: 'Hidróxido de Sódio',
        formula: 'NaOH',
        color: '#f5f5f5',
        type: 'liquid',
        density: 2.13,
        ph: 14,
        isBase: true,
        isToxic: true,
    },
    phenolphthalein: {
        id: 'phenolphthalein',
        name: 'Fenolftaleína',
        formula: 'C₂₀H₁₄O₄',
        color: '#ffb6c1',
        type: 'liquid',
        density: 1.3,
    },
    cuso4: {
        id: 'cuso4',
        name: 'Sulfato de Cobre',
        formula: 'CuSO₄',
        color: '#1e90ff',
        type: 'liquid',
        density: 1.4,
    },
    ethanol: {
        id: 'ethanol',
        name: 'Etanol',
        formula: 'C₂H₅OH',
        color: '#fffacd',
        type: 'liquid',
        density: 0.789,
        isFlammable: true,
    },
    vinegar: {
        id: 'vinegar',
        name: 'Vinagre',
        formula: 'CH₃COOH',
        color: '#ffefd5',
        type: 'liquid',
        density: 1.05,
        ph: 2.5,
        isAcid: true,
    },
    baking_soda: {
        id: 'baking_soda',
        name: 'Bicarbonato de Sódio',
        formula: 'NaHCO₃',
        color: '#ffffff',
        type: 'solid',
        density: 2.2,
        isBase: true,
    },
}

// Catálogo de reações
export const REACTIONS: Reaction[] = [
    {
        id: 'neutralization',
        reactant1: 'hcl',
        reactant2: 'naoh',
        products: ['water'],
        effect: 'heat',
        description: 'Reação de neutralização ácido-base. Produz água e sal (NaCl).',
    },
    {
        id: 'phenol_base',
        reactant1: 'naoh',
        reactant2: 'phenolphthalein',
        products: [],
        effect: 'color-change',
        description: 'Fenolftaleína fica rosa/magenta em meio básico.',
    },
    {
        id: 'vinegar_baking_soda',
        reactant1: 'vinegar',
        reactant2: 'baking_soda',
        products: ['water'],
        effect: 'bubbles',
        description: 'Reação efervescente! Produz CO₂ (bolhas), água e acetato de sódio.',
    },
    {
        id: 'ethanol_fire',
        reactant1: 'ethanol',
        reactant2: 'fire',
        products: [],
        effect: 'explosion',
        description: 'Etanol é inflamável! Cuidado com fogo.',
    },
]

// Função para encontrar reação entre duas substâncias
export function findReaction(sub1: string, sub2: string): Reaction | null {
    return REACTIONS.find(
        r => (r.reactant1 === sub1 && r.reactant2 === sub2) ||
            (r.reactant1 === sub2 && r.reactant2 === sub1)
    ) || null
}

// Função para misturar cores de líquidos
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
    const c1 = parseInt(color1.slice(1), 16)
    const c2 = parseInt(color2.slice(1), 16)

    const r1 = (c1 >> 16) & 255
    const g1 = (c1 >> 8) & 255
    const b1 = c1 & 255

    const r2 = (c2 >> 16) & 255
    const g2 = (c2 >> 8) & 255
    const b2 = c2 & 255

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio)

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Analisar substância
export function analyzeSubstance(id: string): Substance | null {
    return SUBSTANCES[id] || null
}
