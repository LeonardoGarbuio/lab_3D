// src/systems/ChemistryEngine.ts
// Motor de química com 20+ reações e cálculos de estequiometria

// ═══════════════════════════════════════════════════════════════════════
// SUBSTÂNCIAS COMUNS
// ═══════════════════════════════════════════════════════════════════════
export interface Substance {
    formula: string
    name: string
    molarMass: number
    color: string
    phase: 'solid' | 'liquid' | 'gas' | 'aqueous'
    ph?: number
    density?: number
    boilingPoint?: number     // °C
    freezingPoint?: number    // °C
    category: 'acid' | 'base' | 'salt' | 'solvent' | 'gas' | 'indicator' | 'metal' | 'organic'
    isFlammable?: boolean
    isToxic?: boolean
    // Propriedades de Perigo
    isCorrosive?: boolean
    corrosionStrength?: number  // 0-10
    isExplosive?: boolean
    explosionPower?: number     // 0-10
    isOxidizer?: boolean
    incompatibleWith?: string[] // Fórmulas incompatíveis
    flameColor?: string         // Cor da chama em teste de chama
}


export const COMMON_SUBSTANCES: Record<string, Substance> = {
    // ÁCIDOS
    'HCl': { formula: 'HCl', name: 'Ácido Clorídrico', molarMass: 36.46, color: '#e8e8e8', phase: 'aqueous', ph: 1, category: 'acid', isCorrosive: true, corrosionStrength: 7, isToxic: true },
    'H2SO4': { formula: 'H2SO4', name: 'Ácido Sulfúrico', molarMass: 98.08, color: '#f0f0e8', phase: 'liquid', ph: 0.5, category: 'acid', isCorrosive: true, corrosionStrength: 9, isToxic: true, incompatibleWith: ['H2O'] },
    'HNO3': { formula: 'HNO3', name: 'Ácido Nítrico', molarMass: 63.01, color: '#fffacd', phase: 'liquid', ph: 1, category: 'acid', isCorrosive: true, corrosionStrength: 8, isOxidizer: true, isToxic: true, incompatibleWith: ['organics', 'metals'] },
    'CH3COOH': { formula: 'CH3COOH', name: 'Ácido Acético (Vinagre)', molarMass: 60.05, color: '#fff8dc', phase: 'liquid', ph: 2.9, category: 'acid' },
    'H3PO4': { formula: 'H3PO4', name: 'Ácido Fosfórico', molarMass: 97.99, color: '#f5f5f5', phase: 'liquid', ph: 1.5, category: 'acid' },
    'HF': { formula: 'HF', name: 'Ácido Fluorídrico', molarMass: 20.01, color: '#f0ffff', phase: 'liquid', ph: 2, category: 'acid', isCorrosive: true, corrosionStrength: 10, isToxic: true },

    // BASES
    'NaOH': { formula: 'NaOH', name: 'Hidróxido de Sódio', molarMass: 40.0, color: '#87ceeb', phase: 'aqueous', ph: 14, category: 'base', isCorrosive: true, corrosionStrength: 8, isToxic: true, flameColor: '#ffd700' },
    'KOH': { formula: 'KOH', name: 'Hidróxido de Potássio', molarMass: 56.1, color: '#add8e6', phase: 'aqueous', ph: 13.5, category: 'base', isCorrosive: true, corrosionStrength: 8, isToxic: true, flameColor: '#9400d3' },
    'Ca(OH)2': { formula: 'Ca(OH)2', name: 'Hidróxido de Cálcio', molarMass: 74.09, color: '#f5f5f5', phase: 'aqueous', ph: 12.5, category: 'base', flameColor: '#ff6600' },
    'NH4OH': { formula: 'NH4OH', name: 'Hidróxido de Amônio', molarMass: 35.04, color: '#e6f3ff', phase: 'aqueous', ph: 11, category: 'base' },
    'Mg(OH)2': { formula: 'Mg(OH)2', name: 'Hidróxido de Magnésio', molarMass: 58.32, color: '#ffffff', phase: 'aqueous', ph: 10.5, category: 'base' },

    // SAIS
    'NaCl': { formula: 'NaCl', name: 'Cloreto de Sódio', molarMass: 58.44, color: '#ffffff', phase: 'solid', category: 'salt', flameColor: '#ffd700' },
    'KCl': { formula: 'KCl', name: 'Cloreto de Potássio', molarMass: 74.55, color: '#f5f5f5', phase: 'solid', category: 'salt', flameColor: '#9400d3' },
    'NaHCO3': { formula: 'NaHCO3', name: 'Bicarbonato de Sódio', molarMass: 84.01, color: '#ffffff', phase: 'solid', ph: 8.3, category: 'salt' },
    'Na2CO3': { formula: 'Na2CO3', name: 'Carbonato de Sódio', molarMass: 105.99, color: '#ffffff', phase: 'solid', ph: 11.5, category: 'salt' },
    'CaCO3': { formula: 'CaCO3', name: 'Carbonato de Cálcio', molarMass: 100.09, color: '#fffaf0', phase: 'solid', ph: 9, category: 'salt' },
    'AgNO3': { formula: 'AgNO3', name: 'Nitrato de Prata', molarMass: 169.87, color: '#f0f0f0', phase: 'aqueous', category: 'salt', isCorrosive: true, corrosionStrength: 3 },
    'CuSO4': { formula: 'CuSO4', name: 'Sulfato de Cobre', molarMass: 159.61, color: '#1e90ff', phase: 'aqueous', category: 'salt', flameColor: '#00ff00' },
    'FeCl3': { formula: 'FeCl3', name: 'Cloreto de Ferro III', molarMass: 162.2, color: '#8b4513', phase: 'aqueous', ph: 2, category: 'salt' },
    'BaCl2': { formula: 'BaCl2', name: 'Cloreto de Bário', molarMass: 208.23, color: '#fffacd', phase: 'solid', category: 'salt', flameColor: '#adff2f', isToxic: true },
    'CaCl2': { formula: 'CaCl2', name: 'Cloreto de Cálcio', molarMass: 110.98, color: '#fff8dc', phase: 'solid', category: 'salt', flameColor: '#ff6600' },
    'SrCl2': { formula: 'SrCl2', name: 'Cloreto de Estrôncio', molarMass: 158.53, color: '#ffe4e1', phase: 'solid', category: 'salt', flameColor: '#dc143c' },
    'LiCl': { formula: 'LiCl', name: 'Cloreto de Lítio', molarMass: 42.39, color: '#fff5ee', phase: 'solid', category: 'salt', flameColor: '#ff0000' },
    'Pb(NO3)2': { formula: 'Pb(NO3)2', name: 'Nitrato de Chumbo', molarMass: 331.2, color: '#f5f5f5', phase: 'aqueous', ph: 5, category: 'salt', isToxic: true },
    'KI': { formula: 'KI', name: 'Iodeto de Potássio', molarMass: 166.0, color: '#f5f5f5', phase: 'aqueous', ph: 7, category: 'salt' },

    // SOLVENTES
    'H2O': { formula: 'H2O', name: 'Água', molarMass: 18.015, color: '#4ecdc4', phase: 'liquid', ph: 7, density: 1.0, category: 'solvent' },
    'C2H5OH': { formula: 'C2H5OH', name: 'Etanol', molarMass: 46.07, color: '#fffacd', phase: 'liquid', ph: 7, density: 0.789, category: 'solvent', isFlammable: true },
    'CH3OH': { formula: 'CH3OH', name: 'Metanol', molarMass: 32.04, color: '#f0f8ff', phase: 'liquid', ph: 7, category: 'solvent', isFlammable: true, isToxic: true },

    // GASES
    'CO2': { formula: 'CO2', name: 'Dióxido de Carbono', molarMass: 44.01, color: '#e8e8e8', phase: 'gas', boilingPoint: -78, freezingPoint: -57, category: 'gas' },
    'O2': { formula: 'O2', name: 'Gás Oxigênio', molarMass: 32.0, color: '#a8d8ea', phase: 'gas', boilingPoint: -183, freezingPoint: -218, density: 1.429, category: 'gas' },
    'H2': { formula: 'H2', name: 'Gás Hidrogênio', molarMass: 2.016, color: '#e3f2fd', phase: 'gas', boilingPoint: -253, freezingPoint: -259, density: 0.0899, category: 'gas', isFlammable: true },
    'N2': { formula: 'N2', name: 'Nitrogênio', molarMass: 28.01, color: '#e6e6fa', phase: 'gas', boilingPoint: -196, freezingPoint: -210, category: 'gas' },
    'Cl2': { formula: 'Cl2', name: 'Gás Cloro', molarMass: 70.9, color: '#90EE90', phase: 'gas', category: 'gas', isToxic: true },
    'NH3': { formula: 'NH3', name: 'Amônia', molarMass: 17.03, color: '#e6f3ff', phase: 'gas', category: 'gas', isToxic: true },
    'SO2': { formula: 'SO2', name: 'Dióxido de Enxofre', molarMass: 64.07, color: '#fffacd', phase: 'gas', category: 'gas', isToxic: true },

    // INDICADORES
    'phenolphthalein': { formula: 'C20H14O4', name: 'Fenolftaleína', molarMass: 318.32, color: '#ff69b4', phase: 'liquid', category: 'indicator' },
    'methyl_orange': { formula: 'C14H14N3NaO3S', name: 'Alaranjado de Metila', molarMass: 327.33, color: '#ff8c00', phase: 'liquid', category: 'indicator' },
    'litmus': { formula: 'C40H26O4', name: 'Tornassol', molarMass: 350, color: '#9370db', phase: 'liquid', category: 'indicator' },

    // METAIS
    'Fe': { formula: 'Fe', name: 'Ferro', molarMass: 55.845, color: '#708090', phase: 'solid', category: 'metal' },
    'Cu': { formula: 'Cu', name: 'Cobre', molarMass: 63.546, color: '#b87333', phase: 'solid', category: 'metal' },
    'Zn': { formula: 'Zn', name: 'Zinco', molarMass: 65.38, color: '#b0c4de', phase: 'solid', category: 'metal' },
    'Mg': { formula: 'Mg', name: 'Magnésio', molarMass: 24.305, color: '#c0c0c0', phase: 'solid', category: 'metal' },

    // ORGÂNICOS
    'C6H12O6': { formula: 'C6H12O6', name: 'Glicose', molarMass: 180.16, color: '#fffaf0', phase: 'solid', category: 'organic' },
    'C12H22O11': { formula: 'C12H22O11', name: 'Sacarose', molarMass: 342.3, color: '#fffaf0', phase: 'solid', category: 'organic' },
}

