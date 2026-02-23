// src/systems/SafetySystem.ts
// Sistema de IA de Segurança do Laboratório

// ═══════════════════════════════════════════════════════════════════════
// TIPOS E CONSTANTES
// ═══════════════════════════════════════════════════════════════════════

export type HazardLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical'

export interface SafetyWarning {
    id: string
    level: HazardLevel
    title: string
    message: string
    icon: string
    action?: string
    timestamp: number
}

export interface HazardousCondition {
    condition: string
    check: (state: LabSafetyState) => boolean
    warning: Omit<SafetyWarning, 'id' | 'timestamp'>
}

export interface LabSafetyState {
    // Substâncias presentes
    substances: string[]

    // Condições ambientais
    temperature: number
    pressure: number

    // Equipamentos
    hasFlame: boolean
    hasElectricity: boolean
    hasOpenContainers: boolean

    // Equipamentos de segurança
    hasGoggles: boolean
    hasGloves: boolean
    hasLabCoat: boolean
    hasVentilation: boolean
    hasFireExtinguisher: boolean
    hasEyeWash: boolean
    hasFirstAidKit: boolean

    // Estado do usuário
    nearFlame: boolean
    handlingAcid: boolean
    handlingBase: boolean
    handlingFlammable: boolean
    handlingToxic: boolean
}

// ═══════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO DE SUBSTÂNCIAS
// ═══════════════════════════════════════════════════════════════════════

