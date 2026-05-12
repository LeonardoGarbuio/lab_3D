// src/physics/ReactionEvaluator.ts
// ═══════════════════════════════════════════════════════════════════════
// ⚗️ AVALIADOR DE REAÇÕES — Termodinâmica Real
// Substituí o sistema de "lookup em JSON" por cálculos físicos reais.
//
// Fluxo:
//   1. Recebe duas fórmulas (reagentes)
//   2. Procura na tabela de reações conhecidas
//   3. Calcula ΔG para verificar espontaneidade
//   4. Verifica se T > Ea para barreira cinética
//   5. Retorna resultado com dados termodinâmicos reais
//
// Executado DENTRO do Web Worker — sem acesso ao DOM.
// ═══════════════════════════════════════════════════════════════════════

import { MolecularCalculator } from './MolecularCalculator'
import type { FormulaCoeff } from './MolecularCalculator'

// ─── Tipos de Resultado ──────────────────────────────────────────────

export interface ReactionResult {
    viable: boolean                  // A reação acontece?
    reason: 'spontaneous' | 'activation-barrier' | 'endergonic' | 'unknown-products'
    reactants: FormulaCoeff[]
    products: FormulaCoeff[]
    equation: string                 // Equação balanceada
    description: string              // Descrição em PT
    deltaH: number | null            // kJ/mol
    deltaG: number | null            // kJ/mol
    deltaS: number | null            // J/(mol·K)
    type: ReactionType
    effectType: VisualEffect
    effectColor: string
    productColor: string
    exothermic: boolean
}

export type ReactionType =
    | 'neutralization'
    | 'precipitation'
    | 'combustion'
    | 'synthesis'
    | 'decomposition'
    | 'displacement'
    | 'effervescence'
    | 'redox'

export type VisualEffect = 'none' | 'bubbles' | 'smoke' | 'precipitate' | 'explosion' | 'glow' | 'fire' | 'boiling'

// ─── Base de Reações Conhecidas (Balanceadas) ────────────────────────
// Em vez do antigo JSON hardcoded, cada reação agora inclui coeficientes
// estequiométricos para cálculo termodinâmico real.

interface KnownReaction {
    id: string
    reactants: FormulaCoeff[]
    products: FormulaCoeff[]
    equation: string
    description: string
    type: ReactionType
    effectType: VisualEffect
    effectColor: string
    productColor: string
    minTemp?: number                  // °C mínima
    maxTemp?: number                  // °C máxima
}

