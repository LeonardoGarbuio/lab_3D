// src/systems/HazardDetection.ts
// Sistema de detecção de perigos químicos

import type { Substance } from './ChemistryEngine'

export interface HazardEvent {
    type: 'explosion' | 'corrosion' | 'fire' | 'gas-release' | 'violent-reaction'
    severity: number // 0-10
    position: [number, number, number]
    substances: string[]
    description: string
    effectColor?: string
}

/**
 * Detecta perigos ao misturar duas substâncias
 */
export function detectHazard(
    substance1: Substance,
    substance2: Substance,
    temperature: number
): HazardEvent | null {

    // 1. DETECÇÃO DE EXPLOSÕES
    if (isExplosiveMixture(substance1, substance2, temperature)) {
        const power = calculateExplosionPower(substance1, substance2, temperature)
        return {
            type: 'explosion',
            severity: power,
            position: [0, 0, 0], // Será definido pelo caller
            substances: [substance1.formula, substance2.formula],
            description: `EXPLOSÃO! ${substance1.name} + ${substance2.name}`,
            effectColor: '#ff6600'
        }
    }

    // 2. DETECÇÃO DE REAÇÕES VIOLENTAS
    if (isViolentReaction(substance1, substance2)) {
        return {
            type: 'violent-reaction',
            severity: 6,
            position: [0, 0, 0],
            substances: [substance1.formula, substance2.formula],
            description: `Reação violenta! ${substance1.name} + ${substance2.name}`,
            effectColor: '#ffa500'
        }
    }

    // 3. DETECÇÃO DE INCOMPATIBILIDADES
    if (areIncompatible(substance1, substance2)) {
        return {
            type: 'gas-release',
            severity: 5,
            position: [0, 0, 0],
            substances: [substance1.formula, substance2.formula],
            description: `⚠️ Incompatibilidade química detectada!`,
            effectColor: '#ffff00'
        }
    }

    return null
}

/**
 * Verifica se a mistura é explosiva
 */
function isExplosiveMixture(
    sub1: Substance,
    sub2: Substance,
    temperature: number
): boolean {
    // H2 + O2 em alta temperatura
    if ((sub1.formula === 'H2' && sub2.formula === 'O2') ||
        (sub1.formula === 'O2' && sub2.formula === 'H2')) {
        return temperature > 400 // Acima de 400°C explode
    }

    // Ácido concentrado + água rapidamente (inverso)
    if (sub1.formula === 'H2O' && sub2.formula === 'H2SO4') {
        return true // Nunca adicione água ao ácido!
    }

    // Oxidante + inflamável
    if ((sub1.isOxidizer && sub2.isFlammable) ||
        (sub2.isOxidizer && sub1.isFlammable)) {
        return temperature > 100
    }

    return false
}

/**
 * Calcula o poder da explosão
 */
function calculateExplosionPower(
    sub1: Substance,
    sub2: Substance,
    temperature: number
): number {
    let power = 5 // Base

    // Aumenta com temperatura
    if (temperature > 500) power += 2
    if (temperature > 1000) power += 2

    // Aumenta se ambos são reativos
    if (sub1.isExplosive || sub2.isExplosive) power += 2
    if (sub1.isOxidizer || sub2.isOxidizer) power += 1

    return Math.min(10, power)
}

/**
 * Verifica reação violenta (não explosiva, mas perigosa)
 */
function isViolentReaction(sub1: Substance, sub2: Substance): boolean {
    // Ácido + base concentrados
    if ((sub1.category === 'acid' && sub2.category === 'base') ||
        (sub1.category === 'base' && sub2.category === 'acid')) {
        if ((sub1.ph !== undefined && sub1.ph < 2) ||
            (sub2.ph !== undefined && sub2.ph > 12)) {
            return true
        }
    }

    // Metais reativos + ácidos
    if ((sub1.category === 'metal' && sub2.category === 'acid') ||
        (sub1.category === 'acid' && sub2.category === 'metal')) {
        return true
    }

    return false
}

/**
 * Verifica incompatibilidades químicas
 */
function areIncompatible(sub1: Substance, sub2: Substance): boolean {
    if (sub1.incompatibleWith?.includes(sub2.formula)) return true
    if (sub2.incompatibleWith?.includes(sub1.formula)) return true

    // Verificar categorias incompatíveis
    if (sub1.incompatibleWith?.includes('organics') && sub2.category === 'organic') return true
    if (sub2.incompatibleWith?.includes('organics') && sub1.category === 'organic') return true

    if (sub1.incompatibleWith?.includes('metals') && sub2.category === 'metal') return true
    if (sub2.incompatibleWith?.includes('metals') && sub1.category === 'metal') return true

    return false
}

/**
 * Verifica se substância é corrosiva
 */
export function isCorrosive(substance: Substance): boolean {
    return substance.isCorrosive === true
}

/**
 * Retorna a força de corrosão (0-10)
 */
export function getCorrosionStrength(substance: Substance): number {
    return substance.corrosionStrength || 0
}
