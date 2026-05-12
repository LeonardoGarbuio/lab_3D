// src/physics/MolecularCalculator.ts
// ═══════════════════════════════════════════════════════════════════════
// 🧠 CALCULADORA MOLECULAR — Base de dados e regras da química
// Classe estática com a Tabela Periódica mínima necessária para o lab,
// funções de polaridade, classificação de ligações e conversões mol/massa.
// ═══════════════════════════════════════════════════════════════════════

export interface ElementData {
    symbol: string
    name: string
    atomicNumber: number
    atomicMass: number        // g/mol
    electronegativity: number // escala de Pauling
    valenceElectrons: number  // elétrons da camada de valência
    color: string             // cor de renderização (hex)
}

/**
 * Tabela Periódica mínima — somente os elementos usados no lab
 */
const PERIODIC_TABLE: Record<string, ElementData> = {
    H:  { symbol: 'H',  name: 'Hidrogênio', atomicNumber: 1,  atomicMass: 1.008,  electronegativity: 2.20, valenceElectrons: 1, color: '#ffffff' },
    C:  { symbol: 'C',  name: 'Carbono',    atomicNumber: 6,  atomicMass: 12.011, electronegativity: 2.55, valenceElectrons: 4, color: '#909090' },
    N:  { symbol: 'N',  name: 'Nitrogênio', atomicNumber: 7,  atomicMass: 14.007, electronegativity: 3.04, valenceElectrons: 5, color: '#3050f8' },
    O:  { symbol: 'O',  name: 'Oxigênio',   atomicNumber: 8,  atomicMass: 15.999, electronegativity: 3.44, valenceElectrons: 6, color: '#ff0d0d' },
    F:  { symbol: 'F',  name: 'Flúor',      atomicNumber: 9,  atomicMass: 18.998, electronegativity: 3.98, valenceElectrons: 7, color: '#90e050' },
    Na: { symbol: 'Na', name: 'Sódio',      atomicNumber: 11, atomicMass: 22.990, electronegativity: 0.93, valenceElectrons: 1, color: '#ab5cf2' },
    Cl: { symbol: 'Cl', name: 'Cloro',      atomicNumber: 17, atomicMass: 35.453, electronegativity: 3.16, valenceElectrons: 7, color: '#1ff01f' },
    K:  { symbol: 'K',  name: 'Potássio',   atomicNumber: 19, atomicMass: 39.098, electronegativity: 0.82, valenceElectrons: 1, color: '#8f40d4' },
    S:  { symbol: 'S',  name: 'Enxofre',    atomicNumber: 16, atomicMass: 32.065, electronegativity: 2.58, valenceElectrons: 6, color: '#ffff30' },
    P:  { symbol: 'P',  name: 'Fósforo',    atomicNumber: 15, atomicMass: 30.974, electronegativity: 2.19, valenceElectrons: 5, color: '#ff8000' },
}

export type BondType = 'nonpolar-covalent' | 'polar-covalent' | 'ionic'

/**
 * MolecularCalculator — Classe estática com as regras base da química.
 * Executada DENTRO do Web Worker — sem acesso ao DOM.
 */
export class MolecularCalculator {

    // ─── Tabela Periódica ──────────────────────────────────────────────

    static getElement(symbol: string): ElementData | undefined {
        return PERIODIC_TABLE[symbol]
    }

    static getAllElements(): ElementData[] {
        return Object.values(PERIODIC_TABLE)
    }

    // ─── Eletronegatividade & Polaridade ───────────────────────────────

    /**
     * Diferença de eletronegatividade entre dois átomos.
     */
    static electronegativityDifference(symbolA: string, symbolB: string): number {
        const a = PERIODIC_TABLE[symbolA]
        const b = PERIODIC_TABLE[symbolB]
        if (!a || !b) return 0
        return Math.abs(a.electronegativity - b.electronegativity)
    }