export const HAZARDOUS_SUBSTANCES: Record<string, {
    hazards: string[]
    ppe: string[]           // Equipamentos de proteção necessários
    incompatible: string[]  // Substâncias incompatíveis
    maxTemp: number         // Temperatura máxima segura
}> = {
    // Ácidos
    'H₂SO₄': {
        hazards: ['corrosive', 'burns', 'dehydrating'],
        ppe: ['goggles', 'gloves', 'labcoat'],
        incompatible: ['NaOH', 'KOH', 'metals', 'water-sensitive'],
        maxTemp: 300
    },
    'HCl': {
        hazards: ['corrosive', 'toxic-vapor', 'irritant'],
        ppe: ['goggles', 'gloves', 'ventilation'],
        incompatible: ['NaOH', 'KOH', 'metals', 'oxidizers'],
        maxTemp: 100
    },
    'HNO₃': {
        hazards: ['corrosive', 'oxidizer', 'toxic-vapor'],
        ppe: ['goggles', 'gloves', 'labcoat', 'ventilation'],
        incompatible: ['organic-compounds', 'metals', 'reducing-agents'],
        maxTemp: 80
    },

    // Bases
    'NaOH': {
        hazards: ['corrosive', 'burns', 'exothermic-dissolution'],
        ppe: ['goggles', 'gloves'],
        incompatible: ['acids', 'aluminum', 'zinc'],
        maxTemp: 200
    },
    'KOH': {
        hazards: ['corrosive', 'burns'],
        ppe: ['goggles', 'gloves'],
        incompatible: ['acids', 'aluminum'],
        maxTemp: 200
    },
    'NH₃': {
        hazards: ['toxic', 'irritant', 'flammable-gas'],
        ppe: ['goggles', 'gloves', 'ventilation', 'respirator'],
        incompatible: ['acids', 'halogens', 'oxidizers'],
        maxTemp: 300
    },

    // Inflamáveis
    'C₂H₅OH': {
        hazards: ['flammable', 'vapor-flammable'],
        ppe: ['goggles'],
        incompatible: ['oxidizers', 'open-flame'],
        maxTemp: 78
    },
    'CH₃OH': {
        hazards: ['flammable', 'toxic', 'blindness-risk'],
        ppe: ['goggles', 'ventilation'],
        incompatible: ['oxidizers', 'open-flame'],
        maxTemp: 64
    },
    'C₃H₆O': { // Acetona
        hazards: ['flammable', 'vapor-flammable', 'irritant'],
        ppe: ['goggles', 'ventilation'],
        incompatible: ['oxidizers', 'open-flame'],
        maxTemp: 56
    },
    'H₂': {
        hazards: ['extremely-flammable', 'explosive', 'asphyxiant'],
        ppe: ['goggles', 'ventilation', 'no-sparks'],
        incompatible: ['oxygen', 'oxidizers', 'open-flame'],
        maxTemp: 500
    },

    // Oxidantes
    'H₂O₂': {
        hazards: ['oxidizer', 'corrosive', 'explosive-conc'],
        ppe: ['goggles', 'gloves'],
        incompatible: ['organic-compounds', 'metals', 'reducing-agents'],
        maxTemp: 50
    },
    'KMnO₄': {
        hazards: ['oxidizer', 'irritant', 'staining'],
        ppe: ['goggles', 'gloves'],
        incompatible: ['organic-compounds', 'reducing-agents', 'sulfuric-acid'],
        maxTemp: 240
    },

    // Tóxicos
    'Cl₂': {
        hazards: ['toxic', 'corrosive', 'oxidizer'],
        ppe: ['goggles', 'gloves', 'respirator', 'ventilation'],
        incompatible: ['ammonia', 'hydrogen', 'flammables'],
        maxTemp: 100
    },
    'CO': {
        hazards: ['toxic', 'flammable', 'asphyxiant'],
        ppe: ['CO-detector', 'ventilation'],
        incompatible: ['oxidizers'],
        maxTemp: 200
    },
    'H₂S': {
        hazards: ['toxic', 'flammable', 'corrosive'],
        ppe: ['respirator', 'ventilation', 'H2S-detector'],
        incompatible: ['oxidizers', 'metals'],
        maxTemp: 100
    },

    // Metais reativos
    'Na': {
        hazards: ['water-reactive', 'flammable', 'corrosive'],
        ppe: ['goggles', 'gloves', 'no-water'],
        incompatible: ['water', 'acids', 'halogens'],
        maxTemp: 97
    },
    'K': {
        hazards: ['water-reactive', 'extremely-flammable', 'corrosive'],
        ppe: ['goggles', 'gloves', 'no-water'],
        incompatible: ['water', 'acids', 'halogens', 'air'],
        maxTemp: 63
    },
    'Mg': {
        hazards: ['flammable', 'water-reactive-when-burning'],
        ppe: ['goggles', 'fire-extinguisher-D'],
        incompatible: ['water-when-burning', 'acids'],
        maxTemp: 650
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CONDIÇÕES PERIGOSAS
// ═══════════════════════════════════════════════════════════════════════

export const HAZARDOUS_CONDITIONS: HazardousCondition[] = [
    // Temperatura
    {
        condition: 'high-temperature',
        check: (state) => state.temperature > 100,
        warning: {
            level: 'warning',
            title: 'Temperatura Elevada',
            message: 'Temperatura acima de 100°C. Risco de queimaduras e ebulição.',
            icon: '🌡️',
            action: 'Reduza o aquecimento ou use equipamento de proteção térmica'
        }
    },
    {
        condition: 'extreme-temperature',
        check: (state) => state.temperature > 300,
        warning: {
            level: 'danger',
            title: 'Temperatura Crítica',
            message: 'Temperatura extremamente alta! Risco de incêndio e decomposição.',
            icon: '🔥',
            action: 'DESLIGUE O AQUECIMENTO IMEDIATAMENTE'
        }
    },

    // Pressão
    {
        condition: 'high-pressure',
        check: (state) => state.pressure > 2,
        warning: {
            level: 'warning',
            title: 'Pressão Elevada',
            message: 'Pressão acima do normal. Risco de ruptura de recipiente.',
            icon: '💨',
            action: 'Libere pressão gradualmente ou resfrie o sistema'
        }
    },
    {
        condition: 'critical-pressure',
        check: (state) => state.pressure > 5,
        warning: {
            level: 'critical',
            title: 'PRESSÃO CRÍTICA',
            message: 'Risco iminente de explosão!',
            icon: '💥',
            action: 'EVACUE A ÁREA E VENTILE'
        }
    },

    // Chama + Inflamáveis
    {
        condition: 'flame-near-flammable',
        check: (state) => state.hasFlame && state.handlingFlammable,
        warning: {
            level: 'danger',
            title: 'Chama Próxima a Inflamável',
            message: 'Substância inflamável próxima a chama aberta!',
            icon: '⚠️🔥',
            action: 'Afaste o inflamável ou apague a chama'
        }
    },

    // Ácido + Base
    {
        condition: 'acid-base-mix',
        check: (state) => state.handlingAcid && state.handlingBase,
        warning: {
            level: 'warning',
            title: 'Mistura Ácido-Base',
            message: 'Cuidado ao misturar ácidos e bases - reação exotérmica!',
            icon: '⚗️',
            action: 'Adicione lentamente e com agitação'
        }
    },

    // Falta de EPIs
    {
        condition: 'no-goggles-with-chemicals',
        check: (state) => !state.hasGoggles && (state.handlingAcid || state.handlingBase || state.handlingToxic),
        warning: {
            level: 'danger',
            title: 'Use Óculos de Proteção!',
            message: 'Manipulando substâncias perigosas sem proteção ocular.',
            icon: '🥽',
            action: 'Equipe óculos de segurança antes de continuar'
        }
    },
    {
        condition: 'no-gloves-with-corrosives',
        check: (state) => !state.hasGloves && (state.handlingAcid || state.handlingBase),
        warning: {
            level: 'warning',
            title: 'Use Luvas de Proteção!',
            message: 'Manipulando substâncias corrosivas sem luvas.',
            icon: '🧤',
            action: 'Use luvas resistentes a produtos químicos'
        }
    },
    {
        condition: 'no-ventilation-with-toxic',
        check: (state) => !state.hasVentilation && state.handlingToxic,
        warning: {
            level: 'danger',
            title: 'Ventilação Necessária!',
            message: 'Substância tóxica em ambiente sem ventilação.',
            icon: '🌬️',
            action: 'Trabalhe em capela de exaustão ou área ventilada'
        }
    },

    // Recipientes abertos
    {
        condition: 'open-containers-flammable',
        check: (state) => state.hasOpenContainers && state.handlingFlammable && state.hasFlame,
        warning: {
            level: 'danger',
            title: 'Recipiente Aberto com Inflamável',
            message: 'Vapores inflamáveis escapando perto de chama!',
            icon: '🔥',
            action: 'Feche o recipiente ou apague a chama'
        }
    }
]

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DO SISTEMA DE SEGURANÇA
// ═══════════════════════════════════════════════════════════════════════

let warningIdCounter = 0

/**
 * Verifica todas as condições de segurança e retorna avisos ativos
 */
export function checkSafetyConditions(state: LabSafetyState): SafetyWarning[] {
    const warnings: SafetyWarning[] = []

    for (const condition of HAZARDOUS_CONDITIONS) {
        if (condition.check(state)) {
            warnings.push({
                ...condition.warning,
                id: `warning-${warningIdCounter++}`,
                timestamp: Date.now()
            })
        }
    }

    // Verificar substâncias específicas
    for (const substance of state.substances) {
        const hazardData = HAZARDOUS_SUBSTANCES[substance]
        if (hazardData) {
            // Verificar temperatura
            if (state.temperature > hazardData.maxTemp) {
                warnings.push({
                    id: `temp-${warningIdCounter++}`,
                    level: 'warning',
                    title: `${substance} - Temperatura Alta`,
                    message: `Temperatura acima do limite seguro para ${substance} (máx: ${hazardData.maxTemp}°C)`,
                    icon: '🌡️',
                    timestamp: Date.now()
                })
            }

            // Verificar incompatibilidades
            for (const other of state.substances) {
                if (other !== substance && isIncompatible(substance, other)) {
                    warnings.push({
                        id: `incompat-${warningIdCounter++}`,
                        level: 'danger',
                        title: 'Substâncias Incompatíveis',
                        message: `${substance} e ${other} são incompatíveis e podem reagir perigosamente!`,
                        icon: '☢️',
                        timestamp: Date.now()
                    })
                }
            }
        }
    }

    return warnings
}

/**
 * Verifica se duas substâncias são incompatíveis
 */
export function isIncompatible(substance1: string, substance2: string): boolean {
    const data1 = HAZARDOUS_SUBSTANCES[substance1]
    const data2 = HAZARDOUS_SUBSTANCES[substance2]

    if (!data1 && !data2) return false

    // Verificar se algum é ácido e outro é base
    const acids = ['H₂SO₄', 'HCl', 'HNO₃', 'H₃PO₄', 'HF']
    const bases = ['NaOH', 'KOH', 'NH₃', 'Ca(OH)₂']

    if (acids.includes(substance1) && bases.includes(substance2)) return false // Neutralização é "ok" com cuidado
    if (bases.includes(substance1) && acids.includes(substance2)) return false

    // Inflamáveis + Oxidantes
    const flammables = ['C₂H₅OH', 'CH₃OH', 'C₃H₆O', 'H₂', 'CH₄']
    const oxidizers = ['H₂O₂', 'KMnO₄', 'HNO₃', 'O₂']

    if (flammables.includes(substance1) && oxidizers.includes(substance2)) return true
    if (oxidizers.includes(substance1) && flammables.includes(substance2)) return true

    // Metais reativos + Água
    const waterReactive = ['Na', 'K', 'Li', 'Mg']
    if (waterReactive.includes(substance1) && substance2 === 'H₂O') return true
    if (substance1 === 'H₂O' && waterReactive.includes(substance2)) return true

    return false
}

/**
 * Obtém os EPIs recomendados para as substâncias presentes
 */
export function getRequiredPPE(substances: string[]): string[] {
    const ppeSet = new Set<string>()

    for (const substance of substances) {
        const data = HAZARDOUS_SUBSTANCES[substance]
        if (data) {
            data.ppe.forEach(ppe => ppeSet.add(ppe))
        }
    }

    return Array.from(ppeSet)
}

/**
 * Obtém a cor do nível de perigo
 */
export function getHazardColor(level: HazardLevel): string {
    switch (level) {
        case 'safe': return '#00ff00'
        case 'caution': return '#ffff00'
        case 'warning': return '#ffa500'
        case 'danger': return '#ff4400'
        case 'critical': return '#ff0000'
        default: return '#ffffff'
    }
}

/**
 * Obtém a prioridade do nível de perigo (para ordenação)
 */
export function getHazardPriority(level: HazardLevel): number {
    switch (level) {
        case 'critical': return 5
        case 'danger': return 4
        case 'warning': return 3
        case 'caution': return 2
        case 'safe': return 1
        default: return 0
    }
}

/**
 * Ordena avisos por prioridade (mais graves primeiro)
 */
export function sortWarningsByPriority(warnings: SafetyWarning[]): SafetyWarning[] {
    return [...warnings].sort((a, b) =>
        getHazardPriority(b.level) - getHazardPriority(a.level)
    )
}

/**
 * Cria estado de segurança padrão
 */
export function createDefaultSafetyState(): LabSafetyState {
    return {
        substances: [],
        temperature: 25,
        pressure: 1,
        hasFlame: false,
        hasElectricity: false,
        hasOpenContainers: false,
        hasGoggles: true,
        hasGloves: true,
        hasLabCoat: true,
        hasVentilation: true,
        hasFireExtinguisher: true,
        hasEyeWash: true,
        hasFirstAidKit: true,
        nearFlame: false,
        handlingAcid: false,
        handlingBase: false,
        handlingFlammable: false,
        handlingToxic: false
    }
}
