// src/systems/ElectrolysisSystem.ts
// Sistema de eletrólise com eletroquímica realista

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTES ELETROQUÍMICAS
// ═══════════════════════════════════════════════════════════════════════

// Constante de Faraday (C/mol)
export const FARADAY_CONSTANT = 96485

// Potenciais padrão de redução (V vs SHE)
export const STANDARD_REDUCTION_POTENTIALS: Record<string, { ion: string; potential: number; product: string }> = {
    // Cátions (redução no cátodo)
    'H+': { ion: 'H⁺', potential: 0.00, product: 'H₂' },
    'Na+': { ion: 'Na⁺', potential: -2.71, product: 'Na' },
    'K+': { ion: 'K⁺', potential: -2.93, product: 'K' },
    'Ca2+': { ion: 'Ca²⁺', potential: -2.87, product: 'Ca' },
    'Mg2+': { ion: 'Mg²⁺', potential: -2.37, product: 'Mg' },
    'Al3+': { ion: 'Al³⁺', potential: -1.66, product: 'Al' },
    'Zn2+': { ion: 'Zn²⁺', potential: -0.76, product: 'Zn' },
    'Fe2+': { ion: 'Fe²⁺', potential: -0.44, product: 'Fe' },
    'Cu2+': { ion: 'Cu²⁺', potential: 0.34, product: 'Cu' },
    'Ag+': { ion: 'Ag⁺', potential: 0.80, product: 'Ag' },
    'Au3+': { ion: 'Au³⁺', potential: 1.50, product: 'Au' },

    // Ânions (oxidação no ânodo - potenciais invertidos)
    'OH-': { ion: 'OH⁻', potential: -0.40, product: 'O₂' },
    'Cl-': { ion: 'Cl⁻', potential: -1.36, product: 'Cl₂' },
    'Br-': { ion: 'Br⁻', potential: -1.07, product: 'Br₂' },
    'I-': { ion: 'I⁻', potential: -0.54, product: 'I₂' },
    'SO4-2': { ion: 'SO₄²⁻', potential: -2.01, product: 'S₂O₈²⁻' },
}

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export type Electrolyte = {
    formula: string
    name: string
    cation: string
    anion: string
    concentration: number      // mol/L
    color: string
    conductivity: number       // S/m (condutividade)
}

export type Electrode = {
    id: string
    type: 'anode' | 'cathode'
    material: 'platinum' | 'graphite' | 'copper' | 'zinc' | 'iron' | 'silver'
    position: { x: number; y: number }
    gasProduced: string
    gasVolume: number          // mL
    depositMass: number        // g de metal depositado
    bubbleRate: number         // bolhas por segundo
    isActive: boolean
}

export type ElectrolysisState = {
    voltage: number            // V aplicada
    current: number            // A
    electrolyte: Electrolyte | null
    cathode: Electrode
    anode: Electrode
    time: number               // segundos
    temperature: number        // C
    isRunning: boolean
    efficiency: number         // 0-1
}

export type ElectrolysisResult = {
    cathodeProduct: string
    anodeProduct: string
    cathodeAmount: number      // mol
    anodeAmount: number        // mol
    voltageRequired: number
    overallReaction: string
}

// ═══════════════════════════════════════════════════════════════════════
// ELETRÓLITOS COMUNS
// ═══════════════════════════════════════════════════════════════════════

