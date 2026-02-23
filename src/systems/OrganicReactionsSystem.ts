// src/systems/OrganicReactionsSystem.ts
// Sistema de reações orgânicas com visualização

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export type OrganicReactionType =
    | 'nylon-synthesis'      // Polimerização de nylon
    | 'slime-synthesis'      // Síntese de slime (PVA + borato)
    | 'esterification'       // Formação de éster
    | 'saponification'       // Fabricação de sabão
    | 'fermentation'         // Fermentação alcoólica
    | 'combustion'           // Combustão orgânica
    | 'oxidation'            // Oxidação de álcool

export interface OrganicReagent {
    id: string
    name: string
    formula: string
    type: 'monomer' | 'polymer' | 'alcohol' | 'acid' | 'base' | 'ester' | 'catalyst' | 'other'
    color: string
    viscosity: number       // 0-1 (água=0, slime=0.9)
    isOrganic: boolean
}

export interface OrganicReaction {
    id: string
    type: OrganicReactionType
    name: string
    description: string
    reagent1: OrganicReagent
    reagent2: OrganicReagent
    catalyst?: OrganicReagent
    products: OrganicReagent[]
    byproducts?: OrganicReagent[]
    visualEffect: 'thread-formation' | 'gel-formation' | 'bubbles' | 'color-change' | 'smell' | 'heat'
    reactionTime: number    // segundos
    requiresHeat: boolean
    optimalTemp?: number    // °C
}

export interface OrganicReactionState {
    reaction: OrganicReaction | null
    progress: number        // 0-1
    isReacting: boolean
    temperature: number
    stirring: boolean
    threadLength?: number   // Para síntese de nylon
    gelViscosity?: number   // Para slime
    bubbleRate?: number     // Para fermentação
}

// ═══════════════════════════════════════════════════════════════════════
// REAGENTES ORGÂNICOS
// ═══════════════════════════════════════════════════════════════════════

