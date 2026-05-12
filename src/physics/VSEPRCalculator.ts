// src/physics/VSEPRCalculator.ts
// ═══════════════════════════════════════════════════════════════════════
// 🔬 CALCULADOR VSEPR PROCESSURAL
// Calcula a geometria 3D de uma molécula a partir da sua fórmula,
// usando a Regra do Octeto e a teoria VSEPR.
//
// Executado DENTRO do Web Worker — sem acesso ao DOM.
//
// Fluxo:
//   1. Recebe fórmula molecular (ex: "H2O", "CH4", "NH3")
//   2. Identifica átomo central e ligantes
//   3. Conta elétrons de valência
//   4. Determina número estérico, pares ligantes (BP) e isolados (LP)
//   5. Calcula geometria e posições 3D dos átomos
//   6. Retorna um VSEPRMolecule pronto para renderização
// ═══════════════════════════════════════════════════════════════════════

import { MolecularCalculator } from './MolecularCalculator'

// ─── Tipos que espelham vseprData.ts para compatibilidade ────────────

export type VSEPRGeometry =
    | 'linear'
    | 'bent'
    | 'trigonal-planar'
    | 'trigonal-pyramidal'
    | 'tetrahedral'
    | 't-shaped'
    | 'seesaw'
    | 'square-planar'
    | 'trigonal-bipyramidal'
    | 'square-pyramidal'
    | 'octahedral'

export type Hybridization = 'sp' | 'sp2' | 'sp3' | 'sp3d' | 'sp3d2'

export type BondType = 'single' | 'double' | 'triple' | 'ionic' | 'dative'

export interface GeneratedAtom {
    symbol: string
    position: [number, number, number]
    color: string
    radius: number
}

export interface GeneratedBond {
    from: number
    to: number
    type: BondType
}

export interface GeneratedLonePair {
    atomIndex: number
    position: [number, number, number]
}

export interface GeneratedMolecule {
    formula: string
    name: string
    geometry: VSEPRGeometry
    hybridization: Hybridization
    bondAngle: string
    bondingPairs: number
    lonePairs: number
    atoms: GeneratedAtom[]
    bonds: GeneratedBond[]
    electronPairs: GeneratedLonePair[]
    description: string
    dipoleMoment: boolean
    deltaG?: number | null
    deltaH?: number | null
}

// ─── Cores e Raios CPK ──────────────────────────────────────────────

const CPK_COLORS: Record<string, string> = {
    H: '#ffffff', He: '#d9ffff', C: '#555555', N: '#3050f8',
    O: '#ff0d0d', F: '#90e050', Na: '#ab5cf2', Mg: '#8aff00',
    Al: '#bfa6a6', Si: '#f0c8a0', P: '#ff8000', S: '#ffff30',
    Cl: '#1ff01f', K: '#8f40d4', Ca: '#3dff00', Br: '#a62929',
    I: '#940094', Fe: '#e06633', Cu: '#c88033', Zn: '#7d80b0',
}

const CPK_RADII: Record<string, number> = {
    H: 0.12, C: 0.17, N: 0.16, O: 0.15, F: 0.14,
    Na: 0.20, Mg: 0.18, Cl: 0.18, S: 0.18, P: 0.18,
    K: 0.22, Ca: 0.20, Br: 0.19, I: 0.20,
    Fe: 0.17, Cu: 0.17, Zn: 0.17,
}

// ─── Tabela de Eletronegatividade para determinar átomo central ─────

const ELECTRONEGATIVITY: Record<string, number> = {
    H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
    Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19,
    S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.00, Br: 2.96,
    I: 2.66, Fe: 1.83, Cu: 1.90, Zn: 1.65,
}

const VALENCE_ELECTRONS: Record<string, number> = {
    H: 1, C: 4, N: 5, O: 6, F: 7,
    Na: 1, Mg: 2, Al: 3, Si: 4, P: 5,
    S: 6, Cl: 7, K: 1, Ca: 2, Br: 7,
    I: 7, Fe: 2, Cu: 2, Zn: 2,
}

// ═══════════════════════════════════════════════════════════════════════
// GEOMETRIAS VSEPR — Posições 3D ideais para cada número estérico
// ═══════════════════════════════════════════════════════════════════════