    /**
     * Classifica o tipo de ligação com base na diferença de EN.
     *   ΔEN < 0.4  → covalente apolar
     *   0.4 ≤ ΔEN < 1.7 → covalente polar
     *   ΔEN ≥ 1.7 → iônica
     */
    static classifyBond(symbolA: string, symbolB: string): BondType {
        const diff = this.electronegativityDifference(symbolA, symbolB)
        if (diff < 0.4)  return 'nonpolar-covalent'
        if (diff < 1.7)  return 'polar-covalent'
        return 'ionic'
    }

    // ─── Massa Molar ──────────────────────────────────────────────────

    /**
     * Calcula a massa molar de uma fórmula molecular simples.
     * Suporta: H2O, NaCl, H2SO4, CH4, etc.
     */
    static molarMass(formula: string): number {
        const regex = /([A-Z][a-z]?)(\d*)/g
        let match: RegExpExecArray | null
        let total = 0

        while ((match = regex.exec(formula)) !== null) {
            const sym = match[1]
            if (!sym) continue
            const count = match[2] ? parseInt(match[2], 10) : 1
            const el = PERIODIC_TABLE[sym]
            if (el) total += el.atomicMass * count
        }

        return Math.round(total * 1000) / 1000 // 3 casas decimais
    }

    /**
     * Converte massa (g) → mols usando a fórmula molecular.
     */
    static massToMols(massGrams: number, formula: string): number {
        const mm = this.molarMass(formula)
        if (mm === 0) return 0
        return massGrams / mm
    }

    /**
     * Converte mols → massa (g) usando a fórmula molecular.
     */
    static molsToMass(mols: number, formula: string): number {
        return mols * this.molarMass(formula)
    }

    // ─── Termodinâmica ────────────────────────────────────────────────

    /**
     * Retorna os dados termodinâmicos de uma substância.
     */
    static getThermo(formula: string): ThermodynamicEntry | undefined {
        return THERMODYNAMIC_DATA[formula]
    }

    /**
     * Calcula a variação de entalpia de reação (ΔH_rxn).
     *   ΔH_rxn = Σ ΔHf°(produtos) − Σ ΔHf°(reagentes)
     *
     * @param reactants  Array de { formula, coeff }
     * @param products   Array de { formula, coeff }
     * @returns  ΔH em kJ/mol, ou null se dados insuficientes.
     */
    static calculateDeltaH(
        reactants: FormulaCoeff[],
        products: FormulaCoeff[]
    ): number | null {
        let hProducts = 0
        let hReactants = 0

        for (const p of products) {
            const d = THERMODYNAMIC_DATA[p.formula]
            if (!d) return null
            hProducts += d.deltaHf * p.coeff
        }
        for (const r of reactants) {
            const d = THERMODYNAMIC_DATA[r.formula]
            if (!d) return null
            hReactants += d.deltaHf * r.coeff
        }

        return hProducts - hReactants
    }

    /**
     * Calcula a variação de entropia de reação (ΔS_rxn).
     *   ΔS_rxn = Σ S°(produtos) − Σ S°(reagentes)
     */
    static calculateDeltaS(
        reactants: FormulaCoeff[],
        products: FormulaCoeff[]
    ): number | null {
        let sProducts = 0
        let sReactants = 0

        for (const p of products) {
            const d = THERMODYNAMIC_DATA[p.formula]
            if (!d) return null
            sProducts += d.entropy * p.coeff
        }
        for (const r of reactants) {
            const d = THERMODYNAMIC_DATA[r.formula]
            if (!d) return null
            sReactants += d.entropy * r.coeff
        }

        return sProducts - sReactants
    }

    /**
     * Calcula a Energia Livre de Gibbs (ΔG = ΔH − TΔS).
     *
     * @param reactants  Array de { formula, coeff }
     * @param products   Array de { formula, coeff }
     * @param tempKelvin Temperatura em Kelvin (padrão 298 K)
     * @returns  ΔG em kJ/mol, ou null se dados insuficientes.
     */
    static calculateGibbsFreeEnergy(
        reactants: FormulaCoeff[],
        products: FormulaCoeff[],
        tempKelvin: number = 298
    ): number | null {
        const dH = this.calculateDeltaH(reactants, products)
        const dS = this.calculateDeltaS(reactants, products)
        if (dH === null || dS === null) return null

        // ΔS é em J/(mol·K), converter para kJ
        return dH - tempKelvin * (dS / 1000)
    }