// ═══════════════════════════════════════════════════════════════════════
// REAÇÕES QUÍMICAS (20+)
// ═══════════════════════════════════════════════════════════════════════
export interface ChemicalReaction {
    id: string
    reactants: [string, string]
    products: string[]
    equation: string
    description: string
    type: 'neutralization' | 'precipitation' | 'decomposition' | 'combustion' | 'synthesis' | 'displacement' | 'effervescence'
    effect: string
    effectColor?: string
    productColor?: string
    exothermic: boolean
    requiredTemp?: { min: number, max: number }
    optimalRatio?: number // Mols de reactante 2 por mol de reactante 1
    unstable?: boolean
    onFailure?: 'explosion' | 'fizzle' | 'nothing'
}

export const REACTIONS: ChemicalReaction[] = [
    // NEUTRALIZAÇÕES
    {
        id: 'hcl-naoh',
        reactants: ['HCl', 'NaOH'],
        products: ['NaCl', 'H2O'],
        equation: 'HCl + NaOH → NaCl + H₂O',
        description: 'Neutralização: Formação de sal e água',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#ffff00',
        productColor: '#f0f8ff',
        exothermic: true,
        optimalRatio: 1, // 1:1 ratio
    },
    {
        id: 'h2so4-naoh',
        reactants: ['H2SO4', 'NaOH'],
        products: ['Na2SO4', 'H2O'],
        equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
        description: 'Neutralização: Sulfato de sódio formado',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#ffa500',
        productColor: '#f5f5f5',
        exothermic: true,
    },
    {
        id: 'hno3-koh',
        reactants: ['HNO3', 'KOH'],
        products: ['KNO3', 'H2O'],
        equation: 'HNO₃ + KOH → KNO₃ + H₂O',
        description: 'Neutralização: Nitrato de potássio formado',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#ffff00',
        productColor: '#ffffff',
        exothermic: true,
    },

    // EFERVESCÊNCIAS
    {
        id: 'nahco3-ch3cooh',
        reactants: ['NaHCO3', 'CH3COOH'],
        products: ['CH3COONa', 'H2O', 'CO2'],
        equation: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑',
        description: 'Efervescência! Liberação de CO₂',
        type: 'effervescence',
        effect: 'bubbles',
        effectColor: '#ffffff',
        productColor: '#fff8dc',
        exothermic: false,
    },
    {
        id: 'caco3-hcl',
        reactants: ['CaCO3', 'HCl'],
        products: ['CaCl2', 'H2O', 'CO2'],
        equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
        description: 'Efervescência intensa! Dissolução de calcário',
        type: 'effervescence',
        effect: 'bubbles',
        effectColor: '#ffffff',
        productColor: '#f5f5f5',
        exothermic: true,
    },
    {
        id: 'na2co3-hcl',
        reactants: ['Na2CO3', 'HCl'],
        products: ['NaCl', 'H2O', 'CO2'],
        equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
        description: 'Efervescência com liberação de gás',
        type: 'effervescence',
        effect: 'bubbles',
        effectColor: '#e8e8e8',
        productColor: '#ffffff',
        exothermic: false,
    },

    // PRECIPITAÇÕES
    {
        id: 'agno3-nacl',
        reactants: ['AgNO3', 'NaCl'],
        products: ['AgCl', 'NaNO3'],
        equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
        description: 'Precipitado branco de cloreto de prata!',
        type: 'precipitation',
        effect: 'precipitate',
        effectColor: '#ffffff',
        productColor: '#ffffff',
        exothermic: false,
    },
    {
        id: 'bacl2-h2so4',
        reactants: ['BaCl2', 'H2SO4'],
        products: ['BaSO4', 'HCl'],
        equation: 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl',
        description: 'Precipitado branco de sulfato de bário!',
        type: 'precipitation',
        effect: 'precipitate',
        effectColor: '#ffffff',
        productColor: '#f8f8ff',
        exothermic: false,
    },
    {
        id: 'pb-ki',
        reactants: ['Pb(NO3)2', 'KI'],
        products: ['PbI2', 'KNO3'],
        equation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
        description: 'Chuva de ouro! Precipitado amarelo de iodeto de chumbo',
        type: 'precipitation',
        effect: 'precipitate',
        effectColor: '#ffd700',
        productColor: '#ffd700',
        exothermic: false,
    },
    {
        id: 'cuso4-naoh',
        reactants: ['CuSO4', 'NaOH'],
        products: ['Cu(OH)2', 'Na2SO4'],
        equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
        description: 'Precipitado azul de hidróxido de cobre!',
        type: 'precipitation',
        effect: 'precipitate',
        effectColor: '#1e90ff',
        productColor: '#4169e1',
        exothermic: false,
    },
    {
        id: 'fecl3-naoh',
        reactants: ['FeCl3', 'NaOH'],
        products: ['Fe(OH)3', 'NaCl'],
        equation: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl',
        description: 'Precipitado marrom-ferrugem de hidróxido de ferro!',
        type: 'precipitation',
        effect: 'precipitate',
        effectColor: '#8b4513',
        productColor: '#a0522d',
        exothermic: false,
    },

    // SÍNTESES DE ELEMENTOS
    {
        id: 'h-o',
        reactants: ['H', 'O'],
        products: ['H2O'],
        equation: '2H₂ + O₂ → 2H₂O',
        description: 'Síntese da água! Reação exotérmica',
        type: 'synthesis',
        effect: 'explosion',
        effectColor: '#87ceeb',
        productColor: '#4ecdc4',
        exothermic: true,
        requiredTemp: { min: 500, max: 5000 },
        onFailure: 'nothing',
    },
    {
        id: 'na-cl',
        reactants: ['Na', 'Cl'],
        products: ['NaCl'],
        equation: '2Na + Cl₂ → 2NaCl',
        description: 'Síntese do sal! Reação violenta',
        type: 'synthesis',
        effect: 'explosion',
        effectColor: '#ffff00',
        productColor: '#ffffff',
        exothermic: true,
    },
    {
        id: 'fe-o',
        reactants: ['Fe', 'O'],
        products: ['Fe2O3'],
        equation: '4Fe + 3O₂ → 2Fe₂O₃',
        description: 'Formação de ferrugem (oxidação)',
        type: 'synthesis',
        effect: 'glow',
        effectColor: '#ff6600',
        productColor: '#8b4513',
        exothermic: true,
    },

    // DESLOCAMENTOS
    {
        id: 'zn-hcl',
        reactants: ['Zn', 'HCl'],
        products: ['ZnCl2', 'H2'],
        equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
        description: 'Liberação de hidrogênio gasoso!',
        type: 'displacement',
        effect: 'bubbles',
        effectColor: '#e0ffff',
        productColor: '#b0c4de',
        exothermic: true,
    },
    {
        id: 'mg-hcl',
        reactants: ['Mg', 'HCl'],
        products: ['MgCl2', 'H2'],
        equation: 'Mg + 2HCl → MgCl₂ + H₂↑',
        description: 'Reação vigorosa com bolhas de H₂!',
        type: 'displacement',
        effect: 'bubbles',
        effectColor: '#ffffff',
        productColor: '#d3d3d3',
        exothermic: true,
    },
    {
        id: 'fe-cuso4',
        reactants: ['Fe', 'CuSO4'],
        products: ['FeSO4', 'Cu'],
        equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
        description: 'Deslocamento: Cobre metálico se deposita!',
        type: 'displacement',
        effect: 'precipitate',
        effectColor: '#b87333',
        productColor: '#90ee90',
        exothermic: false,
    },

    // INDICADORES
    {
        id: 'phenol-base',
        reactants: ['phenolphthalein', 'NaOH'],
        products: ['phenolphthalein-pink'],
        equation: 'Fenolftaleína + Base → Rosa/Magenta',
        description: 'Indicador fica ROSA em meio básico!',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#ff1493',
        productColor: '#ff69b4',
        exothermic: false,
    },
    {
        id: 'litmus-acid',
        reactants: ['litmus', 'HCl'],
        products: ['litmus-red'],
        equation: 'Tornassol + Ácido → Vermelho',
        description: 'Tornassol fica VERMELHO em ácido!',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#ff0000',
        productColor: '#dc143c',
        exothermic: false,
    },
    {
        id: 'litmus-base',
        reactants: ['litmus', 'NaOH'],
        products: ['litmus-blue'],
        equation: 'Tornassol + Base → Azul',
        description: 'Tornassol fica AZUL em base!',
        type: 'neutralization',
        effect: 'glow',
        effectColor: '#0000ff',
        productColor: '#4169e1',
        exothermic: false,
    },
]