export const ORGANIC_REAGENTS: Record<string, OrganicReagent> = {
    // Monômeros para Nylon
    hexamethyleneDiamine: {
        id: 'hexamethyleneDiamine',
        name: 'Hexametilenodiamina',
        formula: 'H₂N(CH₂)₆NH₂',
        type: 'monomer',
        color: '#f5f5dc',
        viscosity: 0.1,
        isOrganic: true
    },
    adipoylChloride: {
        id: 'adipoylChloride',
        name: 'Cloreto de Adipoíla',
        formula: 'ClOC(CH₂)₄COCl',
        type: 'monomer',
        color: '#fffaf0',
        viscosity: 0.15,
        isOrganic: true
    },
    nylon66: {
        id: 'nylon66',
        name: 'Nylon 6,6',
        formula: '[-NH(CH₂)₆NH-CO(CH₂)₄CO-]ₙ',
        type: 'polymer',
        color: '#f5f5f5',
        viscosity: 0.9,
        isOrganic: true
    },

    // Reagentes para Slime
    pva: {
        id: 'pva',
        name: 'Cola Branca (PVA)',
        formula: '[-CH₂CHOCOCH₃-]ₙ',
        type: 'polymer',
        color: '#fffafa',
        viscosity: 0.4,
        isOrganic: true
    },
    borax: {
        id: 'borax',
        name: 'Bórax',
        formula: 'Na₂B₄O₇·10H₂O',
        type: 'other',
        color: '#ffffff',
        viscosity: 0.1,
        isOrganic: false
    },
    slime: {
        id: 'slime',
        name: 'Slime (Gel de PVA)',
        formula: 'PVA-B-PVA',
        type: 'polymer',
        color: '#7fff00',
        viscosity: 0.85,
        isOrganic: true
    },

    // Reagentes para Esterificação
    ethanol: {
        id: 'ethanol',
        name: 'Etanol',
        formula: 'C₂H₅OH',
        type: 'alcohol',
        color: '#f8f8ff',
        viscosity: 0.05,
        isOrganic: true
    },
    aceticAcid: {
        id: 'aceticAcid',
        name: 'Ácido Acético (Vinagre)',
        formula: 'CH₃COOH',
        type: 'acid',
        color: '#f5fffa',
        viscosity: 0.08,
        isOrganic: true
    },
    sulfuricAcidCatalyst: {
        id: 'sulfuricAcidCatalyst',
        name: 'Ácido Sulfúrico (catalisador)',
        formula: 'H₂SO₄',
        type: 'catalyst',
        color: '#f0f8ff',
        viscosity: 0.2,
        isOrganic: false
    },
    ethylAcetate: {
        id: 'ethylAcetate',
        name: 'Acetato de Etila',
        formula: 'CH₃COOC₂H₅',
        type: 'ester',
        color: '#fffaf0',
        viscosity: 0.03,
        isOrganic: true
    },

    // Reagentes para Saponificação
    vegetableOil: {
        id: 'vegetableOil',
        name: 'Óleo Vegetal',
        formula: 'Triglicerídeo',
        type: 'other',
        color: '#f0e68c',
        viscosity: 0.5,
        isOrganic: true
    },
    sodiumHydroxide: {
        id: 'sodiumHydroxide',
        name: 'Hidróxido de Sódio (Soda)',
        formula: 'NaOH',
        type: 'base',
        color: '#ffffff',
        viscosity: 0.1,
        isOrganic: false
    },
    soap: {
        id: 'soap',
        name: 'Sabão',
        formula: 'RCOONa',
        type: 'other',
        color: '#fffff0',
        viscosity: 0.3,
        isOrganic: true
    },
    glycerol: {
        id: 'glycerol',
        name: 'Glicerol (Glicerina)',
        formula: 'C₃H₈O₃',
        type: 'alcohol',
        color: '#f8f8ff',
        viscosity: 0.6,
        isOrganic: true
    },

    // Reagentes para Fermentação
    glucose: {
        id: 'glucose',
        name: 'Glicose',
        formula: 'C₆H₁₂O₆',
        type: 'other',
        color: '#fffaf0',
        viscosity: 0.3,
        isOrganic: true
    },
    yeast: {
        id: 'yeast',
        name: 'Fermento Biológico',
        formula: 'Saccharomyces',
        type: 'catalyst',
        color: '#f5deb3',
        viscosity: 0.2,
        isOrganic: true
    },
    carbonDioxide: {
        id: 'carbonDioxide',
        name: 'Dióxido de Carbono',
        formula: 'CO₂',
        type: 'other',
        color: '#f5f5f5',
        viscosity: 0,
        isOrganic: false
    },

    // Para oxidação
    potassiumDichromate: {
        id: 'potassiumDichromate',
        name: 'Dicromato de Potássio',
        formula: 'K₂Cr₂O₇',
        type: 'catalyst',
        color: '#ff8c00',
        viscosity: 0.1,
        isOrganic: false
    },
    aceticAldehyde: {
        id: 'aceticAldehyde',
        name: 'Acetaldeído',
        formula: 'CH₃CHO',
        type: 'other',
        color: '#f5f5f5',
        viscosity: 0.02,
        isOrganic: true
    }
}

// ═══════════════════════════════════════════════════════════════════════
// REAÇÕES ORGÂNICAS
// ═══════════════════════════════════════════════════════════════════════

