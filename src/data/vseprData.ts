// src/data/vseprData.ts
// Banco de dados VSEPR completo — Geometrias moleculares reais
// Coordenadas 3D calculadas a partir dos ângulos de ligação reais

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export type VSEPRGeometry =
    | 'linear'                   // 180° — 2 BP, 0 LP
    | 'bent'                     // ~104-120° — 2 BP, 1-2 LP
    | 'trigonal-planar'          // 120° — 3 BP, 0 LP
    | 'trigonal-pyramidal'       // ~107° — 3 BP, 1 LP
    | 'tetrahedral'              // 109.5° — 4 BP, 0 LP
    | 't-shaped'                 // 90°/180° — 3 BP, 2 LP
    | 'seesaw'                   // ~90°/120° — 4 BP, 1 LP
    | 'square-planar'            // 90° — 4 BP, 2 LP
    | 'trigonal-bipyramidal'     // 90°/120° — 5 BP, 0 LP
    | 'square-pyramidal'         // ~90° — 5 BP, 1 LP
    | 'octahedral'               // 90° — 6 BP, 0 LP
    | 'pentagonal-bipyramidal'   // 72°/90° — 7 BP, 0 LP

export type Hybridization = 'sp' | 'sp2' | 'sp3' | 'sp3d' | 'sp3d2' | 'sp3d3'

export type BondType = 'single' | 'double' | 'triple' | 'ionic' | 'dative'

export interface MoleculeAtom {
    symbol: string
    position: [number, number, number]
    color: string
    radius: number            // Raio atômico relativo para visualização
}

export interface MoleculeBond {
    from: number              // Índice do átomo
    to: number                // Índice do átomo
    type: BondType
}

export interface LonePair {
    atomIndex: number         // Átomo que possui o par
    position: [number, number, number]  // Posição da nuvem eletrônica
}

export interface ResonanceState {
    bonds: MoleculeBond[]  // Bond configuration for this resonance form
    label: string          // e.g. "Estrutura I", "Estrutura II"
}

export interface VSEPRMolecule {
    formula: string
    name: string
    namePt: string
    geometry: VSEPRGeometry
    hybridization: Hybridization
    bondAngle: string
    bondingPairs: number
    lonePairs: number
    atoms: MoleculeAtom[]
    bonds: MoleculeBond[]
    electronPairs: LonePair[]
    description: string
    dipoleMoment: boolean
    // Level 2 extensions
    resonance?: ResonanceState[]       // Alternate resonance structures
    formalCharges?: Record<number, number>  // atomIndex -> formal charge
    octetExpansion?: boolean           // True if central atom expands octet
    dativeBonds?: number[]             // Bond indices that are dative
}

// ═══════════════════════════════════════════════════════════════════════
// CORES ATÔMICAS (CPK padrão)
// ═══════════════════════════════════════════════════════════════════════

export const ATOM_COLORS: Record<string, string> = {
    H: '#ffffff',
    He: '#d9ffff',
    Li: '#cc80ff',
    Be: '#c2ff00',
    B: '#ffb5b5',
    C: '#555555',
    N: '#3050f8',
    O: '#ff0d0d',
    F: '#90e050',
    Ne: '#b3e3f5',
    Na: '#ab5cf2',
    Mg: '#8aff00',
    Al: '#bfa6a6',
    Si: '#f0c8a0',
    P: '#ff8000',
    S: '#ffff30',
    Cl: '#1ff01f',
    Ar: '#80d1e3',
    K: '#8f40d4',
    Ca: '#3dff00',
    Br: '#a62929',
    I: '#940094',
    Xe: '#429eb0',
    Se: '#ffa100',
    Te: '#d47a00',
    Kr: '#5cb8d1',
}

export const ATOM_RADII: Record<string, number> = {
    H: 0.12, He: 0.14, Li: 0.18, Be: 0.14, B: 0.16,
    C: 0.17, N: 0.16, O: 0.15, F: 0.14, Ne: 0.14,
    Na: 0.20, Mg: 0.18, Al: 0.18, Si: 0.18, P: 0.18,
    S: 0.18, Cl: 0.18, Ar: 0.18, K: 0.22, Ca: 0.20,
    Br: 0.19, I: 0.20, Xe: 0.22, Se: 0.19, Te: 0.20,
    Kr: 0.20,
}

function a(symbol: string, pos: [number, number, number]): MoleculeAtom {
    return {
        symbol,
        position: pos,
        color: ATOM_COLORS[symbol] || '#aaaaaa',
        radius: ATOM_RADII[symbol] || 0.16,
    }
}

function b(from: number, to: number, type: BondType = 'single'): MoleculeBond {
    return { from, to, type }
}

function lp(atomIndex: number, pos: [number, number, number]): LonePair {
    return { atomIndex, position: pos }
}

// ═══════════════════════════════════════════════════════════════════════
// BANCO DE MOLÉCULAS VSEPR — 35+ moléculas
// ═══════════════════════════════════════════════════════════════════════