    /**
     * Verifica se uma reação é espontânea (ΔG < 0) na temperatura dada.
     */
    static isReactionSpontaneous(
        reactants: FormulaCoeff[],
        products: FormulaCoeff[],
        tempKelvin: number = 298
    ): boolean {
        const dG = this.calculateGibbsFreeEnergy(reactants, products, tempKelvin)
        if (dG === null) return false
        return dG < 0
    }

    /**
     * Verifica se a temperatura supre a energia de ativação.
     * Usa a relação simplificada: kT > Ea (escalonada)
     *
     * @param formula   Fórmula do produto (para buscar Ea)
     * @param tempKelvin Temperatura em Kelvin
     * @returns true se a barreira cinética é ultrapassada
     */
    static canOvercomeActivationEnergy(formula: string, tempKelvin: number): boolean {
        const d = THERMODYNAMIC_DATA[formula]
        if (!d || d.activationEnergy === undefined) return true // sem dados → sem barreira

        // Boltzmann simplificado: E_thermal ≈ R·T (kJ/mol)
        // R = 0.008314 kJ/(mol·K)
        const thermalEnergy = 0.008314 * tempKelvin
        // A reação acontece se a energia térmica for uma fração razoável da Ea
        // (fator de Arrhenius simplificado — ~5% da Ea é suficiente estatisticamente)
        return thermalEnergy > d.activationEnergy * 0.05
    }
}

// ═══════════════════════════════════════════════════════════════════════
// DADOS TERMODINÂMICOS DE SUBSTÂNCIAS COMUNS
// Valores reais de referência (NIST/CRC Handbook)
//
// deltaHf: Entalpia padrão de formação (kJ/mol) a 298 K
// entropy: Entropia padrão S° (J/(mol·K)) a 298 K
// activationEnergy: Ea aproximada em kJ/mol (para formação)
// ═══════════════════════════════════════════════════════════════════════

export interface ThermodynamicEntry {
    formula: string
    deltaHf: number           // kJ/mol
    entropy: number           // J/(mol·K)
    activationEnergy?: number // kJ/mol
}

export interface FormulaCoeff {
    formula: string
    coeff: number
}