const GEOMETRY_POSITIONS: Record<number, [number, number, number][]> = {
    2: [
        [-1.0, 0, 0], [1.0, 0, 0]                                    // Linear
    ],
    3: [
        [0, 1.0, 0], [-0.87, -0.5, 0], [0.87, -0.5, 0]             // Trigonal planar
    ],
    4: [
        [0.63, 0.63, 0.63],   [-0.63, -0.63, 0.63],                 // Tetraédrico
        [0.63, -0.63, -0.63], [-0.63, 0.63, -0.63],
    ],
    5: [
        [0, 1.0, 0], [0, -1.0, 0],                                   // Axiais
        [1.0, 0, 0], [-0.5, 0, 0.87], [-0.5, 0, -0.87],            // Equatoriais
    ],
    6: [
        [1.0, 0, 0], [-1.0, 0, 0],                                   // Octaédrico
        [0, 1.0, 0], [0, -1.0, 0],
        [0, 0, 1.0], [0, 0, -1.0],
    ],
}

// Mapeamento: (stericNumber, lonePairs) → geometria
const GEOMETRY_MAP: Record<string, { geometry: VSEPRGeometry; hybridization: Hybridization; bondAngle: string }> = {
    '2-0': { geometry: 'linear',               hybridization: 'sp',   bondAngle: '180°' },
    '3-0': { geometry: 'trigonal-planar',       hybridization: 'sp2',  bondAngle: '120°' },
    '3-1': { geometry: 'bent',                  hybridization: 'sp2',  bondAngle: '~117°' },
    '4-0': { geometry: 'tetrahedral',           hybridization: 'sp3',  bondAngle: '109.5°' },
    '4-1': { geometry: 'trigonal-pyramidal',    hybridization: 'sp3',  bondAngle: '~107°' },
    '4-2': { geometry: 'bent',                  hybridization: 'sp3',  bondAngle: '~104.5°' },
    '5-0': { geometry: 'trigonal-bipyramidal',  hybridization: 'sp3d', bondAngle: '90°/120°' },
    '5-1': { geometry: 'seesaw',               hybridization: 'sp3d', bondAngle: '~90°/~120°' },
    '5-2': { geometry: 't-shaped',             hybridization: 'sp3d', bondAngle: '~90°' },
    '6-0': { geometry: 'octahedral',           hybridization: 'sp3d2',bondAngle: '90°' },
    '6-1': { geometry: 'square-pyramidal',     hybridization: 'sp3d2',bondAngle: '~85°' },
    '6-2': { geometry: 'square-planar',        hybridization: 'sp3d2',bondAngle: '90°' },
}

// ═══════════════════════════════════════════════════════════════════════
// CALCULADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

export class VSEPRCalculator {