export const VSEPR_MOLECULES: Record<string, VSEPRMolecule> = {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LINEAR (180°) — sp
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'CO2': {
        formula: 'CO₂', name: 'Carbon Dioxide', namePt: 'Dióxido de Carbono',
        geometry: 'linear', hybridization: 'sp', bondAngle: '180°',
        bondingPairs: 2, lonePairs: 0,
        atoms: [a('C', [0, 0, 0]), a('O', [-1.2, 0, 0]), a('O', [1.2, 0, 0])],
        bonds: [b(0, 1, 'double'), b(0, 2, 'double')],
        electronPairs: [],
        description: 'Geometria linear: 2 domínios de ligação, 0 pares isolados. Molécula apolar simétrica.',
        dipoleMoment: false,
    },

    'BeCl2': {
        formula: 'BeCl₂', name: 'Beryllium Chloride', namePt: 'Cloreto de Berílio',
        geometry: 'linear', hybridization: 'sp', bondAngle: '180°',
        bondingPairs: 2, lonePairs: 0,
        atoms: [a('Be', [0, 0, 0]), a('Cl', [-1.3, 0, 0]), a('Cl', [1.3, 0, 0])],
        bonds: [b(0, 1), b(0, 2)],
        electronPairs: [],
        description: 'Linear com 2 ligações simples. Deficiente de elétrons (4 elétrons na camada de valência do Be).',
        dipoleMoment: false,
    },

    'HCN': {
        formula: 'HCN', name: 'Hydrogen Cyanide', namePt: 'Cianeto de Hidrogênio',
        geometry: 'linear', hybridization: 'sp', bondAngle: '180°',
        bondingPairs: 2, lonePairs: 0,
        atoms: [a('H', [-1.4, 0, 0]), a('C', [0, 0, 0]), a('N', [1.15, 0, 0])],
        bonds: [b(0, 1), b(1, 2, 'triple')],
        electronPairs: [lp(2, [1.8, 0, 0])],
        description: 'Linear com ligação tripla C≡N. Molécula polar e extremamente tóxica.',
        dipoleMoment: true,
    },

    'C2H2': {
        formula: 'C₂H₂', name: 'Acetylene', namePt: 'Acetileno (Etino)',
        geometry: 'linear', hybridization: 'sp', bondAngle: '180°',
        bondingPairs: 2, lonePairs: 0,
        atoms: [a('H', [-1.8, 0, 0]), a('C', [-0.6, 0, 0]), a('C', [0.6, 0, 0]), a('H', [1.8, 0, 0])],
        bonds: [b(0, 1), b(1, 2, 'triple'), b(2, 3)],
        electronPairs: [],
        description: 'Ligação tripla C≡C: duas ligações π perpendiculares + uma σ.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRIGONAL PLANAR (120°) — sp²
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'BF3': {
        formula: 'BF₃', name: 'Boron Trifluoride', namePt: 'Trifluoreto de Boro',
        geometry: 'trigonal-planar', hybridization: 'sp2', bondAngle: '120°',
        bondingPairs: 3, lonePairs: 0,
        atoms: [
            a('B', [0, 0, 0]),
            a('F', [0, 1.1, 0]),
            a('F', [-0.953, -0.55, 0]),
            a('F', [0.953, -0.55, 0]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [],
        description: 'Trigonal planar perfeito: 3 domínios, 120° entre todas as ligações. Ácido de Lewis.',
        dipoleMoment: false,
    },

    'SO3': {
        formula: 'SO₃', name: 'Sulfur Trioxide', namePt: 'Trióxido de Enxofre',
        geometry: 'trigonal-planar', hybridization: 'sp2', bondAngle: '120°',
        bondingPairs: 3, lonePairs: 0,
        atoms: [
            a('S', [0, 0, 0]),
            a('O', [0, 1.2, 0]),
            a('O', [-1.04, -0.6, 0]),
            a('O', [1.04, -0.6, 0]),
        ],
        bonds: [b(0, 1, 'double'), b(0, 2, 'double'), b(0, 3, 'double')],
        electronPairs: [],
        description: 'Trigonal planar com expansão do octeto. Estruturas de ressonância.',
        dipoleMoment: false,
    },

    'C2H4': {
        formula: 'C₂H₄', name: 'Ethylene', namePt: 'Etileno (Eteno)',
        geometry: 'trigonal-planar', hybridization: 'sp2', bondAngle: '~121.3°',
        bondingPairs: 3, lonePairs: 0,
        atoms: [
            a('C', [-0.6, 0, 0]),
            a('C', [0.6, 0, 0]),
            a('H', [-1.2, 0.8, 0]),
            a('H', [-1.2, -0.8, 0]),
            a('H', [1.2, 0.8, 0]),
            a('H', [1.2, -0.8, 0]),
        ],
        bonds: [b(0, 1, 'double'), b(0, 2), b(0, 3), b(1, 4), b(1, 5)],
        electronPairs: [],
        description: 'Cada carbono é sp². Ligação π impede rotação livre.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BENT / ANGULAR — sp², sp³
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'H2O': {
        formula: 'H₂O', name: 'Water', namePt: 'Água',
        geometry: 'bent', hybridization: 'sp3', bondAngle: '104.5°',
        bondingPairs: 2, lonePairs: 2,
        atoms: [
            a('O', [0, 0, 0]),
            a('H', [-0.76, 0.59, 0]),
            a('H', [0.76, 0.59, 0]),
        ],
        bonds: [b(0, 1), b(0, 2)],
        electronPairs: [
            lp(0, [-0.35, -0.55, 0.55]),
            lp(0, [0.35, -0.55, -0.55]),
        ],
        description: 'Angular/Curvada: 2 pares ligantes + 2 pares isolados no oxigênio. Ângulo reduzido de 109.5° para 104.5° pela repulsão dos pares isolados.',
        dipoleMoment: true,
    },

    'SO2': {
        formula: 'SO₂', name: 'Sulfur Dioxide', namePt: 'Dióxido de Enxofre',
        geometry: 'bent', hybridization: 'sp2', bondAngle: '119°',
        bondingPairs: 2, lonePairs: 1,
        atoms: [
            a('S', [0, 0, 0]),
            a('O', [-1.05, -0.53, 0]),
            a('O', [1.05, -0.53, 0]),
        ],
        bonds: [b(0, 1, 'double'), b(0, 2, 'double')],
        electronPairs: [lp(0, [0, 0.9, 0])],
        description: 'Angular com 1 par isolado no enxofre. Domínio trigonal planar, geometria molecular angular.',
        dipoleMoment: true,
    },

    'O3': {
        formula: 'O₃', name: 'Ozone', namePt: 'Ozônio',
        geometry: 'bent', hybridization: 'sp2', bondAngle: '116.8°',
        bondingPairs: 2, lonePairs: 1,
        atoms: [
            a('O', [0, 0, 0]),
            a('O', [-1.0, -0.58, 0]),
            a('O', [1.0, -0.58, 0]),
        ],
        bonds: [b(0, 1, 'double'), b(0, 2)],
        electronPairs: [lp(0, [0, 0.85, 0])],
        description: 'Angular com ressonância: ligações equivalentes por deslocalização eletrônica.',
        dipoleMoment: true,
    },

    'H2S': {
        formula: 'H₂S', name: 'Hydrogen Sulfide', namePt: 'Sulfeto de Hidrogênio',
        geometry: 'bent', hybridization: 'sp3', bondAngle: '92.1°',
        bondingPairs: 2, lonePairs: 2,
        atoms: [
            a('S', [0, 0, 0]),
            a('H', [-0.68, 0.68, 0]),
            a('H', [0.68, 0.68, 0]),
        ],
        bonds: [b(0, 1), b(0, 2)],
        electronPairs: [
            lp(0, [-0.3, -0.6, 0.5]),
            lp(0, [0.3, -0.6, -0.5]),
        ],
        description: 'Angular como água, mas com ângulo menor (92°) pois S usa orbitais p quase puros.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRIGONAL PYRAMIDAL (107°) — sp³
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'NH3': {
        formula: 'NH₃', name: 'Ammonia', namePt: 'Amônia',
        geometry: 'trigonal-pyramidal', hybridization: 'sp3', bondAngle: '107.3°',
        bondingPairs: 3, lonePairs: 1,
        atoms: [
            a('N', [0, 0.35, 0]),
            a('H', [0, -0.3, 0.94]),
            a('H', [0.815, -0.3, -0.47]),
            a('H', [-0.815, -0.3, -0.47]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [lp(0, [0, 1.0, 0])],
        description: 'Piramidal trigonal: 3 BP + 1 LP. Par isolado comprime ângulo de 109.5° para 107.3°.',
        dipoleMoment: true,
    },

    'PCl3': {
        formula: 'PCl₃', name: 'Phosphorus Trichloride', namePt: 'Tricloreto de Fósforo',
        geometry: 'trigonal-pyramidal', hybridization: 'sp3', bondAngle: '100.3°',
        bondingPairs: 3, lonePairs: 1,
        atoms: [
            a('P', [0, 0.4, 0]),
            a('Cl', [0, -0.35, 1.2]),
            a('Cl', [1.04, -0.35, -0.6]),
            a('Cl', [-1.04, -0.35, -0.6]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [lp(0, [0, 1.1, 0])],
        description: 'Piramidal trigonal com ângulo menor (100°) por orbitais d disponíveis no fósforo.',
        dipoleMoment: true,
    },

    'NF3': {
        formula: 'NF₃', name: 'Nitrogen Trifluoride', namePt: 'Trifluoreto de Nitrogênio',
        geometry: 'trigonal-pyramidal', hybridization: 'sp3', bondAngle: '102.2°',
        bondingPairs: 3, lonePairs: 1,
        atoms: [
            a('N', [0, 0.35, 0]),
            a('F', [0, -0.3, 1.0]),
            a('F', [0.87, -0.3, -0.5]),
            a('F', [-0.87, -0.3, -0.5]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [lp(0, [0, 1.0, 0])],
        description: 'Piramidal, mas quase apolar — dipolo do par isolado do N quase cancela os dipolos N-F.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TETRAHEDRAL (109.5°) — sp³
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'CH4': {
        formula: 'CH₄', name: 'Methane', namePt: 'Metano',
        geometry: 'tetrahedral', hybridization: 'sp3', bondAngle: '109.5°',
        bondingPairs: 4, lonePairs: 0,
        atoms: [
            a('C', [0, 0, 0]),
            a('H', [0.63, 0.63, 0.63]),
            a('H', [-0.63, -0.63, 0.63]),
            a('H', [0.63, -0.63, -0.63]),
            a('H', [-0.63, 0.63, -0.63]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [],
        description: 'Tetraédrico perfeito: 4 domínios idênticos, 109.5° entre cada par.',
        dipoleMoment: false,
    },

    'CCl4': {
        formula: 'CCl₄', name: 'Carbon Tetrachloride', namePt: 'Tetracloreto de Carbono',
        geometry: 'tetrahedral', hybridization: 'sp3', bondAngle: '109.5°',
        bondingPairs: 4, lonePairs: 0,
        atoms: [
            a('C', [0, 0, 0]),
            a('Cl', [0.75, 0.75, 0.75]),
            a('Cl', [-0.75, -0.75, 0.75]),
            a('Cl', [0.75, -0.75, -0.75]),
            a('Cl', [-0.75, 0.75, -0.75]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [],
        description: 'Tetraédrico perfeito e apolar: dipolos C-Cl se cancelam pela simetria.',
        dipoleMoment: false,
    },

    'SiH4': {
        formula: 'SiH₄', name: 'Silane', namePt: 'Silano',
        geometry: 'tetrahedral', hybridization: 'sp3', bondAngle: '109.5°',
        bondingPairs: 4, lonePairs: 0,
        atoms: [
            a('Si', [0, 0, 0]),
            a('H', [0.65, 0.65, 0.65]),
            a('H', [-0.65, -0.65, 0.65]),
            a('H', [0.65, -0.65, -0.65]),
            a('H', [-0.65, 0.65, -0.65]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [],
        description: 'Tetraédrico como metano. Silício forma 4 ligações covalentes com H.',
        dipoleMoment: false,
    },

    'CHCl3': {
        formula: 'CHCl₃', name: 'Chloroform', namePt: 'Clorofórmio',
        geometry: 'tetrahedral', hybridization: 'sp3', bondAngle: '~109.5°',
        bondingPairs: 4, lonePairs: 0,
        atoms: [
            a('C', [0, 0, 0]),
            a('H', [0, 0.9, 0]),
            a('Cl', [0.85, -0.35, 0]),
            a('Cl', [-0.42, -0.35, 0.74]),
            a('Cl', [-0.42, -0.35, -0.74]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [],
        description: 'Tetraédrico mas POLAR: a assimetria H vs 3×Cl gera momento dipolar líquido.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // T-SHAPED — sp³d
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'ClF3': {
        formula: 'ClF₃', name: 'Chlorine Trifluoride', namePt: 'Trifluoreto de Cloro',
        geometry: 't-shaped', hybridization: 'sp3d', bondAngle: '~87.5°',
        bondingPairs: 3, lonePairs: 2,
        atoms: [
            a('Cl', [0, 0, 0]),
            a('F', [0, 1.2, 0]),
            a('F', [0, -1.2, 0]),
            a('F', [1.2, 0, 0]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [
            lp(0, [-0.8, 0, 0.7]),
            lp(0, [-0.8, 0, -0.7]),
        ],
        description: 'Forma de T: 3 BP + 2 LP equatoriais. Os pares isolados ocupam posições equatoriais para minimizar repulsão.',
        dipoleMoment: true,
    },

    'BrF3': {
        formula: 'BrF₃', name: 'Bromine Trifluoride', namePt: 'Trifluoreto de Bromo',
        geometry: 't-shaped', hybridization: 'sp3d', bondAngle: '~86.2°',
        bondingPairs: 3, lonePairs: 2,
        atoms: [
            a('Br', [0, 0, 0]),
            a('F', [0, 1.3, 0]),
            a('F', [0, -1.3, 0]),
            a('F', [1.3, 0, 0]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3)],
        electronPairs: [
            lp(0, [-0.85, 0, 0.7]),
            lp(0, [-0.85, 0, -0.7]),
        ],
        description: 'Forma de T semelhante ao ClF₃. Bromo expande o octeto usando orbitais d.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SEESAW / GANGORRA — sp³d
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'SF4': {
        formula: 'SF₄', name: 'Sulfur Tetrafluoride', namePt: 'Tetrafluoreto de Enxofre',
        geometry: 'seesaw', hybridization: 'sp3d', bondAngle: '~90°/~120°',
        bondingPairs: 4, lonePairs: 1,
        atoms: [
            a('S', [0, 0, 0]),
            a('F', [0, 1.2, 0]),
            a('F', [0, -1.2, 0]),
            a('F', [1.0, 0, 0.5]),
            a('F', [1.0, 0, -0.5]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [lp(0, [-1.0, 0, 0])],
        description: 'Gangorra: 4 BP + 1 LP equatorial. Par isolado empurra ligações axiais para ~86°.',
        dipoleMoment: true,
    },

    'TeCl4': {
        formula: 'TeCl₄', name: 'Tellurium Tetrachloride', namePt: 'Tetracloreto de Telúrio',
        geometry: 'seesaw', hybridization: 'sp3d', bondAngle: '~90°/~120°',
        bondingPairs: 4, lonePairs: 1,
        atoms: [
            a('Te', [0, 0, 0]),
            a('Cl', [0, 1.3, 0]),
            a('Cl', [0, -1.3, 0]),
            a('Cl', [1.1, 0, 0.55]),
            a('Cl', [1.1, 0, -0.55]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [lp(0, [-1.0, 0, 0])],
        description: 'Gangorra como SF₄. Telúrio expande octeto com orbitais 5d.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRIGONAL BIPYRAMIDAL (90°/120°) — sp³d
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'PCl5': {
        formula: 'PCl₅', name: 'Phosphorus Pentachloride', namePt: 'Pentacloreto de Fósforo',
        geometry: 'trigonal-bipyramidal', hybridization: 'sp3d', bondAngle: '90°/120°',
        bondingPairs: 5, lonePairs: 0,
        atoms: [
            a('P', [0, 0, 0]),
            a('Cl', [0, 1.3, 0]),       // axial
            a('Cl', [0, -1.3, 0]),      // axial
            a('Cl', [1.1, 0, 0]),       // equatorial
            a('Cl', [-0.55, 0, 0.95]),  // equatorial
            a('Cl', [-0.55, 0, -0.95]), // equatorial
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5)],
        electronPairs: [],
        description: 'Bipirâmide trigonal: 3 equatoriais (120°) + 2 axiais (90° dos equatoriais).',
        dipoleMoment: false,
    },

    'PF5': {
        formula: 'PF₅', name: 'Phosphorus Pentafluoride', namePt: 'Pentafluoreto de Fósforo',
        geometry: 'trigonal-bipyramidal', hybridization: 'sp3d', bondAngle: '90°/120°',
        bondingPairs: 5, lonePairs: 0,
        atoms: [
            a('P', [0, 0, 0]),
            a('F', [0, 1.2, 0]),
            a('F', [0, -1.2, 0]),
            a('F', [1.0, 0, 0]),
            a('F', [-0.5, 0, 0.87]),
            a('F', [-0.5, 0, -0.87]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5)],
        electronPairs: [],
        description: 'Bipirâmide trigonal com 5 ligações P-F equivalentes em comprimento mas não em ângulo.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SQUARE PLANAR (90°) — sp³d²
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'XeF4': {
        formula: 'XeF₄', name: 'Xenon Tetrafluoride', namePt: 'Tetrafluoreto de Xenônio',
        geometry: 'square-planar', hybridization: 'sp3d2', bondAngle: '90°',
        bondingPairs: 4, lonePairs: 2,
        atoms: [
            a('Xe', [0, 0, 0]),
            a('F', [1.1, 0, 0]),
            a('F', [-1.1, 0, 0]),
            a('F', [0, 0, 1.1]),
            a('F', [0, 0, -1.1]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4)],
        electronPairs: [
            lp(0, [0, 1.0, 0]),
            lp(0, [0, -1.0, 0]),
        ],
        description: 'Quadrada planar: 4 BP + 2 LP axiais. Gás nobre com expansão do octeto.',
        dipoleMoment: false,
    },

    'XeF2': {
        formula: 'XeF₂', name: 'Xenon Difluoride', namePt: 'Difluoreto de Xenônio',
        geometry: 'linear', hybridization: 'sp3d', bondAngle: '180°',
        bondingPairs: 2, lonePairs: 3,
        atoms: [
            a('Xe', [0, 0, 0]),
            a('F', [0, 1.2, 0]),
            a('F', [0, -1.2, 0]),
        ],
        bonds: [b(0, 1), b(0, 2)],
        electronPairs: [
            lp(0, [0.9, 0, 0]),
            lp(0, [-0.45, 0, 0.78]),
            lp(0, [-0.45, 0, -0.78]),
        ],
        description: 'Linear com 3 pares isolados equatoriais. Domínios bipyramidal trigonal.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SQUARE PYRAMIDAL — sp³d²
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'BrF5': {
        formula: 'BrF₅', name: 'Bromine Pentafluoride', namePt: 'Pentafluoreto de Bromo',
        geometry: 'square-pyramidal', hybridization: 'sp3d2', bondAngle: '~84.8°',
        bondingPairs: 5, lonePairs: 1,
        atoms: [
            a('Br', [0, 0, 0]),
            a('F', [0, 1.2, 0]),         // apical
            a('F', [1.1, -0.2, 0]),      // base
            a('F', [-1.1, -0.2, 0]),
            a('F', [0, -0.2, 1.1]),
            a('F', [0, -0.2, -1.1]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5)],
        electronPairs: [lp(0, [0, -1.1, 0])],
        description: 'Piramidal de base quadrada: 5 BP + 1 LP oposto ao ápice.',
        dipoleMoment: true,
    },

    'IF5': {
        formula: 'IF₅', name: 'Iodine Pentafluoride', namePt: 'Pentafluoreto de Iodo',
        geometry: 'square-pyramidal', hybridization: 'sp3d2', bondAngle: '~82°',
        bondingPairs: 5, lonePairs: 1,
        atoms: [
            a('I', [0, 0, 0]),
            a('F', [0, 1.3, 0]),
            a('F', [1.15, -0.2, 0]),
            a('F', [-1.15, -0.2, 0]),
            a('F', [0, -0.2, 1.15]),
            a('F', [0, -0.2, -1.15]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5)],
        electronPairs: [lp(0, [0, -1.2, 0])],
        description: 'Piramidal de base quadrada como BrF₅. Par isolado comprime ângulos para ~82°.',
        dipoleMoment: true,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OCTAHEDRAL (90°) — sp³d²
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'SF6': {
        formula: 'SF₆', name: 'Sulfur Hexafluoride', namePt: 'Hexafluoreto de Enxofre',
        geometry: 'octahedral', hybridization: 'sp3d2', bondAngle: '90°',
        bondingPairs: 6, lonePairs: 0,
        atoms: [
            a('S', [0, 0, 0]),
            a('F', [1.2, 0, 0]),
            a('F', [-1.2, 0, 0]),
            a('F', [0, 1.2, 0]),
            a('F', [0, -1.2, 0]),
            a('F', [0, 0, 1.2]),
            a('F', [0, 0, -1.2]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5), b(0, 6)],
        electronPairs: [],
        description: 'Octaédrico perfeito: 6 ligações S-F a 90° entre si. Gás inerte e denso.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PENTAGONAL BIPYRAMIDAL — sp³d³
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'IF7': {
        formula: 'IF₇', name: 'Iodine Heptafluoride', namePt: 'Heptafluoreto de Iodo',
        geometry: 'pentagonal-bipyramidal', hybridization: 'sp3d3', bondAngle: '72°/90°',
        bondingPairs: 7, lonePairs: 0,
        atoms: [
            a('I', [0, 0, 0]),
            a('F', [0, 1.3, 0]),                             // axial top
            a('F', [0, -1.3, 0]),                            // axial bottom
            a('F', [1.2, 0, 0]),                             // equatorial 1
            a('F', [0.37, 0, 1.14]),                         // equatorial 2
            a('F', [-0.97, 0, 0.71]),                        // equatorial 3
            a('F', [-0.97, 0, -0.71]),                       // equatorial 4
            a('F', [0.37, 0, -1.14]),                        // equatorial 5
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4), b(0, 5), b(0, 6), b(0, 7)],
        electronPairs: [],
        description: 'Bipirâmide pentagonal: 5 equatoriais (72°) + 2 axiais (90°). Raro na natureza.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MOLÉCULAS COMUNS EXTRAS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'HCl': {
        formula: 'HCl', name: 'Hydrogen Chloride', namePt: 'Ácido Clorídrico',
        geometry: 'linear', hybridization: 'sp3', bondAngle: '—',
        bondingPairs: 1, lonePairs: 3,
        atoms: [a('H', [-0.6, 0, 0]), a('Cl', [0.6, 0, 0])],
        bonds: [b(0, 1)],
        electronPairs: [
            lp(1, [1.2, 0.5, 0]),
            lp(1, [1.2, -0.3, 0.4]),
            lp(1, [1.2, -0.3, -0.4]),
        ],
        description: 'Molécula diatômica polar. Cl com 3 pares isolados.',
        dipoleMoment: true,
    },

    'NaCl': {
        formula: 'NaCl', name: 'Sodium Chloride', namePt: 'Cloreto de Sódio',
        geometry: 'linear', hybridization: 'sp', bondAngle: '—',
        bondingPairs: 1, lonePairs: 0,
        atoms: [a('Na', [-0.6, 0, 0]), a('Cl', [0.6, 0, 0])],
        bonds: [b(0, 1, 'ionic')],
        electronPairs: [],
        description: 'Ligação iônica: Na⁺ transfere 1 elétron ao Cl⁻. Forma cristal cúbico.',
        dipoleMoment: true,
    },

    'H2': {
        formula: 'H₂', name: 'Hydrogen', namePt: 'Hidrogênio',
        geometry: 'linear', hybridization: 'sp', bondAngle: '—',
        bondingPairs: 1, lonePairs: 0,
        atoms: [a('H', [-0.37, 0, 0]), a('H', [0.37, 0, 0])],
        bonds: [b(0, 1)],
        electronPairs: [],
        description: 'A molécula mais simples do universo. Ligação covalente pura apolar.',
        dipoleMoment: false,
    },

    'O2': {
        formula: 'O₂', name: 'Oxygen', namePt: 'Oxigênio',
        geometry: 'linear', hybridization: 'sp2', bondAngle: '—',
        bondingPairs: 1, lonePairs: 2,
        atoms: [a('O', [-0.5, 0, 0]), a('O', [0.5, 0, 0])],
        bonds: [b(0, 1, 'double')],
        electronPairs: [
            lp(0, [-1.0, 0.4, 0]),
            lp(1, [1.0, -0.4, 0]),
        ],
        description: 'Ligação dupla O=O. Paramagnético (2 elétrons desemparelhados em π*).',
        dipoleMoment: false,
    },

    'N2': {
        formula: 'N₂', name: 'Nitrogen', namePt: 'Nitrogênio',
        geometry: 'linear', hybridization: 'sp', bondAngle: '—',
        bondingPairs: 1, lonePairs: 1,
        atoms: [a('N', [-0.55, 0, 0]), a('N', [0.55, 0, 0])],
        bonds: [b(0, 1, 'triple')],
        electronPairs: [
            lp(0, [-1.1, 0, 0]),
            lp(1, [1.1, 0, 0]),
        ],
        description: 'Ligação tripla N≡N (945 kJ/mol). Uma das mais fortes da natureza.',
        dipoleMoment: false,
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LEVEL 2: RESSONÂNCIA, DATIVA, EXPANSÃO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    'C6H6': {
        formula: 'C₆H₆', name: 'Benzene', namePt: 'Benzeno',
        geometry: 'trigonal-planar', hybridization: 'sp2', bondAngle: '120°',
        bondingPairs: 6, lonePairs: 0,
        atoms: [
            a('C', [1.2, 0, 0]),    // 0
            a('C', [0.6, 0, 1.04]), // 1
            a('C', [-0.6, 0, 1.04]),// 2
            a('C', [-1.2, 0, 0]),   // 3
            a('C', [-0.6, 0, -1.04]),//4
            a('C', [0.6, 0, -1.04]),// 5
            a('H', [2.1, 0, 0]),    // 6
            a('H', [1.05, 0, 1.82]),// 7
            a('H', [-1.05, 0, 1.82]),//8
            a('H', [-2.1, 0, 0]),   // 9
            a('H', [-1.05, 0, -1.82]),//10
            a('H', [1.05, 0, -1.82]),// 11
        ],
        bonds: [b(0,1,'double'), b(1,2), b(2,3,'double'), b(3,4), b(4,5,'double'), b(5,0),
                b(0,6), b(1,7), b(2,8), b(3,9), b(4,10), b(5,11)],
        electronPairs: [],
        description: 'Anel aromático com 6 carbonos sp². Estrutura ressonante: ligações duplas alternadas se deslocam formando nuvem π contínua.',
        dipoleMoment: false,
        resonance: [
            { bonds: [b(0,1,'double'), b(1,2), b(2,3,'double'), b(3,4), b(4,5,'double'), b(5,0), b(0,6), b(1,7), b(2,8), b(3,9), b(4,10), b(5,11)], label: 'Kekulé I' },
            { bonds: [b(0,1), b(1,2,'double'), b(2,3), b(3,4,'double'), b(4,5), b(5,0,'double'), b(0,6), b(1,7), b(2,8), b(3,9), b(4,10), b(5,11)], label: 'Kekulé II' },
        ],
    },

    'NH4+': {
        formula: 'NH₄⁺', name: 'Ammonium', namePt: 'Amônio',
        geometry: 'tetrahedral', hybridization: 'sp3', bondAngle: '109.5°',
        bondingPairs: 4, lonePairs: 0,
        atoms: [
            a('N', [0, 0, 0]),
            a('H', [0.63, 0.63, 0.63]),
            a('H', [-0.63, -0.63, 0.63]),
            a('H', [0.63, -0.63, -0.63]),
            a('H', [-0.63, 0.63, -0.63]),
        ],
        bonds: [b(0, 1), b(0, 2), b(0, 3), b(0, 4, 'dative')],
        electronPairs: [],
        description: 'Íon amônio: NH₃ doa par de elétrons a H⁺ formando ligação coordenada/dativa.',
        dipoleMoment: false,
        formalCharges: { 0: +1 },  // N tem carga formal +1
        dativeBonds: [3],
    },

    'CO': {
        formula: 'CO', name: 'Carbon Monoxide', namePt: 'Monóxido de Carbono',
        geometry: 'linear', hybridization: 'sp', bondAngle: '180°',
        bondingPairs: 1, lonePairs: 1,
        atoms: [a('C', [-0.56, 0, 0]), a('O', [0.56, 0, 0])],
        bonds: [b(0, 1, 'triple')],
        electronPairs: [lp(0, [-1.1, 0, 0]), lp(1, [1.1, 0, 0])],
        description: 'Ligação tripla C≡O com caráter dativo: O doa par para C. Cargas formais: C⁻ O⁺.',
        dipoleMoment: true,
        formalCharges: { 0: -1, 1: +1 },
        dativeBonds: [0],
    },

    'PCl5_expanded': {
        formula: 'PCl₅', name: 'Phosphorus Pentachloride (Expanded)', namePt: 'PCl₅ (Expansão)',
        geometry: 'trigonal-bipyramidal', hybridization: 'sp3d', bondAngle: '90°/120°',
        bondingPairs: 5, lonePairs: 0,
        atoms: [
            a('P', [0, 0, 0]),
            a('Cl', [0, 1.3, 0]), a('Cl', [0, -1.3, 0]),
            a('Cl', [1.1, 0, 0]), a('Cl', [-0.55, 0, 0.95]), a('Cl', [-0.55, 0, -0.95]),
        ],
        bonds: [b(0,1), b(0,2), b(0,3), b(0,4), b(0,5)],
        electronPairs: [],
        description: 'P expande o octeto usando orbitais 3d. 10 elétrons ao redor do P.',
        dipoleMoment: false,
        octetExpansion: true,
    },
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════

/** Retorna todas as fórmulas disponíveis */
export function getAvailableMolecules(): string[] {
    return Object.keys(VSEPR_MOLECULES)
}

/** Busca molécula pelo nome de busca (fórmula sem subscrito) */
export function findMolecule(query: string): VSEPRMolecule | undefined {
    const upper = query.toUpperCase().replace(/[₂₃₄₅₆₇]/g, (c) => {
        const map: Record<string, string> = { '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7' }
        return map[c] || c
    })
    return VSEPR_MOLECULES[query] || Object.values(VSEPR_MOLECULES).find(
        m => m.formula.toUpperCase().replace(/[₂₃₄₅₆₇]/g, (c) => {
            const map: Record<string, string> = { '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7' }
            return map[c] || c
        }) === upper
    )
}

/** Geometrias agrupadas por tipo de domínio eletrônico */
export const GEOMETRY_INFO: Record<VSEPRGeometry, { namePt: string; electronDomains: number; icon: string }> = {
    'linear':                  { namePt: 'Linear',                      electronDomains: 2, icon: '━' },
    'bent':                    { namePt: 'Angular (Curvada)',           electronDomains: 3, icon: '∠' },
    'trigonal-planar':         { namePt: 'Trigonal Planar',             electronDomains: 3, icon: '△' },
    'trigonal-pyramidal':      { namePt: 'Piramidal Trigonal',          electronDomains: 4, icon: '▲' },
    'tetrahedral':             { namePt: 'Tetraédrica',                 electronDomains: 4, icon: '◆' },
    't-shaped':                { namePt: 'Forma de T',                  electronDomains: 5, icon: '⊤' },
    'seesaw':                  { namePt: 'Gangorra (Seesaw)',           electronDomains: 5, icon: '⚖' },
    'trigonal-bipyramidal':    { namePt: 'Bipirâmide Trigonal',         electronDomains: 5, icon: '⬠' },
    'square-planar':           { namePt: 'Quadrada Planar',             electronDomains: 6, icon: '□' },
    'square-pyramidal':        { namePt: 'Pirâmide de Base Quadrada',   electronDomains: 6, icon: '⊿' },
    'octahedral':              { namePt: 'Octaédrica',                  electronDomains: 6, icon: '⬡' },
    'pentagonal-bipyramidal':  { namePt: 'Bipirâmide Pentagonal',       electronDomains: 7, icon: '⬟' },
}

// ═══════════════════════════════════════════════════════════════════════
// HYBRIDIZATION PROMOTION DATA
// ═══════════════════════════════════════════════════════════════════════

export interface HybridizationLevel {
    type: Hybridization
    orbitals: { name: string; electrons: number; maxElectrons: number }[]
    totalOrbitals: number
    geometryPt: string
    bondAngle: string
    promotionEnergy: string  // Qualitative
    examples: string[]
}

export const HYBRIDIZATION_DATA: HybridizationLevel[] = [
    { type: 'sp', orbitals: [{ name: '2s', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }], totalOrbitals: 2, geometryPt: 'Linear', bondAngle: '180°', promotionEnergy: 'Baixa', examples: ['BeCl₂', 'CO₂', 'C₂H₂'] },
    { type: 'sp2', orbitals: [{ name: '2s', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }], totalOrbitals: 3, geometryPt: 'Trigonal Planar', bondAngle: '120°', promotionEnergy: 'Média-baixa', examples: ['BF₃', 'C₂H₄', 'C₆H₆'] },
    { type: 'sp3', orbitals: [{ name: '2s', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }, { name: '2p', electrons: 1, maxElectrons: 2 }], totalOrbitals: 4, geometryPt: 'Tetraédrica', bondAngle: '109.5°', promotionEnergy: 'Média', examples: ['CH₄', 'NH₃', 'H₂O'] },
    { type: 'sp3d', orbitals: [{ name: '3s', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }], totalOrbitals: 5, geometryPt: 'Bipirâmide Trigonal', bondAngle: '90°/120°', promotionEnergy: 'Alta', examples: ['PCl₅', 'SF₄', 'ClF₃'] },
    { type: 'sp3d2', orbitals: [{ name: '3s', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }], totalOrbitals: 6, geometryPt: 'Octaédrica', bondAngle: '90°', promotionEnergy: 'Muito alta', examples: ['SF₆', 'XeF₄', 'BrF₅'] },
    { type: 'sp3d3', orbitals: [{ name: '3s', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3p', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }, { name: '3d', electrons: 1, maxElectrons: 2 }], totalOrbitals: 7, geometryPt: 'Bipirâmide Pentagonal', bondAngle: '72°/90°', promotionEnergy: 'Extremamente alta', examples: ['IF₇'] },
]

// ═══════════════════════════════════════════════════════════════════════
// FORMAL CHARGE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════

const VALENCE_ELECTRONS: Record<string, number> = {
    H: 1, He: 2, C: 4, N: 5, O: 6, F: 7, P: 5, S: 6, Cl: 7, Br: 7, I: 7,
    B: 3, Be: 2, Si: 4, Se: 6, Te: 6, Xe: 8, Na: 1, K: 1, Li: 1,
}

export function calculateFormalCharge(molecule: VSEPRMolecule, atomIndex: number): number {
    const atom = molecule.atoms[atomIndex]
    const V = VALENCE_ELECTRONS[atom.symbol] ?? 0
    const L = molecule.electronPairs.filter(p => p.atomIndex === atomIndex).length * 2
    const B = molecule.bonds.filter(bd => bd.from === atomIndex || bd.to === atomIndex)
        .reduce((sum, bd) => sum + (bd.type === 'double' ? 2 : bd.type === 'triple' ? 3 : 1), 0)
    return V - L - B
}