// Importar reações expandidas
import { EXPANDED_REACTIONS, EXPANDED_SUBSTANCES } from './ExpandedReactions'

// Mesclar substâncias
export const ALL_SUBSTANCES = { ...COMMON_SUBSTANCES, ...EXPANDED_SUBSTANCES }

// Mesclar todas as reações
export const ALL_REACTIONS = [...REACTIONS, ...EXPANDED_REACTIONS]

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES
// ═══════════════════════════════════════════════════════════════════════

export function findReaction(formula1: string, formula2: string): ChemicalReaction | null {
    return ALL_REACTIONS.find(r =>
        (r.reactants[0] === formula1 && r.reactants[1] === formula2) ||
        (r.reactants[0] === formula2 && r.reactants[1] === formula1)
    ) || null
}

export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
    const hex2rgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 }
    }

    const c1 = hex2rgb(color1)
    const c2 = hex2rgb(color2)

    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio)
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio)
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio)

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function calculateMolarMass(formula: string): number {
    const substance = ALL_SUBSTANCES[formula]
    if (substance) return substance.molarMass
    return 50 // default
}

export function getSubstancesByCategory(category: string): Substance[] {
    return Object.values(ALL_SUBSTANCES).filter(s => s.category === category)
}

export function getAllReactionTypes(): string[] {
    return [...new Set(ALL_REACTIONS.map(r => r.type))]
}

// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE pH E TITULAÇÃO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calcula o pH de uma solução baseado na substância
 */
export function calculatePH(formula: string, concentration: number = 1): number {
    const substance = ALL_SUBSTANCES[formula]
    if (!substance || substance.ph === undefined) return 7

    // Ajuste baseado na concentração
    const basePH = substance.ph
    if (basePH < 7) {
        // Ácido: pH aumenta com diluição
        return Math.min(7, basePH + Math.log10(1 / concentration))
    } else if (basePH > 7) {
        // Base: pH diminui com diluição
        return Math.max(7, basePH - Math.log10(1 / concentration))
    }
    return 7
}

/**
 * Retorna a cor do indicador baseado no pH
 */
export function getIndicatorColor(indicator: string, ph: number): string {
    switch (indicator) {
        case 'phenolphthalein':
            return ph < 8.2 ? '#f5f5f5' : ph < 10 ? '#ff69b4' : '#ff1493'
        case 'methyl_orange':
            return ph < 3.1 ? '#ff0000' : ph < 4.4 ? '#ffa500' : '#ffff00'
        case 'bromothymol':
            return ph < 6 ? '#ffff00' : ph < 7.6 ? '#00ff00' : '#0000ff'
        case 'litmus':
            return ph < 5 ? '#ff0000' : ph < 8 ? '#800080' : '#0000ff'
        case 'universal':
            if (ph < 2) return '#ff0000'
            if (ph < 4) return '#ff6600'
            if (ph < 6) return '#ffff00'
            if (ph < 8) return '#00ff00'
            if (ph < 10) return '#00ffff'
            if (ph < 12) return '#0000ff'
            return '#800080'
        default:
            return '#ffffff'
    }
}