export const ORGANIC_REACTIONS: Record<string, OrganicReaction> = {
    nylonSynthesis: {
        id: 'nylonSynthesis',
        type: 'nylon-synthesis',
        name: 'Síntese do Nylon 6,6',
        description: 'Polimerização interfacial formando um fio de nylon que pode ser puxado continuamente.',
        reagent1: ORGANIC_REAGENTS.hexamethyleneDiamine,
        reagent2: ORGANIC_REAGENTS.adipoylChloride,
        products: [ORGANIC_REAGENTS.nylon66],
        byproducts: [{ ...ORGANIC_REAGENTS.sodiumHydroxide, name: 'HCl (liberado)', formula: 'HCl' }],
        visualEffect: 'thread-formation',
        reactionTime: 2,
        requiresHeat: false,
        optimalTemp: 25
    },

    slimeSynthesis: {
        id: 'slimeSynthesis',
        type: 'slime-synthesis',
        name: 'Síntese de Slime',
        description: 'O bórax forma ligações cruzadas entre as cadeias de PVA, criando um gel viscoso.',
        reagent1: ORGANIC_REAGENTS.pva,
        reagent2: ORGANIC_REAGENTS.borax,
        products: [ORGANIC_REAGENTS.slime],
        visualEffect: 'gel-formation',
        reactionTime: 5,
        requiresHeat: false,
        optimalTemp: 25
    },

    esterification: {
        id: 'esterification',
        type: 'esterification',
        name: 'Esterificação de Fischer',
        description: 'Álcool + Ácido carboxílico → Éster + Água. Produz aroma característico de frutas.',
        reagent1: ORGANIC_REAGENTS.ethanol,
        reagent2: ORGANIC_REAGENTS.aceticAcid,
        catalyst: ORGANIC_REAGENTS.sulfuricAcidCatalyst,
        products: [ORGANIC_REAGENTS.ethylAcetate],
        byproducts: [{
            id: 'water',
            name: 'Água',
            formula: 'H₂O',
            type: 'other',
            color: '#e0f7ff',
            viscosity: 0,
            isOrganic: false
        }],
        visualEffect: 'smell',
        reactionTime: 30,
        requiresHeat: true,
        optimalTemp: 70
    },

    saponification: {
        id: 'saponification',
        type: 'saponification',
        name: 'Saponificação (Fazer Sabão)',
        description: 'Gordura + Base forte → Sabão + Glicerina. Reação exotérmica.',
        reagent1: ORGANIC_REAGENTS.vegetableOil,
        reagent2: ORGANIC_REAGENTS.sodiumHydroxide,
        products: [ORGANIC_REAGENTS.soap, ORGANIC_REAGENTS.glycerol],
        visualEffect: 'heat',
        reactionTime: 60,
        requiresHeat: true,
        optimalTemp: 80
    },

    fermentation: {
        id: 'fermentation',
        type: 'fermentation',
        name: 'Fermentação Alcoólica',
        description: 'Glicose → Etanol + CO₂. Processo biológico que produz bolhas.',
        reagent1: ORGANIC_REAGENTS.glucose,
        reagent2: ORGANIC_REAGENTS.yeast,
        products: [ORGANIC_REAGENTS.ethanol, ORGANIC_REAGENTS.carbonDioxide],
        visualEffect: 'bubbles',
        reactionTime: 120,
        requiresHeat: false,
        optimalTemp: 35
    },

    alcoholOxidation: {
        id: 'alcoholOxidation',
        type: 'oxidation',
        name: 'Oxidação de Álcool',
        description: 'Oxidação do etanol com dicromato, mudando a cor de laranja para verde.',
        reagent1: ORGANIC_REAGENTS.ethanol,
        reagent2: ORGANIC_REAGENTS.potassiumDichromate,
        products: [ORGANIC_REAGENTS.aceticAldehyde],
        visualEffect: 'color-change',
        reactionTime: 10,
        requiresHeat: false,
        optimalTemp: 25
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DO SISTEMA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Verifica se dois reagentes podem reagir
 */
export function canReact(reagent1Id: string, reagent2Id: string): OrganicReaction | null {
    for (const reaction of Object.values(ORGANIC_REACTIONS)) {
        if (
            (reaction.reagent1.id === reagent1Id && reaction.reagent2.id === reagent2Id) ||
            (reaction.reagent1.id === reagent2Id && reaction.reagent2.id === reagent1Id)
        ) {
            return reaction
        }
    }
    return null
}

/**
 * Cria estado inicial de reação
 */
export function createReactionState(reactionId?: string): OrganicReactionState {
    return {
        reaction: reactionId ? ORGANIC_REACTIONS[reactionId] : null,
        progress: 0,
        isReacting: false,
        temperature: 25,
        stirring: false,
        threadLength: 0,
        gelViscosity: 0,
        bubbleRate: 0
    }
}

/**
 * Atualiza o estado da reação orgânica
 */
export function updateOrganicReaction(
    state: OrganicReactionState,
    deltaTime: number
): OrganicReactionState {
    if (!state.reaction || !state.isReacting) return state

    const newState = { ...state }

    // Verificar temperatura adequada
    const tempOk = !state.reaction.requiresHeat ||
        (state.temperature >= (state.reaction.optimalTemp || 25) - 10)

    if (!tempOk) {
        // Reação muito lenta se temperatura inadequada
        newState.progress += deltaTime / (state.reaction.reactionTime * 10)
    } else {
        // Progresso normal
        newState.progress += deltaTime / state.reaction.reactionTime

        // Agitação acelera a reação
        if (state.stirring) {
            newState.progress += deltaTime / (state.reaction.reactionTime * 2)
        }
    }

    // Clamp progress
    newState.progress = Math.min(newState.progress, 1)

    // Atualizar efeitos específicos por tipo
    switch (state.reaction.type) {
        case 'nylon-synthesis':
            // Comprimento do fio cresce continuamente
            if (newState.progress > 0.1) {
                newState.threadLength = (newState.threadLength || 0) + deltaTime * 0.05
            }
            break

        case 'slime-synthesis':
            // Viscosidade aumenta
            newState.gelViscosity = newState.progress * 0.85
            break

        case 'fermentation':
            // Taxa de bolhas baseada no progresso
            if (newState.progress > 0.05 && newState.progress < 0.95) {
                newState.bubbleRate = 5 + newState.progress * 10
            } else {
                newState.bubbleRate = 0
            }
            break
    }

    // Reação completa
    if (newState.progress >= 1) {
        newState.isReacting = false
    }

    return newState
}

/**
 * Calcula a cor resultante baseada no progresso
 */
export function getReactionColor(state: OrganicReactionState): string {
    if (!state.reaction) return '#ffffff'

    const { reaction, progress } = state

    // Interpolação de cor entre reagentes e produto
    const startColor = reaction.reagent1.color
    const endColor = reaction.products[0]?.color || '#ffffff'

    // Interpolação simples
    return lerpColor(startColor, endColor, progress)
}

function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)

    if (!c1 || !c2) return color1

    const r = Math.round(c1.r + (c2.r - c1.r) * t)
    const g = Math.round(c1.g + (c2.g - c1.g) * t)
    const b = Math.round(c1.b + (c2.b - c1.b) * t)

    return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

/**
 * Obtém descrição do estado atual
 */
export function getReactionStatus(state: OrganicReactionState): string {
    if (!state.reaction) return 'Sem reação'

    if (!state.isReacting && state.progress === 0) {
        return 'Pronto para reagir'
    }

    if (state.isReacting) {
        const percentage = Math.round(state.progress * 100)

        switch (state.reaction.type) {
            case 'nylon-synthesis':
                return `Polimerizando... ${percentage}% (${(state.threadLength || 0).toFixed(1)}m de fio)`
            case 'slime-synthesis':
                return `Gelificando... ${percentage}%`
            case 'fermentation':
                return `Fermentando... ${percentage}% (${state.bubbleRate?.toFixed(0) || 0} bolhas/s)`
            case 'esterification':
                return `Esterificando... ${percentage}%`
            case 'saponification':
                return `Saponificando... ${percentage}%`
            case 'oxidation':
                return `Oxidando... ${percentage}%`
            default:
                return `Reagindo... ${percentage}%`
        }
    }

    return `Reação completa: ${state.reaction.products.map(p => p.name).join(' + ')}`
}

/**
 * Obtém ícone/emoji para o efeito visual
 */
export function getEffectEmoji(effect: OrganicReaction['visualEffect']): string {
    switch (effect) {
        case 'thread-formation': return '🧵'
        case 'gel-formation': return '🟢'
        case 'bubbles': return '🫧'
        case 'color-change': return '🎨'
        case 'smell': return '👃'
        case 'heat': return '🔥'
        default: return '⚗️'
    }
}