    /**
     * Gera a geometria 3D de uma molécula a partir da sua fórmula.
     *
     * @param formula Fórmula molecular (ex: "H2O", "CH4", "NH3", "CO2")
     * @returns GeneratedMolecule com posições 3D, ou null se impossível
     */
    static calculate(formula: string): GeneratedMolecule | null {
        // 1. Parsear a fórmula
        const atoms = this.parseFormula(formula)
        if (atoms.length === 0) return null

        // 1.5. Átomos isolados (Fe, Cu, Na, C)
        if (atoms.length === 1) {
            const sym = atoms[0]
            return {
                formula,
                name: formula,
                geometry: 'linear', // Não tem geometria, mas previne quebra
                hybridization: 'sp',
                bondAngle: '-',
                bondingPairs: 0,
                lonePairs: 0,
                atoms: [{
                    symbol: sym,
                    position: [0, 0, 0],
                    color: CPK_COLORS[sym] || '#aaaaaa',
                    radius: CPK_RADII[sym] || 0.16,
                }],
                bonds: [],
                electronPairs: [],
                description: `Átomo isolado de ${sym}. Não possui ligações ou geometria VSEPR aplicável.`,
                dipoleMoment: false
            }
        }

        // 2. Moléculas diatômicas (H2, O2, N2, HCl, etc.)
        if (atoms.length === 2) {
            return this.buildDiatomic(formula, atoms)
        }

        // 3. Identificar átomo central (menor eletronegatividade, exceto H)
        const centralIdx = this.findCentralAtom(atoms)
        const centralSymbol = atoms[centralIdx]
        const ligands = atoms.filter((_, i) => i !== centralIdx)

        // 4. Contar elétrons de valência
        const totalValence = atoms.reduce((sum, sym) => sum + (VALENCE_ELECTRONS[sym] || 0), 0)
        const bondingPairs = ligands.length


        // Elétrons restantes para pares isolados no átomo central
        const centralValence = VALENCE_ELECTRONS[centralSymbol] || 0
        // Estimativa de pares isolados: (valência central - ligações) / 2
        // Usa a fórmula simplificada: LP = (V_central - BP) onde V é considerando octeto
        let lonePairs = Math.max(0, Math.floor((centralValence - bondingPairs) / 2))

        // Casos especiais: Boro e Berílio não precisam de octeto
        if (centralSymbol === 'B' || centralSymbol === 'Be') lonePairs = 0

        // 5. Número estérico
        const stericNumber = bondingPairs + lonePairs

        // 6. Buscar geometria
        const key = `${stericNumber}-${lonePairs}`
        const geoInfo = GEOMETRY_MAP[key] || GEOMETRY_MAP[`${stericNumber}-0`]
        if (!geoInfo) return null

        // 7. Gerar posições 3D
        const positions = GEOMETRY_POSITIONS[stericNumber]
        if (!positions || positions.length < stericNumber) return null

        // Escalar posições pelo comprimento de ligação
        const bondLength = 0.9

        // Átomo central na origem
        const generatedAtoms: GeneratedAtom[] = [{
            symbol: centralSymbol,
            position: [0, 0, 0],
            color: CPK_COLORS[centralSymbol] || '#aaaaaa',
            radius: CPK_RADII[centralSymbol] || 0.16,
        }]

        // Ligantes nas posições geométricas
        const bonds: GeneratedBond[] = []
        for (let i = 0; i < bondingPairs; i++) {
            const pos = positions[i]
            const sym = ligands[i]
            generatedAtoms.push({
                symbol: sym,
                position: [pos[0] * bondLength, pos[1] * bondLength, pos[2] * bondLength],
                color: CPK_COLORS[sym] || '#aaaaaa',
                radius: CPK_RADII[sym] || 0.14,
            })

            // Determinar tipo de ligação
            const bondType = this.determineBondType(centralSymbol, sym, formula, totalValence, bondingPairs)
            bonds.push({ from: 0, to: i + 1, type: bondType })
        }

        // Pares isolados nas posições restantes
        const electronPairs: GeneratedLonePair[] = []
        for (let i = 0; i < lonePairs; i++) {
            const pos = positions[bondingPairs + i]
            if (pos) {
                const lpDist = bondLength * 0.7  // LP são mais curtos visualmente
                electronPairs.push({
                    atomIndex: 0,
                    position: [pos[0] * lpDist, pos[1] * lpDist, pos[2] * lpDist],
                })
            }
        }

        // 8. Determinar polaridade
        const dipoleMoment = this.hasDipoleMoment(geoInfo.geometry, ligands)

        // 9. Gerar descrição
        const description = this.generateDescription(geoInfo.geometry, bondingPairs, lonePairs, centralSymbol)

        return {
            formula,
            name: formula,
            geometry: geoInfo.geometry,
            hybridization: geoInfo.hybridization,
            bondAngle: geoInfo.bondAngle,
            bondingPairs,
            lonePairs,
            atoms: generatedAtoms,
            bonds,
            electronPairs,
            description,
            dipoleMoment,
        }
    }

    // ─── Helpers Internos ────────────────────────────────────────────

    /**
     * Parseia fórmula molecular em array de símbolos.
     * "H2O" → ["O", "H", "H"]  (central primeiro para facilitar)
     * "CH4" → ["C", "H", "H", "H", "H"]
     */
    private static parseFormula(formula: string): string[] {
        const regex = /([A-Z][a-z]?)(\d*)/g
        const atoms: string[] = []
        let match: RegExpExecArray | null

        while ((match = regex.exec(formula)) !== null) {
            const sym = match[1]
            if (!sym) continue
            const count = match[2] ? parseInt(match[2], 10) : 1
            for (let i = 0; i < count; i++) {
                atoms.push(sym)
            }
        }

        return atoms
    }

