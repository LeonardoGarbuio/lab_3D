// src/constants/substances.ts
import type { Substance } from '../types/chemistry.types'

/**
 * Catálogo de substâncias químicas disponíveis no laboratório
 */
export const SUBSTANCES: Record<string, Substance> = {
    water: {
        id: 'water',
        name: 'Água',
        formula: 'H₂O',
        color: '#4a90d9',
        opacity: 0.6,
        density: 1000,
        viscosity: 0.001,
        boilingPoint: 100,
        freezingPoint: 0,
    },

    hydrochloricAcid: {
        id: 'hydrochloricAcid',
        name: 'Ácido Clorídrico',
        formula: 'HCl',
        color: '#e8e8a8',
        opacity: 0.7,
        density: 1180,
        viscosity: 0.002,
        reactsWith: ['sodiumHydroxide', 'sodium', 'zinc'],
        isToxic: true,
    },

    sodiumHydroxide: {
        id: 'sodiumHydroxide',
        name: 'Hidróxido de Sódio',
        formula: 'NaOH',
        color: '#f0f0f0',
        opacity: 0.5,
        density: 2130,
        viscosity: 0.004,
        reactsWith: ['hydrochloricAcid'],
        isToxic: true,
    },

    copperSulfate: {
        id: 'copperSulfate',
        name: 'Sulfato de Cobre',
        formula: 'CuSO₄',
        color: '#1e90ff',
        opacity: 0.8,
        density: 3600,
        viscosity: 0.003,
    },

    phenolphthalein: {
        id: 'phenolphthalein',
        name: 'Fenolftaleína',
        formula: 'C₂₀H₁₄O₄',
        color: '#ff69b4',
        opacity: 0.9,
        density: 1300,
        viscosity: 0.002,
    },

    ethanol: {
        id: 'ethanol',
        name: 'Etanol',
        formula: 'C₂H₅OH',
        color: '#f5f5dc',
        opacity: 0.4,
        density: 789,
        viscosity: 0.0012,
        boilingPoint: 78.37,
        isFlammable: true,
    },
}

/**
 * Função auxiliar para obter substância por ID
 */
export function getSubstance(id: string): Substance | undefined {
    return SUBSTANCES[id]
}