export const ELECTROLYTES: Record<string, Electrolyte> = {
    water: {
        formula: 'H₂O',
        name: 'Água Pura',
        cation: 'H+',
        anion: 'OH-',
        concentration: 0.0000001, // pH 7 = 10^-7 M de H+
        color: '#4a90d9',
        conductivity: 0.000005   // Água pura conduz muito pouco
    },

    sodiumChloride: {
        formula: 'NaCl',
        name: 'Cloreto de Sódio (Salmoura)',
        cation: 'Na+',
        anion: 'Cl-',
        concentration: 0.5,
        color: '#e8f4fc',
        conductivity: 10.5
    },

    copperSulfate: {
        formula: 'CuSO₄',
        name: 'Sulfato de Cobre II',
        cation: 'Cu2+',
        anion: 'SO4-2',
        concentration: 0.5,
        color: '#1e90ff',
        conductivity: 8.5
    },

    sulfuricAcid: {
        formula: 'H₂SO₄',
        name: 'Ácido Sulfúrico (diluído)',
        cation: 'H+',
        anion: 'SO4-2',
        concentration: 1.0,
        color: '#f0f8ff',
        conductivity: 82.6
    },

    sodiumHydroxide: {
        formula: 'NaOH',
        name: 'Hidróxido de Sódio',
        cation: 'Na+',
        anion: 'OH-',
        concentration: 1.0,
        color: '#f5f5f5',
        conductivity: 21.3
    },

    potassiumIodide: {
        formula: 'KI',
        name: 'Iodeto de Potássio',
        cation: 'K+',
        anion: 'I-',
        concentration: 0.5,
        color: '#fffacd',
        conductivity: 14.0
    },

    zincSulfate: {
        formula: 'ZnSO₄',
        name: 'Sulfato de Zinco',
        cation: 'Zn2+',
        anion: 'SO4-2',
        concentration: 0.5,
        color: '#f0ffff',
        conductivity: 7.5
    },

    silverNitrate: {
        formula: 'AgNO₃',
        name: 'Nitrato de Prata',
        cation: 'Ag+',
        anion: 'NO3-',
        concentration: 0.1,
        color: '#f8f8ff',
        conductivity: 4.5
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determina os produtos da eletrólise baseado no eletrólito e eletrodos
 */
export function predictElectrolysisProducts(electrolyte: Electrolyte): ElectrolysisResult {
    const cationData = STANDARD_REDUCTION_POTENTIALS[electrolyte.cation]
    const anionData = STANDARD_REDUCTION_POTENTIALS[electrolyte.anion]
    const waterCation = STANDARD_REDUCTION_POTENTIALS['H+']
    const waterAnion = STANDARD_REDUCTION_POTENTIALS['OH-']

    // No cátodo: íon com MAIOR potencial de redução é reduzido
    // Comparar cátion do sal com H+ (da água)
    let cathodeProduct: string
    let cathodeReduction: number

    if (!cationData || cationData.potential < waterCation.potential) {
        // H+ é reduzido (produz H2)
        cathodeProduct = 'H₂'
        cathodeReduction = waterCation.potential
    } else {
        cathodeProduct = cationData.product
        cathodeReduction = cationData.potential
    }

    // No ânodo: íon com MENOR potencial de redução é oxidado
    // Comparar ânion do sal com OH- (da água)
    let anodeProduct: string
    let anodeOxidation: number

    if (!anionData) {
        anodeProduct = 'O₂'
        anodeOxidation = -waterAnion.potential
    } else if (Math.abs(anionData.potential) < Math.abs(waterAnion.potential)) {
        // Ânion do sal é oxidado
        anodeProduct = anionData.product
        anodeOxidation = -anionData.potential
    } else {
        // OH- é oxidado (produz O2)
        anodeProduct = 'O₂'
        anodeOxidation = -waterAnion.potential
    }

    // Tensão mínima = E°cátodo - E°ânodo (+ sobretensão)
    const voltageRequired = Math.abs(cathodeReduction - anodeOxidation) + 0.5 // +0.5V sobretensão

    // Construir reação geral
    const overallReaction = buildOverallReaction(electrolyte, cathodeProduct, anodeProduct)

    return {
        cathodeProduct,
        anodeProduct,
        cathodeAmount: 0,
        anodeAmount: 0,
        voltageRequired,
        overallReaction
    }
}

function buildOverallReaction(electrolyte: Electrolyte, cathodeProduct: string, anodeProduct: string): string {
    // Reações típicas
    if (cathodeProduct === 'H₂' && anodeProduct === 'O₂') {
        return '2H₂O → 2H₂ + O₂'
    }

    if (electrolyte.formula === 'NaCl') {
        return '2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH'
    }

    if (electrolyte.formula === 'CuSO₄') {
        return 'Cu²⁺ + 2e⁻ → Cu (cátodo) | 2H₂O → O₂ + 4H⁺ + 4e⁻ (ânodo)'
    }

    if (electrolyte.formula === 'KI') {
        return '2I⁻ → I₂ + 2e⁻ (ânodo) | 2H₂O + 2e⁻ → H₂ + 2OH⁻ (cátodo)'
    }

    return `${cathodeProduct} (cátodo) + ${anodeProduct} (ânodo)`
}

/**
 * Calcula a corrente elétrica baseada na Lei de Ohm
 * I = V / R, onde R depende da condutividade do eletrólito
 */
export function calculateCurrent(voltage: number, electrolyte: Electrolyte, electrodeArea: number = 0.01): number {
    // Resistência aproximada baseada na condutividade
    // R = L / (A * σ), assumindo L = 0.1m (distância entre eletrodos)
    const distance = 0.1 // metros
    const resistance = distance / (electrodeArea * electrolyte.conductivity)

    // Só flui corrente se a tensão for suficiente
    const products = predictElectrolysisProducts(electrolyte)
    if (voltage < products.voltageRequired) {
        return 0
    }

    // Corrente limitada pela tensão acima do mínimo
    const effectiveVoltage = voltage - products.voltageRequired
    return Math.min(effectiveVoltage / resistance, 10) // Limitar a 10A por segurança
}

/**
 * Lei de Faraday: m = (M * I * t) / (z * F)
 * Calcula a massa de produto formada
 * 
 * @param current - Corrente em Amperes
 * @param time - Tempo em segundos
 * @param molarMass - Massa molar do produto (g/mol)
 * @param electronTransfer - Número de elétrons transferidos (z)
 * @returns Massa em gramas
 */
export function calculateMassDeposited(
    current: number,
    time: number,
    molarMass: number,
    electronTransfer: number
): number {
    return (molarMass * current * time) / (electronTransfer * FARADAY_CONSTANT)
}

/**
 * Calcula o volume de gás produzido (nas CNTP)
 * V = n * Vm, onde Vm = 22.4 L/mol
 */
export function calculateGasVolume(moles: number): number {
    const molarVolume = 22.4 // L/mol nas CNTP
    return moles * molarVolume * 1000 // converter para mL
}

/**
 * Calcula a proporção H2:O2 (deveria ser sempre 2:1)
 */
export function calculateHydrogenOxygenRatio(hydrogenMoles: number, oxygenMoles: number): number {
    if (oxygenMoles === 0) return 0
    return hydrogenMoles / oxygenMoles
}

/**
 * Calcula o tempo necessário para produzir uma quantidade de produto
 */
export function calculateTimeRequired(
    targetMass: number,
    current: number,
    molarMass: number,
    electronTransfer: number
): number {
    if (current <= 0) return Infinity
    return (targetMass * electronTransfer * FARADAY_CONSTANT) / (molarMass * current)
}

/**
 * Calcula a taxa de produção de bolhas baseada na corrente
 */
export function calculateBubbleRate(current: number, gasType: 'H2' | 'O2' | 'Cl2'): number {
    // Base: corrente / (número de elétrons por molécula)
    const electronsPerMolecule = {
        'H2': 2,   // 2H+ + 2e- → H2
        'O2': 4,   // 2H2O → O2 + 4H+ + 4e-
        'Cl2': 2   // 2Cl- → Cl2 + 2e-
    }

    const rate = (current / electronsPerMolecule[gasType]) * 100 // bolhas por segundo
    return Math.min(rate, 50) // Limitar para visualização
}

// ═══════════════════════════════════════════════════════════════════════
// ESTADO INICIAL
// ═══════════════════════════════════════════════════════════════════════

export function createInitialElectrolysisState(): ElectrolysisState {
    return {
        voltage: 0,
        current: 0,
        electrolyte: null,
        cathode: {
            id: 'cathode',
            type: 'cathode',
            material: 'platinum',
            position: { x: -50, y: 0 },
            gasProduced: '',
            gasVolume: 0,
            depositMass: 0,
            bubbleRate: 0,
            isActive: false
        },
        anode: {
            id: 'anode',
            type: 'anode',
            material: 'platinum',
            position: { x: 50, y: 0 },
            gasProduced: '',
            gasVolume: 0,
            depositMass: 0,
            bubbleRate: 0,
            isActive: false
        },
        time: 0,
        temperature: 25,
        isRunning: false,
        efficiency: 0.95  // 95% de eficiência típica
    }
}

/**
 * Atualiza o estado da eletrólise a cada frame
 */
export function updateElectrolysis(state: ElectrolysisState, deltaTime: number): ElectrolysisState {
    if (!state.isRunning || !state.electrolyte) return state

    const newState = { ...state }
    newState.time += deltaTime

    // Calcular corrente
    newState.current = calculateCurrent(state.voltage, state.electrolyte)

    if (newState.current <= 0) {
        newState.cathode.isActive = false
        newState.anode.isActive = false
        return newState
    }

    // Prever produtos
    const products = predictElectrolysisProducts(state.electrolyte)

    // Ativar eletrodos
    newState.cathode = { ...state.cathode, isActive: true, gasProduced: products.cathodeProduct }
    newState.anode = { ...state.anode, isActive: true, gasProduced: products.anodeProduct }

    // Calcular produção
    const effectiveCurrent = newState.current * state.efficiency

    // Cátodo (ex: H2 ou Cu)
    if (products.cathodeProduct === 'H₂') {
        // H2: 2 elétrons por molécula, M = 2 g/mol
        const molesH2 = (effectiveCurrent * deltaTime) / (2 * FARADAY_CONSTANT)
        newState.cathode.gasVolume = state.cathode.gasVolume + calculateGasVolume(molesH2)
        newState.cathode.bubbleRate = calculateBubbleRate(newState.current, 'H2')
    } else if (products.cathodeProduct === 'Cu') {
        // Cu: 2 elétrons, M = 63.5 g/mol
        const massCu = calculateMassDeposited(effectiveCurrent, deltaTime, 63.5, 2)
        newState.cathode.depositMass = state.cathode.depositMass + massCu
        newState.cathode.bubbleRate = 0
    }

    // Ânodo (ex: O2 ou Cl2)
    if (products.anodeProduct === 'O₂') {
        // O2: 4 elétrons por molécula, M = 32 g/mol
        const molesO2 = (effectiveCurrent * deltaTime) / (4 * FARADAY_CONSTANT)
        newState.anode.gasVolume = state.anode.gasVolume + calculateGasVolume(molesO2)
        newState.anode.bubbleRate = calculateBubbleRate(newState.current, 'O2')
    } else if (products.anodeProduct === 'Cl₂') {
        // Cl2: 2 elétrons, M = 71 g/mol
        const molesCl2 = (effectiveCurrent * deltaTime) / (2 * FARADAY_CONSTANT)
        newState.anode.gasVolume = state.anode.gasVolume + calculateGasVolume(molesCl2)
        newState.anode.bubbleRate = calculateBubbleRate(newState.current, 'Cl2')
    }

    return newState
}

// ═══════════════════════════════════════════════════════════════════════
// CORES DOS PRODUTOS
// ═══════════════════════════════════════════════════════════════════════

export const PRODUCT_COLORS: Record<string, string> = {
    'H₂': '#ffffff',      // Incolor (bolhas brancas)
    'O₂': '#ffffff',      // Incolor (bolhas brancas)
    'Cl₂': '#90EE90',     // Verde-amarelado
    'Br₂': '#8B4513',     // Marrom-avermelhado
    'I₂': '#4B0082',      // Roxo escuro
    'Cu': '#b87333',      // Cobre metálico
    'Ag': '#C0C0C0',      // Prata metálica
    'Zn': '#A9A9A9',      // Zinco metálico
    'Na': '#FFD700',      // Sódio (perigoso! reage com água)
}

/**
 * Obtém a cor da bolha/depósito para visualização
 */
export function getProductColor(product: string): string {
    return PRODUCT_COLORS[product] || '#cccccc'
}