    /**
     * Encontra o índice do átomo central.
     * Regra: menor eletronegatividade que não seja H.
     */
    private static findCentralAtom(atoms: string[]): number {
        let bestIdx = 0
        let bestEN = Infinity

        for (let i = 0; i < atoms.length; i++) {
            const sym = atoms[i]
            if (sym === 'H') continue // H nunca é central
            const en = ELECTRONEGATIVITY[sym] || 999
            if (en < bestEN) {
                bestEN = en
                bestIdx = i
            }
        }

        return bestIdx
    }

    /**
     * Determina o tipo de ligação entre dois átomos.
     */
    private static determineBondType(central: string, ligand: string, _formula: string, _totalValence: number, _bp: number): BondType {
        const bondClass = MolecularCalculator.classifyBond(central, ligand)

        if (bondClass === 'ionic') return 'ionic'

        // Ligações duplas/triplas para casos comuns
        // O=C=O, N≡N, O=O, etc.
        if (central === 'C' && ligand === 'O' && _bp <= 2) return 'double'
        if (central === 'S' && ligand === 'O') return 'double'
        if (central === 'N' && ligand === 'N' && _bp === 1) return 'triple'

        return 'single'
    }

    /**
     * Verifica se a molécula tem momento dipolar.
     */
    private static hasDipoleMoment(geometry: VSEPRGeometry, ligands: string[]): boolean {
        // Se todos os ligantes são iguais e a geometria é simétrica → apolar
        const allSame = ligands.every(l => l === ligands[0])
        const symmetricGeometries: VSEPRGeometry[] = ['linear', 'trigonal-planar', 'tetrahedral', 'octahedral', 'trigonal-bipyramidal', 'square-planar']

        if (allSame && symmetricGeometries.includes(geometry)) return false

        // Geometrias com lone pairs ou ligantes diferentes → polar
        return true
    }

    /**
     * Gera descrição em português.
     */
    private static generateDescription(geometry: VSEPRGeometry, bp: number, lp: number, central: string): string {
        const geoNames: Record<VSEPRGeometry, string> = {
            'linear': 'Linear',
            'bent': 'Angular/Curvada',
            'trigonal-planar': 'Trigonal Planar',
            'trigonal-pyramidal': 'Piramidal Trigonal',
            'tetrahedral': 'Tetraédrica',
            't-shaped': 'Forma de T',
            'seesaw': 'Gangorra',
            'square-planar': 'Quadrada Planar',
            'trigonal-bipyramidal': 'Bipirâmide Trigonal',
            'square-pyramidal': 'Piramidal de Base Quadrada',
            'octahedral': 'Octaédrica',
        }

        const name = geoNames[geometry] || geometry
        return `Geometria ${name}: ${bp} par${bp > 1 ? 'es' : ''} ligante${bp > 1 ? 's' : ''}, ${lp} par${lp > 1 ? 'es' : ''} isolado${lp > 1 ? 's' : ''} no ${central}. Calculada proceduralmente via VSEPR.`
    }

    /**
     * Constrói molécula diatômica (H2, O2, HCl, etc.)
     */
    private static buildDiatomic(formula: string, atoms: string[]): GeneratedMolecule {
        const [a, bSym] = atoms
        const bondType = MolecularCalculator.classifyBond(a, bSym)
        let bt: BondType = 'single'
        if (bondType === 'ionic') bt = 'ionic'
        else if (a === 'O' && bSym === 'O') bt = 'double'
        else if (a === 'N' && bSym === 'N') bt = 'triple'

        const dist = 0.5

        return {
            formula,
            name: formula,
            geometry: 'linear',
            hybridization: 'sp',
            bondAngle: '—',
            bondingPairs: 1,
            lonePairs: 0,
            atoms: [
                { symbol: a, position: [-dist, 0, 0], color: CPK_COLORS[a] || '#aaa', radius: CPK_RADII[a] || 0.15 },
                { symbol: bSym, position: [dist, 0, 0], color: CPK_COLORS[bSym] || '#aaa', radius: CPK_RADII[bSym] || 0.15 },
            ],
            bonds: [{ from: 0, to: 1, type: bt }],
            electronPairs: [],
            description: `Molécula diatômica. Ligação ${bt}. Calculada proceduralmente.`,
            dipoleMoment: a !== bSym,
        }
    }
}