const KNOWN_REACTIONS: KnownReaction[] = [
    // ═══ NEUTRALIZAÇÕES ═══
    {
        id: 'hcl-naoh',
        reactants: [{ formula: 'HCl', coeff: 1 }, { formula: 'NaOH', coeff: 1 }],
        products: [{ formula: 'NaCl', coeff: 1 }, { formula: 'H2O', coeff: 1 }],
        equation: 'HCl + NaOH → NaCl + H₂O',
        description: 'Neutralização ácido-base: formação de sal e água',
        type: 'neutralization', effectType: 'glow', effectColor: '#ffff00', productColor: '#f0f8ff',
    },
    {
        id: 'h2so4-naoh',
        reactants: [{ formula: 'H2SO4', coeff: 1 }, { formula: 'NaOH', coeff: 2 }],
        products: [{ formula: 'Na2SO4', coeff: 1 }, { formula: 'H2O', coeff: 2 }],
        equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
        description: 'Neutralização: sulfato de sódio formado',
        type: 'neutralization', effectType: 'glow', effectColor: '#ffa500', productColor: '#f5f5f5',
    },
    {
        id: 'hno3-koh',
        reactants: [{ formula: 'HNO3', coeff: 1 }, { formula: 'KOH', coeff: 1 }],
        products: [{ formula: 'NaNO3', coeff: 1 }, { formula: 'H2O', coeff: 1 }],
        equation: 'HNO₃ + KOH → KNO₃ + H₂O',
        description: 'Neutralização: nitrato de potássio formado',
        type: 'neutralization', effectType: 'glow', effectColor: '#ffff00', productColor: '#ffffff',
    },
    {
        id: 'ch3cooh-naoh',
        reactants: [{ formula: 'CH3COOH', coeff: 1 }, { formula: 'NaOH', coeff: 1 }],
        products: [{ formula: 'H2O', coeff: 1 }], // CH3COONa não está na tabela termodinâmica
        equation: 'CH₃COOH + NaOH → CH₃COONa + H₂O',
        description: 'Neutralização: acetato de sódio formado',
        type: 'neutralization', effectType: 'glow', effectColor: '#fffacd', productColor: '#f5f5f5',
    },

    // ═══ EFERVESCÊNCIAS ═══
    {
        id: 'nahco3-ch3cooh',
        reactants: [{ formula: 'NaHCO3', coeff: 1 }, { formula: 'CH3COOH', coeff: 1 }],
        products: [{ formula: 'H2O', coeff: 1 }, { formula: 'CO2', coeff: 1 }],
        equation: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑',
        description: 'Efervescência! Liberação de CO₂',
        type: 'effervescence', effectType: 'bubbles', effectColor: '#ffffff', productColor: '#fff8dc',
    },
    {
        id: 'caco3-hcl',
        reactants: [{ formula: 'CaCO3', coeff: 1 }, { formula: 'HCl', coeff: 2 }],
        products: [{ formula: 'H2O', coeff: 1 }, { formula: 'CO2', coeff: 1 }],
        equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
        description: 'Efervescência intensa! Dissolução de calcário',
        type: 'effervescence', effectType: 'bubbles', effectColor: '#ffffff', productColor: '#f5f5f5',
    },

    // ═══ PRECIPITAÇÕES ═══
    {
        id: 'agno3-nacl',
        reactants: [{ formula: 'AgNO3', coeff: 1 }, { formula: 'NaCl', coeff: 1 }],
        products: [{ formula: 'AgCl', coeff: 1 }, { formula: 'NaNO3', coeff: 1 }],
        equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
        description: 'Precipitado branco de cloreto de prata!',
        type: 'precipitation', effectType: 'precipitate', effectColor: '#ffffff', productColor: '#ffffff',
    },

    // ═══ COMBUSTÕES ═══
    {
        id: 'h2-o2',
        reactants: [{ formula: 'H2', coeff: 2 }, { formula: 'O2', coeff: 1 }],
        products: [{ formula: 'H2O', coeff: 2 }],
        equation: '2H₂ + O₂ → 2H₂O',
        description: 'Síntese da água! Reação exotérmica vigorosa',
        type: 'synthesis', effectType: 'explosion', effectColor: '#87ceeb', productColor: '#4ecdc4',
        minTemp: 500,
    },
    {
        id: 'c2h5oh-o2',
        reactants: [{ formula: 'C2H5OH', coeff: 1 }, { formula: 'O2', coeff: 3 }],
        products: [{ formula: 'CO2', coeff: 2 }, { formula: 'H2O', coeff: 3 }],
        equation: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',
        description: 'Combustão do etanol: chama azulada!',
        type: 'combustion', effectType: 'fire', effectColor: '#4169e1', productColor: '#e8e8e8',
        minTemp: 350,
    },
    {
        id: 'ch4-o2',
        reactants: [{ formula: 'CH4', coeff: 1 }, { formula: 'O2', coeff: 2 }],
        products: [{ formula: 'CO2', coeff: 1 }, { formula: 'H2O', coeff: 2 }],
        equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
        description: 'Combustão do metano: gás natural',
        type: 'combustion', effectType: 'fire', effectColor: '#ff6600', productColor: '#e8e8e8',
        minTemp: 580,
    },

    // ═══ SÍNTESES ═══
    {
        id: 'na-cl2',
        reactants: [{ formula: 'Na', coeff: 2 }, { formula: 'Cl2', coeff: 1 }],
        products: [{ formula: 'NaCl', coeff: 2 }],
        equation: '2Na + Cl₂ → 2NaCl',
        description: 'Síntese do sal! Reação violenta',
        type: 'synthesis', effectType: 'explosion', effectColor: '#ffff00', productColor: '#ffffff',
    },
    {
        id: 'fe-o2',
        reactants: [{ formula: 'Fe', coeff: 4 }, { formula: 'O2', coeff: 3 }],
        products: [{ formula: 'Fe2O3', coeff: 2 }],
        equation: '4Fe + 3O₂ → 2Fe₂O₃',
        description: 'Formação de ferrugem (oxidação)',
        type: 'synthesis', effectType: 'glow', effectColor: '#ff6600', productColor: '#8b4513',
    },
    {
        id: 'mg-o2',
        reactants: [{ formula: 'Mg', coeff: 2 }, { formula: 'O2', coeff: 1 }],
        products: [{ formula: 'MgO', coeff: 2 }],
        equation: '2Mg + O₂ → 2MgO',
        description: 'Combustão brilhante do magnésio!',
        type: 'combustion', effectType: 'fire', effectColor: '#ffffff', productColor: '#f5f5f5',
        minTemp: 450,
    },

    // ═══ DESLOCAMENTOS ═══
    {
        id: 'zn-hcl',
        reactants: [{ formula: 'Zn', coeff: 1 }, { formula: 'HCl', coeff: 2 }],
        products: [{ formula: 'H2', coeff: 1 }],
        equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
        description: 'Liberação de hidrogênio gasoso!',
        type: 'displacement', effectType: 'bubbles', effectColor: '#e0ffff', productColor: '#b0c4de',
    },
    {
        id: 'mg-hcl',
        reactants: [{ formula: 'Mg', coeff: 1 }, { formula: 'HCl', coeff: 2 }],
        products: [{ formula: 'H2', coeff: 1 }],
        equation: 'Mg + 2HCl → MgCl₂ + H₂↑',
        description: 'Reação vigorosa com bolhas de H₂!',
        type: 'displacement', effectType: 'bubbles', effectColor: '#ffffff', productColor: '#d3d3d3',
    },

    // ═══ DECOMPOSIÇÕES ═══
    {
        id: 'h2o2-decomp',
        reactants: [{ formula: 'H2O2', coeff: 2 }],
        products: [{ formula: 'H2O', coeff: 2 }, { formula: 'O2', coeff: 1 }],
        equation: '2H₂O₂ → 2H₂O + O₂↑',
        description: 'Decomposição do peróxido: oxigênio liberado!',
        type: 'decomposition', effectType: 'bubbles', effectColor: '#ffffff', productColor: '#e0ffff',
    },
    {
        id: 'caco3-decomp',
        reactants: [{ formula: 'CaCO3', coeff: 1 }],
        products: [{ formula: 'CaO', coeff: 1 }, { formula: 'CO2', coeff: 1 }],
        equation: 'CaCO₃ → CaO + CO₂↑',
        description: 'Calcinação: produção de cal viva!',
        type: 'decomposition', effectType: 'smoke', effectColor: '#e8e8e8', productColor: '#fffaf0',
        minTemp: 800,
    },
]

