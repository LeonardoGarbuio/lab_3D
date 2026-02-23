// src/systems/DistillationSystem.ts
// Sistema de destilação fracionada com separação por ponto de ebulição

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export interface DistillableComponent {
    id: string
    name: string
    formula: string
    boilingPoint: number      // °C
    color: string
    volumeFraction: number    // 0-1 (fração do volume total)
    isCollected: boolean
    collectedVolume: number   // mL
}

export interface DistillationMixture {
    id: string
    name: string
    components: DistillableComponent[]
    totalVolume: number       // mL
}

export interface DistillationState {
    mixture: DistillationMixture | null
    temperature: number       // °C atual no frasco
    heatingRate: number       // °C/s
    isHeating: boolean
    condenserTemperature: number  // °C no condensador
    distillateVolume: number  // mL coletado
    currentFraction: DistillableComponent | null
    vaporizing: boolean
    vaporRate: number         // mL/s
    collectingFractionIndex: number
    fractionCollected: { component: DistillableComponent; volume: number }[]
}

// ═══════════════════════════════════════════════════════════════════════
// MISTURAS PREDEFINIDAS
// ═══════════════════════════════════════════════════════════════════════

export const DISTILLATION_MIXTURES: Record<string, DistillationMixture> = {
    petroleum: {
        id: 'petroleum',
        name: 'Petróleo (simplificado)',
        totalVolume: 500,
        components: [
            {
                id: 'gasoline',
                name: 'Gasolina',
                formula: 'C₅-C₁₂',
                boilingPoint: 40,
                color: '#fff8dc',
                volumeFraction: 0.25,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'kerosene',
                name: 'Querosene',
                formula: 'C₁₂-C₁₅',
                boilingPoint: 175,
                color: '#ffefd5',
                volumeFraction: 0.15,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'diesel',
                name: 'Óleo Diesel',
                formula: 'C₁₅-C₁₉',
                boilingPoint: 250,
                color: '#f5deb3',
                volumeFraction: 0.20,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'lubricant',
                name: 'Óleo Lubrificante',
                formula: 'C₂₀-C₅₀',
                boilingPoint: 350,
                color: '#daa520',
                volumeFraction: 0.25,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'asphalt',
                name: 'Asfalto',
                formula: 'C₅₀+',
                boilingPoint: 500,
                color: '#2f2f2f',
                volumeFraction: 0.15,
                isCollected: false,
                collectedVolume: 0
            }
        ]
    },

    ethanolWater: {
        id: 'ethanolWater',
        name: 'Mistura Etanol-Água',
        totalVolume: 200,
        components: [
            {
                id: 'ethanol',
                name: 'Etanol',
                formula: 'C₂H₅OH',
                boilingPoint: 78.37,
                color: '#f8f8ff',
                volumeFraction: 0.50,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'water',
                name: 'Água',
                formula: 'H₂O',
                boilingPoint: 100,
                color: '#e0f0ff',
                volumeFraction: 0.50,
                isCollected: false,
                collectedVolume: 0
            }
        ]
    },

    acetoneWater: {
        id: 'acetoneWater',
        name: 'Acetona em Água',
        totalVolume: 150,
        components: [
            {
                id: 'acetone',
                name: 'Acetona',
                formula: 'C₃H₆O',
                boilingPoint: 56.05,
                color: '#f0ffff',
                volumeFraction: 0.30,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'water',
                name: 'Água',
                formula: 'H₂O',
                boilingPoint: 100,
                color: '#e0f0ff',
                volumeFraction: 0.70,
                isCollected: false,
                collectedVolume: 0
            }
        ]
    },

    airLiquefaction: {
        id: 'airLiquefaction',
        name: 'Ar Liquefeito',
        totalVolume: 100,
        components: [
            {
                id: 'nitrogen',
                name: 'Nitrogênio',
                formula: 'N₂',
                boilingPoint: -195.8,
                color: '#e6f3ff',
                volumeFraction: 0.78,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'argon',
                name: 'Argônio',
                formula: 'Ar',
                boilingPoint: -185.8,
                color: '#e0e0e0',
                volumeFraction: 0.01,
                isCollected: false,
                collectedVolume: 0
            },
            {
                id: 'oxygen',
                name: 'Oxigênio',
                formula: 'O₂',
                boilingPoint: -183.0,
                color: '#cce6ff',
                volumeFraction: 0.21,
                isCollected: false,
                collectedVolume: 0
            }
        ]
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determina qual componente está evaporando baseado na temperatura
 */
export function getCurrentEvaporatingComponent(
    mixture: DistillationMixture,
    temperature: number
): DistillableComponent | null {
    // Ordenar por ponto de ebulição
    const sortedComponents = [...mixture.components].sort((a, b) => a.boilingPoint - b.boilingPoint)

    // Encontrar o componente que está evaporando
    for (const component of sortedComponents) {
        // Se já foi todo coletado, pular
        if (component.isCollected) continue

        // Se a temperatura está próxima do ponto de ebulição
        if (temperature >= component.boilingPoint - 2) {
            return component
        }
    }

    return null
}

/**
 * Calcula a taxa de evaporação baseada na temperatura e ponto de ebulição
 */
export function calculateEvaporationRate(
    temperature: number,
    boilingPoint: number,
    heatingPower: number = 1
): number {
    if (temperature < boilingPoint - 5) return 0

    // Taxa aumenta conforme temperatura sobe acima do ponto de ebulição
    const tempDiff = temperature - boilingPoint
    const baseRate = 0.1 * heatingPower

    if (tempDiff < 0) {
        // Abaixo do ponto de ebulição - evaporação mínima
        return baseRate * 0.1 * Math.max(0, 1 + tempDiff / 5)
    }

    // Acima do ponto de ebulição - evaporação rápida
    return baseRate * (1 + tempDiff * 0.1)
}

/**
 * Calcula a temperatura de condensação efetiva
 */
export function calculateCondensationTemperature(
    vaporTemperature: number,
    coolingWaterTemperature: number = 15
): number {
    // O vapor esfria ao passar pelo condensador
    const coolingEfficiency = 0.9
    const tempDiff = vaporTemperature - coolingWaterTemperature
    return coolingWaterTemperature + (tempDiff * (1 - coolingEfficiency))
}

/**
 * Verifica se o vapor vai condensar
 */
export function willCondense(
    vaporTemperature: number,
    condenserTemperature: number,
    componentBoilingPoint: number
): boolean {
    // Condensa se a temperatura no condensador for menor que o ponto de ebulição
    return condenserTemperature < componentBoilingPoint
}

/**
 * Cria estado inicial da destilação
 */
export function createInitialDistillationState(mixtureId?: string): DistillationState {
    return {
        mixture: mixtureId ? { ...DISTILLATION_MIXTURES[mixtureId] } : null,
        temperature: 25,
        heatingRate: 5,          // 5°C/s
        isHeating: false,
        condenserTemperature: 20,
        distillateVolume: 0,
        currentFraction: null,
        vaporizing: false,
        vaporRate: 0,
        collectingFractionIndex: 0,
        fractionCollected: []
    }
}

/**
 * Atualiza o estado da destilação
 */
export function updateDistillation(state: DistillationState, deltaTime: number): DistillationState {
    if (!state.mixture) return state

    const newState = { ...state }

    // Aquecimento
    if (state.isHeating) {
        newState.temperature += state.heatingRate * deltaTime
    } else {
        // Resfriamento natural
        if (newState.temperature > 25) {
            newState.temperature -= 2 * deltaTime
        }
    }

    // Verificar evaporação
    const evaporatingComponent = getCurrentEvaporatingComponent(state.mixture, newState.temperature)

    if (evaporatingComponent) {
        newState.currentFraction = evaporatingComponent
        newState.vaporizing = true

        // Calcular taxa de evaporação
        const evapRate = calculateEvaporationRate(newState.temperature, evaporatingComponent.boilingPoint)
        newState.vaporRate = evapRate

        // Verificar condensação
        const condenses = willCondense(
            newState.temperature,
            state.condenserTemperature,
            evaporatingComponent.boilingPoint
        )

        if (condenses && evapRate > 0) {
            // Calcular volume evaporado
            const volumeEvaporated = evapRate * deltaTime
            const maxVolume = evaporatingComponent.volumeFraction * state.mixture.totalVolume - evaporatingComponent.collectedVolume
            const actualVolume = Math.min(volumeEvaporated, maxVolume)

            // Atualizar volume coletado
            newState.distillateVolume += actualVolume

            // Atualizar componente
            const componentIndex = state.mixture.components.findIndex(c => c.id === evaporatingComponent.id)
            if (componentIndex >= 0) {
                const newComponents = [...state.mixture.components]
                newComponents[componentIndex] = {
                    ...evaporatingComponent,
                    collectedVolume: evaporatingComponent.collectedVolume + actualVolume,
                    isCollected: evaporatingComponent.collectedVolume + actualVolume >=
                        evaporatingComponent.volumeFraction * state.mixture.totalVolume * 0.95
                }
                newState.mixture = { ...state.mixture, components: newComponents }

                // Atualizar frações coletadas
                const existingFraction = newState.fractionCollected.find(f => f.component.id === evaporatingComponent.id)
                if (existingFraction) {
                    existingFraction.volume += actualVolume
                } else {
                    newState.fractionCollected = [
                        ...state.fractionCollected,
                        { component: evaporatingComponent, volume: actualVolume }
                    ]
                }
            }
        }
    } else {
        newState.vaporizing = false
        newState.vaporRate = 0
        newState.currentFraction = null
    }

    return newState
}

/**
 * Gera dados para o gráfico de destilação
 */
export function generateDistillationCurve(mixture: DistillationMixture): Array<{ temperature: number; volume: number }> {
    const data: Array<{ temperature: number; volume: number }> = []
    const sortedComponents = [...mixture.components].sort((a, b) => a.boilingPoint - b.boilingPoint)

    let accumulatedVolume = 0

    // Ponto inicial
    data.push({ temperature: 25, volume: 0 })

    for (const component of sortedComponents) {
        // Platô antes do ponto de ebulição (aquecimento)
        data.push({ temperature: component.boilingPoint - 5, volume: accumulatedVolume })

        // Durante a ebulição - temperatura constante
        const componentVolume = component.volumeFraction * mixture.totalVolume
        data.push({ temperature: component.boilingPoint, volume: accumulatedVolume })

        accumulatedVolume += componentVolume
        data.push({ temperature: component.boilingPoint, volume: accumulatedVolume })

        // Pequeno aumento de temperatura após coletar
        data.push({ temperature: component.boilingPoint + 5, volume: accumulatedVolume })
    }

    return data
}

/**
 * Calcula a pureza da fração coletada
 */
export function calculateFractionPurity(
    targetComponent: DistillableComponent,
    allCollected: { component: DistillableComponent; volume: number }[]
): number {
    const target = allCollected.find(f => f.component.id === targetComponent.id)
    if (!target || target.volume === 0) return 0

    const totalVolume = allCollected.reduce((sum, f) => sum + f.volume, 0)
    return (target.volume / totalVolume) * 100
}
