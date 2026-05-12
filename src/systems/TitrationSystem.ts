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

    const acidMols = titrantIsAcid ? titrantMols : analyteMols
    const baseMols = titrantIsAcid ? analyteMols : titrantMols
    
    const acid = titrantIsAcid ? titrant : analyte
    const base = titrantIsAcid ? analyte : titrant

    const volumeL = volumeML / 1000

    // Henderson-Hasselbalch para Ácido Fraco + Base Forte
    if (acid.pKa && !base.pKb) {
        if (baseMols === 0) {
            // Apenas ácido fraco: [H+] = sqrt(Ka * Ca)
            const Ka = Math.pow(10, -acid.pKa)
            const Ca = acidMols / volumeL
            return -Math.log10(Math.max(Math.sqrt(Ka * Ca), 1e-14))
        } else if (baseMols < acidMols) {
            // Região Tampão: pH = pKa + log([A-]/[HA])
            const aMinus = baseMols
            const ha = acidMols - baseMols
            return acid.pKa + Math.log10(aMinus / ha)
        } else if (baseMols === acidMols) {
            // Ponto de equivalência (Hidrólise do sal básico)
            // pOH = 1/2(pKw - pKa - log(C_sal))
            const cSal = acidMols / volumeL
            const pOH = 0.5 * (14 - acid.pKa - Math.log10(cSal))
            return 14 - pOH
        } else {
            // Excesso de base forte
            const excessOH = (baseMols - acidMols) / volumeL
            return 14 + Math.log10(Math.max(excessOH, 1e-14))
        }
    }

    // Henderson-Hasselbalch para Base Fraca + Ácido Forte
    if (base.pKb && !acid.pKa) {
        if (acidMols === 0) {
            // Apenas base fraca: [OH-] = sqrt(Kb * Cb)
            const Kb = Math.pow(10, -base.pKb)
            const Cb = baseMols / volumeL
            const pOH = -Math.log10(Math.max(Math.sqrt(Kb * Cb), 1e-14))
            return 14 - pOH
        } else if (acidMols < baseMols) {
            // Região Tampão: pOH = pKb + log([BH+]/[B])
            const bhPlus = acidMols
            const b = baseMols - acidMols
            const pOH = base.pKb + Math.log10(bhPlus / b)
            return 14 - pOH
        } else if (acidMols === baseMols) {
            // Ponto de equivalência (Hidrólise do sal ácido)
            // pH = 1/2(pKw - pKb - log(C_sal))
            const cSal = baseMols / volumeL
            return 0.5 * (14 - base.pKb - Math.log10(cSal))
        } else {
            // Excesso de ácido forte
            const excessH = (acidMols - baseMols) / volumeL
            return -Math.log10(Math.max(excessH, 1e-14))
        }
    }

    // Titulação Forte-Forte (Padrão)
    const excessMols = acidMols - baseMols
    if (Math.abs(excessMols) < 0.0001) {
        return 7 // Sal neutro
    } else if (excessMols > 0) {
        const H_concentration = excessMols / volumeL
        const pH = -Math.log10(Math.max(H_concentration, 1e-14))
        return Math.max(0, Math.min(14, pH))
    } else {
        const OH_concentration = Math.abs(excessMols) / volumeL
        const pOH = -Math.log10(Math.max(OH_concentration, 1e-14))
        return Math.max(0, Math.min(14, 14 - pOH))
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
 * Determina a cor do indicador baseado no pH.
 * Usa os dados de colorTransition das substâncias quando disponíveis,
 * com interpolação suave na zona de viragem.
 */
export function getIndicatorColor(indicator: string, pH: number): string {
    const substance = ALL_SUBSTANCES[indicator]

    // Se a substância tem colorTransition definido, usar dados dinâmicos
    if (substance?.colorTransition) {
        const { phRange, acidColor, baseColor } = substance.colorTransition
        const [phLow, phHigh] = phRange

        if (pH < phLow) return acidColor
        if (pH > phHigh) return baseColor

        // Interpolação linear na zona de viragem
        const t = (pH - phLow) / (phHigh - phLow)
        return interpolateColor(acidColor, baseColor, t)
    }

    // Fallback para indicadores sem colorTransition definidos na DB
    switch (indicator) {
        case 'bromothymol_blue':
            if (pH < 6) return '#ffff00'
            if (pH < 7.6) return '#00ff00'
            return '#0000ff'

        case 'universal':
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
 * Interpola linearmente entre duas cores hex.
 */
function interpolateColor(c1: string, c2: string, t: number): string {
    if (c1 === 'transparent') {
        // Fade-in da cor c2
        const r2 = parseInt(c2.slice(1, 3), 16)
        const g2 = parseInt(c2.slice(3, 5), 16)
        const b2 = parseInt(c2.slice(5, 7), 16)
        return `rgba(${r2}, ${g2}, ${b2}, ${t.toFixed(2)})`
    }
    const r1 = parseInt(c1.slice(1, 3), 16)
    const g1 = parseInt(c1.slice(3, 5), 16)
    const b1 = parseInt(c1.slice(5, 7), 16)
    const r2 = parseInt(c2.slice(1, 3), 16)
    const g2 = parseInt(c2.slice(3, 5), 16)
    const b2 = parseInt(c2.slice(5, 7), 16)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `rgb(${r}, ${g}, ${b})`
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