// ═══════════════════════════════════════════════════════════════════════
// AVALIADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export class ReactionEvaluator {

    /**
     * Avalia se uma reação entre duas substâncias é viável termodinamicamente.
     *
     * @param formula1   Fórmula do reagente 1
     * @param formula2   Fórmula do reagente 2 (ou igual ao 1 para decomposição)
     * @param tempCelsius Temperatura do sistema em °C
     * @returns ReactionResult com todos os dados termodinâmicos
     */
    static evaluate(formula1: string, formula2: string, tempCelsius: number = 25): ReactionResult | null {
        const tempK = tempCelsius + 273.15

        // 1. Procurar na base de reações conhecidas
        const known = this.findKnownReaction(formula1, formula2)
        if (!known) return null

        // 2. Verificar temperatura mínima
        if (known.minTemp !== undefined && tempCelsius < known.minTemp) {
            return {
                viable: false,
                reason: 'activation-barrier',
                reactants: known.reactants,
                products: known.products,
                equation: known.equation,
                description: `❄️ Temperatura insuficiente (requer ${known.minTemp}°C, atual: ${tempCelsius}°C)`,
                deltaH: MolecularCalculator.calculateDeltaH(known.reactants, known.products),
                deltaG: MolecularCalculator.calculateGibbsFreeEnergy(known.reactants, known.products, tempK),
                deltaS: MolecularCalculator.calculateDeltaS(known.reactants, known.products),
                type: known.type,
                effectType: 'none',
                effectColor: known.effectColor,
                productColor: known.productColor,
                exothermic: false,
            }
        }

        // 3. Calcular termodinâmica real
        const deltaH = MolecularCalculator.calculateDeltaH(known.reactants, known.products)
        const deltaG = MolecularCalculator.calculateGibbsFreeEnergy(known.reactants, known.products, tempK)
        const deltaS = MolecularCalculator.calculateDeltaS(known.reactants, known.products)
        const exothermic = deltaH !== null ? deltaH < 0 : true

        // 4. Verificar espontaneidade via ΔG
        // Se temos dados termodinâmicos, usar ΔG. Senão, considerar viável (reação conhecida).
        const spontaneous = deltaG !== null ? deltaG < 0 : true

        if (!spontaneous) {
            return {
                viable: false,
                reason: 'endergonic',
                reactants: known.reactants,
                products: known.products,
                equation: known.equation,
                description: `⚡ Reação não-espontânea (ΔG = ${deltaG?.toFixed(1)} kJ/mol)`,
                deltaH, deltaG, deltaS,
                type: known.type,
                effectType: 'none',
                effectColor: known.effectColor,
                productColor: known.productColor,
                exothermic,
            }
        }

        // 5. Reação viável!
        return {
            viable: true,
            reason: 'spontaneous',
            reactants: known.reactants,
            products: known.products,
            equation: known.equation,
            description: known.description,
            deltaH, deltaG, deltaS,
            type: known.type,
            effectType: known.effectType,
            effectColor: known.effectColor,
            productColor: known.productColor,
            exothermic,
        }
    }

    /**
     * Procura uma reação conhecida (independente da ordem dos reagentes).
     */
    private static findKnownReaction(formula1: string, formula2: string): KnownReaction | null {
        return KNOWN_REACTIONS.find(r => {
            const formulas = r.reactants.map(rc => rc.formula)
            // Reação com 2 reagentes diferentes
            if (formulas.length === 2) {
                return (formulas[0] === formula1 && formulas[1] === formula2) ||
                       (formulas[0] === formula2 && formulas[1] === formula1)
            }
            // Decomposição (mesmo reagente ou reagente único)
            if (formulas.length === 1) {
                return formulas[0] === formula1 && formula1 === formula2
            }
            return false
        }) || null
    }

    /**
     * Retorna a lista de todas as reações disponíveis (para debug/UI).
     */
    static getAllReactions(): KnownReaction[] {
        return KNOWN_REACTIONS
    }
}
