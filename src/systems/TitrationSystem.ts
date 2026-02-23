// src/systems/TitrationSystem.ts
// Sistema de titulação com cálculos de pH em tempo real

import { ALL_SUBSTANCES } from './ChemistryEngine'

export interface TitrationState {
    titrantFormula: string      // Substância na bureta (ex: NaOH)
    analyteFormula: string      // Substância no béquer (ex: HCl)
    titrantMols: number         // Mols do titulante
    analyteMols: number         // Mols do analito
    totalVolume: number         // Volume total em mL
    currentPH: number           // pH atual da solução
    equivalencePoint: number    // Volume no ponto de equivalência (mL)
    isComplete: boolean         // Se chegou ao ponto final
    dataPoints: Array<{ volume: number; ph: number }>  // Dados para o gráfico
}

export interface TitrationResult {
    newPH: number
    reactionOccurred: boolean
    description: string
    isEquivalencePoint: boolean
    percentComplete: number
}

/**
 * Calcula o pH durante uma titulação ácido-base
 */
export function calculateTitrationPH(
    titrantFormula: string,
    analyteFormula: string,
    titrantMols: number,
    analyteMols: number,
    volumeML: number
): number {
    const titrant = ALL_SUBSTANCES[titrantFormula]
    const analyte = ALL_SUBSTANCES[analyteFormula]

    if (!titrant || !analyte) return 7

    const titrantIsAcid = titrant.category === 'acid'
    const analyteIsAcid = analyte.category === 'acid'

    // Titulação inválida se ambos são ácidos ou bases
    if (titrantIsAcid === analyteIsAcid) return 7

    // Determinando qual é ácido e qual é base
    const acidMols = titrantIsAcid ? titrantMols : analyteMols
    const baseMols = titrantIsAcid ? analyteMols : titrantMols

    // Volume em litros
    const volumeL = volumeML / 1000

    // Diferença de mols (excesso)
    const excessMols = acidMols - baseMols

    if (Math.abs(excessMols) < 0.0001) {
        // Ponto de equivalência - sal neutro (simplificado)
        return 7
    } else if (excessMols > 0) {
        // Excesso de ácido
        const H_concentration = excessMols / volumeL
        const pH = -Math.log10(Math.max(H_concentration, 1e-14))
        return Math.max(0, Math.min(14, pH))
    } else {
        // Excesso de base
        const OH_concentration = Math.abs(excessMols) / volumeL
        const pOH = -Math.log10(Math.max(OH_concentration, 1e-14))
        const pH = 14 - pOH
        return Math.max(0, Math.min(14, pH))
    }
}

/**
 * Processa uma gota de titulante sendo adicionada
 */
export function addTitrantDrop(
    state: TitrationState,
    dropVolumeMicroliter: number = 50
): TitrationResult {
    const dropVolumeML = dropVolumeMicroliter / 1000
    const titrant = ALL_SUBSTANCES[state.titrantFormula]

    if (!titrant) {
        return {
            newPH: state.currentPH,
            reactionOccurred: false,
            description: 'Titulante não encontrado',
            isEquivalencePoint: false,
            percentComplete: 0
        }
    }

    // Calcular mols adicionados (assumindo 1M de concentração)
    const molsAdded = dropVolumeML / 1000 // 1M = 1 mol/L

    const newTitrantMols = state.titrantMols + molsAdded
    const newVolume = state.totalVolume + dropVolumeML

    // Calcular novo pH
    const newPH = calculateTitrationPH(
        state.titrantFormula,
        state.analyteFormula,
        newTitrantMols,
        state.analyteMols,
        newVolume
    )

    // Verificar se é ponto de equivalência
    const isEquivalencePoint = Math.abs(newTitrantMols - state.analyteMols) < 0.0001

    // Calcular percentual completo
    const percentComplete = state.analyteMols > 0
        ? Math.min(100, (newTitrantMols / state.analyteMols) * 100)
        : 0

    // Descrição da mudança
    let description = ''
    if (isEquivalencePoint) {
        description = '🎯 PONTO DE EQUIVALÊNCIA! Neutralização completa!'
    } else if (newPH < state.currentPH) {
        description = `📉 pH diminuindo: ${state.currentPH.toFixed(2)} → ${newPH.toFixed(2)}`
    } else if (newPH > state.currentPH) {
        description = `📈 pH aumentando: ${state.currentPH.toFixed(2)} → ${newPH.toFixed(2)}`
    } else {
        description = `💧 Gota adicionada (${dropVolumeMicroliter}μL)`
    }

    return {
        newPH,
        reactionOccurred: true,
        description,
        isEquivalencePoint,
        percentComplete
    }
}

/**
 * Determina a cor do indicador baseado no pH
 */
export function getIndicatorColor(indicator: string, pH: number): string {
    switch (indicator) {
        case 'phenolphthalein':
            // Incolor < 8.2, rosa/magenta > 10
            if (pH < 8.2) return 'transparent'
            if (pH < 10) return `rgba(255, 20, 147, ${(pH - 8.2) / 1.8})`
            return '#ff1493'

        case 'methyl_orange':
            // Vermelho < 3.1, laranja 3.1-4.4, amarelo > 4.4
            if (pH < 3.1) return '#ff0000'
            if (pH < 4.4) return '#ff8c00'
            return '#ffd700'

        case 'bromothymol_blue':
            // Amarelo < 6, verde 6-7.6, azul > 7.6
            if (pH < 6) return '#ffff00'
            if (pH < 7.6) return '#00ff00'
            return '#0000ff'

        case 'litmus':
            // Vermelho < 5, púrpura 5-8, azul > 8
            if (pH < 5) return '#ff0000'
            if (pH < 8) return '#800080'
            return '#0000ff'

        case 'universal':
            // Gradiente completo de cores
            if (pH < 2) return '#ff0000'
            if (pH < 4) return '#ff6600'
            if (pH < 6) return '#ffff00'
            if (pH < 8) return '#00ff00'
            if (pH < 10) return '#00ffff'
            if (pH < 12) return '#0000ff'
            return '#800080'

        default:
            return 'transparent'
    }
}

/**
 * Cria estado inicial de titulação
 */
export function createTitrationState(
    titrantFormula: string,
    analyteFormula: string,
    analyteMols: number,
    analyteVolumeML: number
): TitrationState {
    const analyte = ALL_SUBSTANCES[analyteFormula]
    const initialPH = analyte?.ph ?? 7

    return {
        titrantFormula,
        analyteFormula,
        titrantMols: 0,
        analyteMols,
        totalVolume: analyteVolumeML,
        currentPH: initialPH,
        equivalencePoint: analyteMols * 1000, // Volume em mL para 1M
        isComplete: false,
        dataPoints: [{ volume: 0, ph: initialPH }]
    }
}
