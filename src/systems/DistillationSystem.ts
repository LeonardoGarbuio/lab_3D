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
    volumeFraction: number    // 0-1 (fração do volume inicial)
    isCollected: boolean
    collectedVolume: number   // mL
    // Propriedades físico-químicas
    molarMass: number         // g/mol
    density: number           // g/mL
    antoine: { A: number; B: number; C: number } // log10(P) = A - B/(T+C) (P em mmHg, T em °C)
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
            { id: 'gasoline', name: 'Gasolina', formula: 'C₈H₁₈', boilingPoint: 125, color: '#fff8dc', volumeFraction: 0.25, isCollected: false, collectedVolume: 0, molarMass: 114.2, density: 0.703, antoine: { A: 6.9237, B: 1355.126, C: 209.517 } },
            { id: 'kerosene', name: 'Querosene', formula: 'C₁₂H₂₆', boilingPoint: 216, color: '#ffefd5', volumeFraction: 0.15, isCollected: false, collectedVolume: 0, molarMass: 170.3, density: 0.800, antoine: { A: 6.9804, B: 1615.1, C: 185.0 } },
            { id: 'diesel', name: 'Óleo Diesel', formula: 'C₁₆H₃₄', boilingPoint: 287, color: '#f5deb3', volumeFraction: 0.20, isCollected: false, collectedVolume: 0, molarMass: 226.4, density: 0.830, antoine: { A: 7.0264, B: 1845.0, C: 155.0 } },
            { id: 'lubricant', name: 'Óleo Lubrificante', formula: 'C₂₀H₄₂', boilingPoint: 343, color: '#daa520', volumeFraction: 0.25, isCollected: false, collectedVolume: 0, molarMass: 282.5, density: 0.850, antoine: { A: 7.1000, B: 2000.0, C: 130.0 } },
            { id: 'asphalt', name: 'Asfalto', formula: 'C₅₀+', boilingPoint: 500, color: '#2f2f2f', volumeFraction: 0.15, isCollected: false, collectedVolume: 0, molarMass: 700.0, density: 1.050, antoine: { A: 7.2000, B: 2500.0, C: 100.0 } }
        ]
    },
    ethanolWater: {
        id: 'ethanolWater',
        name: 'Mistura Etanol-Água',
        totalVolume: 200,
        components: [
            { id: 'ethanol', name: 'Etanol', formula: 'C₂H₅OH', boilingPoint: 78.37, color: '#f8f8ff', volumeFraction: 0.50, isCollected: false, collectedVolume: 0, molarMass: 46.07, density: 0.789, antoine: { A: 8.20417, B: 1642.89, C: 230.300 } },
            { id: 'water', name: 'Água', formula: 'H₂O', boilingPoint: 100, color: '#e0f0ff', volumeFraction: 0.50, isCollected: false, collectedVolume: 0, molarMass: 18.015, density: 1.000, antoine: { A: 8.07131, B: 1730.63, C: 233.426 } }
        ]
    },
    acetoneWater: {
        id: 'acetoneWater',
        name: 'Acetona em Água',
        totalVolume: 150,
        components: [
            { id: 'acetone', name: 'Acetona', formula: 'C₃H₆O', boilingPoint: 56.05, color: '#f0ffff', volumeFraction: 0.30, isCollected: false, collectedVolume: 0, molarMass: 58.08, density: 0.784, antoine: { A: 7.02447, B: 1161.0, C: 224.0 } },
            { id: 'water', name: 'Água', formula: 'H₂O', boilingPoint: 100, color: '#e0f0ff', volumeFraction: 0.70, isCollected: false, collectedVolume: 0, molarMass: 18.015, density: 1.000, antoine: { A: 8.07131, B: 1730.63, C: 233.426 } }
        ]
    },
    airLiquefaction: {
        id: 'airLiquefaction',
        name: 'Ar Liquefeito',
        totalVolume: 100,
        components: [
            { id: 'nitrogen', name: 'Nitrogênio', formula: 'N₂', boilingPoint: -195.8, color: '#e6f3ff', volumeFraction: 0.78, isCollected: false, collectedVolume: 0, molarMass: 28.01, density: 0.808, antoine: { A: 6.62198, B: 255.68, C: 266.55 } },
            { id: 'argon', name: 'Argônio', formula: 'Ar', boilingPoint: -185.8, color: '#e0e0e0', volumeFraction: 0.01, isCollected: false, collectedVolume: 0, molarMass: 39.95, density: 1.395, antoine: { A: 6.75841, B: 304.22, C: 267.57 } },
            { id: 'oxygen', name: 'Oxigênio', formula: 'O₂', boilingPoint: -183.0, color: '#cce6ff', volumeFraction: 0.21, isCollected: false, collectedVolume: 0, molarMass: 32.00, density: 1.141, antoine: { A: 6.65215, B: 316.20, C: 266.70 } }
        ]
    }
}
// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calcula a Pressão de Vapor de um componente puro a uma dada temperatura (°C) usando a Equação de Antoine
 * Retorna P em mmHg
 */
