// src/systems/CrystallizationSystem.ts
// Sistema de cristalização com crescimento visual de cristais

export interface CrystalType {
    name: string
    formula: string
    shape: 'cubic' | 'hexagonal' | 'monoclinic' | 'orthorhombic' | 'tetragonal' | 'triclinic'
    color: string
    saturationTemp: number      // Temperatura de saturação (°C)
    growthRate: number          // Taxa de crescimento (0-1)
    transparency: number        // 0-1
    crystallizationSpeed?: number // Velocidade de cristalização
}

export interface Crystal {
    id: string
    type: CrystalType
    position: [number, number, number]
    scale: number
    rotation: [number, number, number]
    growthProgress: number      // 0-1
    isGrowing: boolean
}

export interface CrystallizationState {
    solutionFormula?: string
    substance?: CrystalType
    concentration: number       // mol/L ou g/L
    temperature: number
    saturation?: number         // 0-1+ (percentual de saturação)
    isSaturated: boolean
    isSupersaturated?: boolean
    crystals?: Crystal[]
    crystalsFormed?: number
    crystallizationRate?: number
    evaporationRate?: number
}

// Tipos de cristais conhecidos
export const CRYSTAL_TYPES: Record<string, CrystalType> = {
    'NaCl': {
        name: 'Cloreto de Sódio',
        formula: 'NaCl',
        shape: 'cubic',
        color: '#ffffff',
        saturationTemp: 25,
        growthRate: 0.3,
        transparency: 0.2
    },
    'CuSO4': {
        name: 'Sulfato de Cobre',
        formula: 'CuSO4',
        shape: 'triclinic',
        color: '#0066cc',
        saturationTemp: 20,
        growthRate: 0.25,
        transparency: 0.3
    },
    'KNO3': {
        name: 'Nitrato de Potássio',
        formula: 'KNO3',
        shape: 'orthorhombic',
        color: '#f0f0f0',
        saturationTemp: 30,
        growthRate: 0.4,
        transparency: 0.15
    },
    'Alum': {
        name: 'Alúmen de Potássio',
        formula: 'KAl(SO4)2',
        shape: 'cubic', // Na verdade octaédrico, mas usamos cubic
        color: '#e8e8ff',
        saturationTemp: 25,
        growthRate: 0.35,
        transparency: 0.4
    },
    'Sugar': {
        name: 'Sacarose',
        formula: 'C12H22O11',
        shape: 'monoclinic',
        color: '#fffacd',
        saturationTemp: 20,
        growthRate: 0.2,
        transparency: 0.5
    }
}

// Alias para compatibilidade - CRYSTAL_SUBSTANCES é igual a CRYSTAL_TYPES
export const CRYSTAL_SUBSTANCES = CRYSTAL_TYPES

/**
 * Calcula o nível de saturação (0-1+)
 */
export function calculateSaturation(
    concentration: number,
    temperature: number,
    substance: CrystalType
): number {
    const solubility = getSolubilityForSubstance(temperature, substance)
    return concentration / solubility
}

/**
 * Retorna solubilidade baseado na temperatura para uma substância
 */
export function getSolubilityForSubstance(temperature: number, substance: CrystalType): number {
    // Solubilidade base do NaCl: ~360g/L a 20°C = 6.1 mol/L
    // Usamos saturationTemp como referência
    const baseSolubility = 360 // g/L como padrão
    const tempFactor = 1 + (temperature - substance.saturationTemp) * 0.02
    return baseSolubility * Math.max(0.1, tempFactor)
}

/**
 * Verifica se a solução está saturada
 */
export function checkSaturation(
    formula: string,
    concentration: number,
    temperature: number
): boolean {
    const crystalType = CRYSTAL_TYPES[formula]
    if (!crystalType) return false

    // Solubilidade aumenta com temperatura (simplificado)
    const maxConcentration = getSolubility(formula, temperature)
    return concentration >= maxConcentration
}

/**
 * Retorna solubilidade em mol/L baseado na temperatura
 */
export function getSolubility(formula: string, temperature: number): number {
    // Valores simplificados de solubilidade
    const baseSolubility: Record<string, number> = {
        'NaCl': 6.1,      // ~360g/L
        'CuSO4': 1.4,     // ~220g/L a 20°C
        'KNO3': 3.2,      // ~320g/L a 20°C
        'Alum': 0.3,      // ~115g/L
        'Sugar': 6.0      // ~2000g/L
    }

    const base = baseSolubility[formula] || 1
    // Solubilidade aumenta ~3% por °C acima de 20°C
    const tempFactor = 1 + (temperature - 20) * 0.03
    return base * Math.max(0.1, tempFactor)
}

/**
 * Simula crescimento de cristais
 */
export function growCrystals(
    state: CrystallizationState,
    deltaTime: number
): CrystallizationState {
    if (!state.solutionFormula) return state
    const crystalType = CRYSTAL_TYPES[state.solutionFormula]
    if (!crystalType) return state

    const crystals = state.crystals || []

    // Verificar se pode crescer (saturado e esfriando/evaporando)
    const canGrow = state.isSaturated && state.temperature < crystalType.saturationTemp + 10

    if (!canGrow) {
        return {
            ...state,
            crystals: crystals.map(c => ({ ...c, isGrowing: false }))
        }
    }

    // Crescer cristais existentes
    const grownCrystals = crystals.map(crystal => {
        if (crystal.growthProgress >= 1) {
            return { ...crystal, isGrowing: false }
        }

        const growthAmount = crystalType.growthRate * deltaTime * 0.1
        return {
            ...crystal,
            growthProgress: Math.min(1, crystal.growthProgress + growthAmount),
            scale: crystal.scale + growthAmount * 0.5,
            isGrowing: true
        }
    })

    // Chance de nuclear novo cristal se muito saturado
    let newCrystals = [...grownCrystals]
    if (state.concentration > getSolubility(state.solutionFormula, state.temperature) * 1.2) {
        if (Math.random() < 0.1 * deltaTime) { // 10% chance por segundo
            newCrystals.push(createCrystal(crystalType, crystals.length))
        }
    }

    return {
        ...state,
        crystals: newCrystals
    }
}

/**
 * Cria um novo cristal
 */
function createCrystal(type: CrystalType, index: number): Crystal {
    return {
        id: `crystal-${Date.now()}-${index}`,
        type,
        position: [
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.02,
            (Math.random() - 0.5) * 0.1
        ],
        scale: 0.01,
        rotation: [
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        ],
        growthProgress: 0,
        isGrowing: true
    }
}

/**
 * Inicia cristalização por resfriamento
 */
export function startCoolingCrystallization(
    formula: string,
    concentration: number,
    startTemp: number
): CrystallizationState {
    const crystalType = CRYSTAL_TYPES[formula]

    return {
        solutionFormula: formula,
        concentration,
        temperature: startTemp,
        isSaturated: checkSaturation(formula, concentration, startTemp),
        crystals: crystalType ? [createCrystal(crystalType, 0)] : [],
        evaporationRate: 0
    }
}

/**
 * Inicia cristalização por evaporação
 */
export function startEvaporationCrystallization(
    formula: string,
    concentration: number,
    evaporationRate: number = 0.01
): CrystallizationState {
    const crystalType = CRYSTAL_TYPES[formula]

    return {
        solutionFormula: formula,
        concentration,
        temperature: 25,
        isSaturated: false,
        crystals: crystalType ? [createCrystal(crystalType, 0)] : [],
        evaporationRate
    }
}