const THERMODYNAMIC_DATA: Record<string, ThermodynamicEntry> = {
    // ─── Elementos no Estado Padrão (ΔHf = 0 por definição) ──────────
    'H2':   { formula: 'H2',   deltaHf: 0,       entropy: 130.7 },
    'O2':   { formula: 'O2',   deltaHf: 0,       entropy: 205.1 },
    'N2':   { formula: 'N2',   deltaHf: 0,       entropy: 191.6 },
    'C':    { formula: 'C',    deltaHf: 0,       entropy: 5.7 },
    'Fe':   { formula: 'Fe',   deltaHf: 0,       entropy: 27.3 },
    'Cu':   { formula: 'Cu',   deltaHf: 0,       entropy: 33.2 },
    'Zn':   { formula: 'Zn',   deltaHf: 0,       entropy: 41.6 },
    'Mg':   { formula: 'Mg',   deltaHf: 0,       entropy: 32.7 },
    'Na':   { formula: 'Na',   deltaHf: 0,       entropy: 51.3 },
    'Cl2':  { formula: 'Cl2',  deltaHf: 0,       entropy: 223.1 },
    'Br2':  { formula: 'Br2',  deltaHf: 0,       entropy: 152.2 },

    // ─── Compostos Inorgânicos ───────────────────────────────────────
    'H2O':  { formula: 'H2O',  deltaHf: -285.8,  entropy: 69.9,   activationEnergy: 75 },
    'CO2':  { formula: 'CO2',  deltaHf: -393.5,  entropy: 213.7 },
    'CO':   { formula: 'CO',   deltaHf: -110.5,  entropy: 197.7 },
    'NH3':  { formula: 'NH3',  deltaHf: -45.9,   entropy: 192.8,  activationEnergy: 335 },
    'NO':   { formula: 'NO',   deltaHf: 91.3,    entropy: 210.8 },
    'NO2':  { formula: 'NO2',  deltaHf: 33.2,    entropy: 240.1 },
    'SO2':  { formula: 'SO2',  deltaHf: -296.8,  entropy: 248.2 },
    'SO3':  { formula: 'SO3',  deltaHf: -395.7,  entropy: 256.8 },
    'HCl':  { formula: 'HCl',  deltaHf: -92.3,   entropy: 186.9 },
    'HF':   { formula: 'HF',   deltaHf: -273.3,  entropy: 173.8 },
    'HBr':  { formula: 'HBr',  deltaHf: -36.3,   entropy: 198.7 },
    'H2S':  { formula: 'H2S',  deltaHf: -20.6,   entropy: 205.8 },
    'H2O2': { formula: 'H2O2', deltaHf: -187.8,  entropy: 109.6,  activationEnergy: 75 },

    // ─── Sais e Óxidos ──────────────────────────────────────────────
    'NaCl': { formula: 'NaCl', deltaHf: -411.2,  entropy: 72.1 },
    'KCl':  { formula: 'KCl',  deltaHf: -436.5,  entropy: 82.6 },
    'NaOH': { formula: 'NaOH', deltaHf: -425.6,  entropy: 64.5 },
    'KOH':  { formula: 'KOH',  deltaHf: -424.8,  entropy: 78.9 },
    'CaCO3':{ formula: 'CaCO3',deltaHf: -1206.9, entropy: 92.9 },
    'CaO':  { formula: 'CaO',  deltaHf: -634.9,  entropy: 38.1 },
    'MgO':  { formula: 'MgO',  deltaHf: -601.6,  entropy: 27.0 },
    'Fe2O3':{ formula: 'Fe2O3',deltaHf: -824.2,  entropy: 87.4 },
    'CuO':  { formula: 'CuO',  deltaHf: -157.3,  entropy: 42.6 },
    'ZnO':  { formula: 'ZnO',  deltaHf: -350.5,  entropy: 43.7 },
    'AgCl': { formula: 'AgCl', deltaHf: -127.0,  entropy: 96.3 },
    'BaSO4':{ formula: 'BaSO4',deltaHf: -1473.2, entropy: 132.2 },

    // ─── Ácidos em Solução ──────────────────────────────────────────
    'H2SO4':{ formula: 'H2SO4',deltaHf: -814.0,  entropy: 156.9 },
    'HNO3': { formula: 'HNO3', deltaHf: -207.4,  entropy: 146.4 },
    'H3PO4':{ formula: 'H3PO4',deltaHf: -1288.3, entropy: 158.2 },
    'CH3COOH':{ formula: 'CH3COOH', deltaHf: -484.5, entropy: 159.8 },

    // ─── Orgânicos ──────────────────────────────────────────────────
    'CH4':  { formula: 'CH4',  deltaHf: -74.8,   entropy: 186.3,  activationEnergy: 435 },
    'C2H6': { formula: 'C2H6', deltaHf: -84.0,   entropy: 229.2 },
    'C2H4': { formula: 'C2H4', deltaHf: 52.4,    entropy: 219.3 },
    'C2H2': { formula: 'C2H2', deltaHf: 227.4,   entropy: 200.9 },
    'C2H5OH':{ formula: 'C2H5OH', deltaHf: -277.7, entropy: 160.7, activationEnergy: 50 },
    'CH3OH':{ formula: 'CH3OH', deltaHf: -239.2,  entropy: 126.8 },
    'C6H12O6':{ formula: 'C6H12O6', deltaHf: -1273.3, entropy: 212.1 },

    // ─── Substâncias para reações de neutralização ──────────────────
    'NaHCO3':{ formula: 'NaHCO3', deltaHf: -950.8, entropy: 101.7 },
    'Na2CO3':{ formula: 'Na2CO3', deltaHf: -1130.7, entropy: 135.0 },
    'NaNO3': { formula: 'NaNO3',  deltaHf: -467.9,  entropy: 116.5 },
    'AgNO3': { formula: 'AgNO3',  deltaHf: -124.4,  entropy: 140.9 },
}