/**
 * Gera curva de titulação ácido-base
 */
export interface TitrationPoint {
    volume: number      // mL adicionado
    ph: number
    color: string       // Cor do indicador
}

export function generateTitrationCurve(
    acidFormula: string,
    baseFormula: string,
    acidVolume: number = 25,    // mL
    acidConcentration: number = 0.1,  // mol/L
    baseConcentration: number = 0.1,  // mol/L
    indicator: string = 'phenolphthalein',
    maxBaseVolume: number = 50  // mL
): TitrationPoint[] {
    const points: TitrationPoint[] = []

    const acid = ALL_SUBSTANCES[acidFormula]
    const base = ALL_SUBSTANCES[baseFormula]

    if (!acid || !base) return points

    // Mols de ácido inicial
    const acidMols = acidConcentration * (acidVolume / 1000)

    // Ponto de equivalência (volume de base necessário)
    const equivalenceVolume = (acidMols / baseConcentration) * 1000

    for (let v = 0; v <= maxBaseVolume; v += 0.5) {
        const baseMols = baseConcentration * (v / 1000)
        const excessMols = baseMols - acidMols

        let ph: number

        if (v === 0) {
            // Apenas ácido
            ph = acid.ph || 1
        } else if (v < equivalenceVolume * 0.9) {
            // Região tampão (antes do ponto de equivalência)
            const ratio = baseMols / acidMols
            ph = (acid.ph || 1) + 3 * ratio
        } else if (v < equivalenceVolume * 1.1) {
            // Próximo ao ponto de equivalência (mudança brusca)
            const t = (v - equivalenceVolume * 0.9) / (equivalenceVolume * 0.2)
            ph = 4 + t * 6  // Salta de ~4 para ~10
        } else {
            // Excesso de base
            const totalVolume = acidVolume + v
            const excessConc = (excessMols * 1000) / totalVolume
            ph = 14 + Math.log10(excessConc)
        }

        // Limitar pH entre 0 e 14
        ph = Math.max(0, Math.min(14, ph))

        points.push({
            volume: v,
            ph: Math.round(ph * 100) / 100,
            color: getIndicatorColor(indicator, ph)
        })
    }

    return points
}

/**
 * Encontra o ponto de equivalência de uma titulação
 */
export function findEquivalencePoint(
    acidConcentration: number,
    acidVolume: number,
    baseConcentration: number
): number {
    // V1 * C1 = V2 * C2 (para reação 1:1)
    return (acidConcentration * acidVolume) / baseConcentration
}

/**
 * Calcula o reagente limitante
 */
export function calculateLimitingReagent(
    formula1: string,
    mols1: number,
    formula2: string,
    mols2: number,
    reaction: ChemicalReaction
): { limiting: string; excess: string; excessMols: number } {
    const ratio = reaction.optimalRatio || 1

    // formula1 é o primeiro reagente, formula2 é o segundo
    // Se ratio é 2, significa que precisamos de 2 mols de formula2 para 1 mol de formula1
    const required2 = mols1 * ratio

    if (mols2 >= required2) {
        // formula1 é limitante
        return {
            limiting: formula1,
            excess: formula2,
            excessMols: mols2 - required2
        }
    } else {
        // formula2 é limitante
        const used1 = mols2 / ratio
        return {
            limiting: formula2,
            excess: formula1,
            excessMols: mols1 - used1
        }
    }
}