export function calculateVaporPressure(component: DistillableComponent, temperature: number): number {
    const { A, B, C } = component.antoine
    // Antoine: log10(P) = A - B/(T+C)
    // Cuidado com temperaturas extremas e assíntotas (T + C = 0)
    if (temperature + C <= 0.1) return 0
    const logP = A - (B / (temperature + C))
    return Math.pow(10, logP)
}

/**
 * Calcula o número de mols de um componente no líquido atual
 */
function getMoles(component: DistillableComponent, mixtureTotalVolume: number): number {
    const initialVolume = component.volumeFraction * mixtureTotalVolume
    const currentVolume = Math.max(0, initialVolume - component.collectedVolume)
    const mass = currentVolume * component.density
    return mass / component.molarMass
}

/**
 * Determina qual componente está evaporando baseado na Lei de Raoult
 */
export function getCurrentEvaporatingComponent(
    mixture: DistillationMixture,
    temperature: number
): DistillableComponent | null {
    // Calcular mols totais e frações molares (xi)
    let totalMoles = 0
    const molesMap = new Map<string, number>()
    
    for (const comp of mixture.components) {
        if (comp.isCollected) continue
        const n = getMoles(comp, mixture.totalVolume)
        molesMap.set(comp.id, n)
        totalMoles += n
    }
    
    if (totalMoles === 0) return null

    // Calcular pressão parcial de cada componente (Pi = xi * P*)
    let totalVaporPressure = 0
    let dominantComponent = null
    let maxPartialPressure = 0

    for (const comp of mixture.components) {
        if (comp.isCollected) continue
        const xi = (molesMap.get(comp.id) || 0) / totalMoles
        if (xi <= 0) continue
        
        const vaporPressurePure = calculateVaporPressure(comp, temperature)
        const partialPressure = xi * vaporPressurePure
        
        totalVaporPressure += partialPressure
        
        if (partialPressure > maxPartialPressure) {
            maxPartialPressure = partialPressure
            dominantComponent = comp
        }
    }

    // Se a pressão total de vapor for >= 760 mmHg (1 atm), a mistura está fervendo
    if (totalVaporPressure >= 740) { // Margem de erro
        return dominantComponent
    }
    
    // Evaporação passiva mesmo sem ferver (se P_parcial for muito alta)
    if (maxPartialPressure > 100) {
        return dominantComponent
    }

    return null
}

/**
 * Calcula a taxa de evaporação usando pressões parciais
 */
export function calculateEvaporationRate(
    temperature: number,
    component: DistillableComponent,
    mixture: DistillationMixture,
    heatingPower: number = 1
): number {
    let totalMoles = 0
    const n = getMoles(component, mixture.totalVolume)
    for (const comp of mixture.components) {
        if (!comp.isCollected) totalMoles += getMoles(comp, mixture.totalVolume)
    }
    
    if (totalMoles === 0 || n === 0) return 0
    
    const xi = n / totalMoles
    const vaporPressurePure = calculateVaporPressure(component, temperature)
    const partialPressure = xi * vaporPressurePure
    
    // Se P_total >= 760 (Fervendo), evapora na taxa do heatingPower
    // Se P_total < 760, evapora devagar dependendo de P_parcial
    
    let totalVaporPressure = 0
    for (const comp of mixture.components) {
        if (!comp.isCollected) {
            const c_xi = getMoles(comp, mixture.totalVolume) / totalMoles
            totalVaporPressure += c_xi * calculateVaporPressure(comp, temperature)
        }
    }

    if (totalVaporPressure >= 760) {
        // Ebulição
        // A proporção da evaporação é relativa à fração na fase vapor (yi)
        // yi = Pi / P_total
        const yi = partialPressure / totalVaporPressure
        return 1.5 * heatingPower * yi
    } else {
        // Evaporação superficial
        return (partialPressure / 760) * 0.2 * heatingPower
    }
}

/**
 * Calcula a temperatura de condensação efetiva
 */
export function calculateCondensationTemperature(
    vaporTemperature: number,
    coolingWaterTemperature: number = 15
): number {
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
    return condenserTemperature < vaporTemperature - 10
}

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
        const evapRate = calculateEvaporationRate(newState.temperature, evaporatingComponent, state.mixture, 1)
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
