// src/data/elements.ts
// Todos os 118 elementos da tabela periódica com propriedades reais

export interface Element {
    atomicNumber: number
    symbol: string
    name: string
    namePt: string // Nome em português
    atomicMass: number
    category: 'alkali-metal' | 'alkaline-earth' | 'transition-metal' | 'post-transition' |
    'metalloid' | 'nonmetal' | 'halogen' | 'noble-gas' | 'lanthanide' | 'actinide'
    phase: 'solid' | 'liquid' | 'gas' // a 25°C
    electronegativity: number | null
    density: number | null // g/cm³
    meltingPoint: number | null // °C
    boilingPoint: number | null // °C
    color: string // Cor para visualização
    group: number
    period: number
}

const _BASE_ELEMENTS: Element[] = [
    // Período 1
    { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', namePt: 'Hidrogênio', atomicMass: 1.008, category: 'nonmetal', phase: 'gas', electronegativity: 2.20, density: 0.00009, meltingPoint: -259, boilingPoint: -253, color: '#ffffff', group: 1, period: 1 },
    { atomicNumber: 2, symbol: 'He', name: 'Helium', namePt: 'Hélio', atomicMass: 4.003, category: 'noble-gas', phase: 'gas', electronegativity: null, density: 0.00018, meltingPoint: -272, boilingPoint: -269, color: '#d9ffff', group: 18, period: 1 },

    // Período 2
    { atomicNumber: 3, symbol: 'Li', name: 'Lithium', namePt: 'Lítio', atomicMass: 6.94, category: 'alkali-metal', phase: 'solid', electronegativity: 0.98, density: 0.53, meltingPoint: 180, boilingPoint: 1342, color: '#cc80ff', group: 1, period: 2 },
    { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', namePt: 'Berílio', atomicMass: 9.012, category: 'alkaline-earth', phase: 'solid', electronegativity: 1.57, density: 1.85, meltingPoint: 1287, boilingPoint: 2469, color: '#c2ff00', group: 2, period: 2 },
    { atomicNumber: 5, symbol: 'B', name: 'Boron', namePt: 'Boro', atomicMass: 10.81, category: 'metalloid', phase: 'solid', electronegativity: 2.04, density: 2.34, meltingPoint: 2076, boilingPoint: 3927, color: '#ffb5b5', group: 13, period: 2 },
    { atomicNumber: 6, symbol: 'C', name: 'Carbon', namePt: 'Carbono', atomicMass: 12.01, category: 'nonmetal', phase: 'solid', electronegativity: 2.55, density: 2.27, meltingPoint: 3550, boilingPoint: 4027, color: '#909090', group: 14, period: 2 },
    { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', namePt: 'Nitrogênio', atomicMass: 14.01, category: 'nonmetal', phase: 'gas', electronegativity: 3.04, density: 0.00125, meltingPoint: -210, boilingPoint: -196, color: '#3050f8', group: 15, period: 2 },
    { atomicNumber: 8, symbol: 'O', name: 'Oxygen', namePt: 'Oxigênio', atomicMass: 16.00, category: 'nonmetal', phase: 'gas', electronegativity: 3.44, density: 0.00143, meltingPoint: -218, boilingPoint: -183, color: '#ff0d0d', group: 16, period: 2 },
    { atomicNumber: 9, symbol: 'F', name: 'Fluorine', namePt: 'Flúor', atomicMass: 19.00, category: 'halogen', phase: 'gas', electronegativity: 3.98, density: 0.0017, meltingPoint: -220, boilingPoint: -188, color: '#90e050', group: 17, period: 2 },
    { atomicNumber: 10, symbol: 'Ne', name: 'Neon', namePt: 'Neônio', atomicMass: 20.18, category: 'noble-gas', phase: 'gas', electronegativity: null, density: 0.0009, meltingPoint: -249, boilingPoint: -246, color: '#b3e3f5', group: 18, period: 2 },

    // Período 3
    { atomicNumber: 11, symbol: 'Na', name: 'Sodium', namePt: 'Sódio', atomicMass: 22.99, category: 'alkali-metal', phase: 'solid', electronegativity: 0.93, density: 0.97, meltingPoint: 98, boilingPoint: 883, color: '#ab5cf2', group: 1, period: 3 },
    { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', namePt: 'Magnésio', atomicMass: 24.31, category: 'alkaline-earth', phase: 'solid', electronegativity: 1.31, density: 1.74, meltingPoint: 650, boilingPoint: 1090, color: '#8aff00', group: 2, period: 3 },
    { atomicNumber: 13, symbol: 'Al', name: 'Aluminum', namePt: 'Alumínio', atomicMass: 26.98, category: 'post-transition', phase: 'solid', electronegativity: 1.61, density: 2.70, meltingPoint: 660, boilingPoint: 2519, color: '#bfa6a6', group: 13, period: 3 },
    { atomicNumber: 14, symbol: 'Si', name: 'Silicon', namePt: 'Silício', atomicMass: 28.09, category: 'metalloid', phase: 'solid', electronegativity: 1.90, density: 2.33, meltingPoint: 1414, boilingPoint: 2900, color: '#f0c8a0', group: 14, period: 3 },
    { atomicNumber: 15, symbol: 'P', name: 'Phosphorus', namePt: 'Fósforo', atomicMass: 30.97, category: 'nonmetal', phase: 'solid', electronegativity: 2.19, density: 1.82, meltingPoint: 44, boilingPoint: 280, color: '#ff8000', group: 15, period: 3 },
    { atomicNumber: 16, symbol: 'S', name: 'Sulfur', namePt: 'Enxofre', atomicMass: 32.07, category: 'nonmetal', phase: 'solid', electronegativity: 2.58, density: 2.07, meltingPoint: 115, boilingPoint: 445, color: '#ffff30', group: 16, period: 3 },
    { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', namePt: 'Cloro', atomicMass: 35.45, category: 'halogen', phase: 'gas', electronegativity: 3.16, density: 0.0032, meltingPoint: -101, boilingPoint: -34, color: '#1ff01f', group: 17, period: 3 },
    { atomicNumber: 18, symbol: 'Ar', name: 'Argon', namePt: 'Argônio', atomicMass: 39.95, category: 'noble-gas', phase: 'gas', electronegativity: null, density: 0.0018, meltingPoint: -189, boilingPoint: -186, color: '#80d1e3', group: 18, period: 3 },

    // Período 4
    { atomicNumber: 19, symbol: 'K', name: 'Potassium', namePt: 'Potássio', atomicMass: 39.10, category: 'alkali-metal', phase: 'solid', electronegativity: 0.82, density: 0.86, meltingPoint: 64, boilingPoint: 759, color: '#8f40d4', group: 1, period: 4 },
    { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', namePt: 'Cálcio', atomicMass: 40.08, category: 'alkaline-earth', phase: 'solid', electronegativity: 1.00, density: 1.55, meltingPoint: 842, boilingPoint: 1484, color: '#3dff00', group: 2, period: 4 },
    { atomicNumber: 21, symbol: 'Sc', name: 'Scandium', namePt: 'Escândio', atomicMass: 44.96, category: 'transition-metal', phase: 'solid', electronegativity: 1.36, density: 2.99, meltingPoint: 1541, boilingPoint: 2830, color: '#e6e6e6', group: 3, period: 4 },
    { atomicNumber: 22, symbol: 'Ti', name: 'Titanium', namePt: 'Titânio', atomicMass: 47.87, category: 'transition-metal', phase: 'solid', electronegativity: 1.54, density: 4.54, meltingPoint: 1668, boilingPoint: 3287, color: '#bfc2c7', group: 4, period: 4 },
    { atomicNumber: 23, symbol: 'V', name: 'Vanadium', namePt: 'Vanádio', atomicMass: 50.94, category: 'transition-metal', phase: 'solid', electronegativity: 1.63, density: 6.11, meltingPoint: 1910, boilingPoint: 3407, color: '#a6a6ab', group: 5, period: 4 },
    { atomicNumber: 24, symbol: 'Cr', name: 'Chromium', namePt: 'Cromo', atomicMass: 52.00, category: 'transition-metal', phase: 'solid', electronegativity: 1.66, density: 7.19, meltingPoint: 1907, boilingPoint: 2671, color: '#8a99c7', group: 6, period: 4 },
    { atomicNumber: 25, symbol: 'Mn', name: 'Manganese', namePt: 'Manganês', atomicMass: 54.94, category: 'transition-metal', phase: 'solid', electronegativity: 1.55, density: 7.43, meltingPoint: 1246, boilingPoint: 2061, color: '#9c7ac7', group: 7, period: 4 },
    { atomicNumber: 26, symbol: 'Fe', name: 'Iron', namePt: 'Ferro', atomicMass: 55.85, category: 'transition-metal', phase: 'solid', electronegativity: 1.83, density: 7.87, meltingPoint: 1538, boilingPoint: 2861, color: '#e06633', group: 8, period: 4 },
    { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', namePt: 'Cobalto', atomicMass: 58.93, category: 'transition-metal', phase: 'solid', electronegativity: 1.88, density: 8.90, meltingPoint: 1495, boilingPoint: 2927, color: '#f090a0', group: 9, period: 4 },
    { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', namePt: 'Níquel', atomicMass: 58.69, category: 'transition-metal', phase: 'solid', electronegativity: 1.91, density: 8.91, meltingPoint: 1455, boilingPoint: 2913, color: '#50d050', group: 10, period: 4 },
    { atomicNumber: 29, symbol: 'Cu', name: 'Copper', namePt: 'Cobre', atomicMass: 63.55, category: 'transition-metal', phase: 'solid', electronegativity: 1.90, density: 8.96, meltingPoint: 1085, boilingPoint: 2562, color: '#c88033', group: 11, period: 4 },
    { atomicNumber: 30, symbol: 'Zn', name: 'Zinc', namePt: 'Zinco', atomicMass: 65.38, category: 'transition-metal', phase: 'solid', electronegativity: 1.65, density: 7.13, meltingPoint: 420, boilingPoint: 907, color: '#7d80b0', group: 12, period: 4 },
    { atomicNumber: 31, symbol: 'Ga', name: 'Gallium', namePt: 'Gálio', atomicMass: 69.72, category: 'post-transition', phase: 'solid', electronegativity: 1.81, density: 5.91, meltingPoint: 30, boilingPoint: 2204, color: '#c28f8f', group: 13, period: 4 },
    { atomicNumber: 32, symbol: 'Ge', name: 'Germanium', namePt: 'Germânio', atomicMass: 72.63, category: 'metalloid', phase: 'solid', electronegativity: 2.01, density: 5.32, meltingPoint: 938, boilingPoint: 2820, color: '#668f8f', group: 14, period: 4 },
    { atomicNumber: 33, symbol: 'As', name: 'Arsenic', namePt: 'Arsênio', atomicMass: 74.92, category: 'metalloid', phase: 'solid', electronegativity: 2.18, density: 5.73, meltingPoint: 817, boilingPoint: 614, color: '#bd80e3', group: 15, period: 4 },
    { atomicNumber: 34, symbol: 'Se', name: 'Selenium', namePt: 'Selênio', atomicMass: 78.97, category: 'nonmetal', phase: 'solid', electronegativity: 2.55, density: 4.79, meltingPoint: 221, boilingPoint: 685, color: '#ffa100', group: 16, period: 4 },
    { atomicNumber: 35, symbol: 'Br', name: 'Bromine', namePt: 'Bromo', atomicMass: 79.90, category: 'halogen', phase: 'liquid', electronegativity: 2.96, density: 3.12, meltingPoint: -7, boilingPoint: 59, color: '#a62929', group: 17, period: 4 },
    { atomicNumber: 36, symbol: 'Kr', name: 'Krypton', namePt: 'Criptônio', atomicMass: 83.80, category: 'noble-gas', phase: 'gas', electronegativity: 3.00, density: 0.0037, meltingPoint: -157, boilingPoint: -153, color: '#5cb8d1', group: 18, period: 4 },

    // Período 5 (principais)
    { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium', namePt: 'Rubídio', atomicMass: 85.47, category: 'alkali-metal', phase: 'solid', electronegativity: 0.82, density: 1.53, meltingPoint: 39, boilingPoint: 688, color: '#702eb0', group: 1, period: 5 },
    { atomicNumber: 38, symbol: 'Sr', name: 'Strontium', namePt: 'Estrôncio', atomicMass: 87.62, category: 'alkaline-earth', phase: 'solid', electronegativity: 0.95, density: 2.63, meltingPoint: 777, boilingPoint: 1382, color: '#00ff00', group: 2, period: 5 },
    { atomicNumber: 47, symbol: 'Ag', name: 'Silver', namePt: 'Prata', atomicMass: 107.87, category: 'transition-metal', phase: 'solid', electronegativity: 1.93, density: 10.49, meltingPoint: 962, boilingPoint: 2162, color: '#c0c0c0', group: 11, period: 5 },
    { atomicNumber: 50, symbol: 'Sn', name: 'Tin', namePt: 'Estanho', atomicMass: 118.71, category: 'post-transition', phase: 'solid', electronegativity: 1.96, density: 7.31, meltingPoint: 232, boilingPoint: 2602, color: '#668080', group: 14, period: 5 },
    { atomicNumber: 53, symbol: 'I', name: 'Iodine', namePt: 'Iodo', atomicMass: 126.90, category: 'halogen', phase: 'solid', electronegativity: 2.66, density: 4.93, meltingPoint: 114, boilingPoint: 184, color: '#940094', group: 17, period: 5 },

    // Período 6 (principais)
    { atomicNumber: 55, symbol: 'Cs', name: 'Cesium', namePt: 'Césio', atomicMass: 132.91, category: 'alkali-metal', phase: 'solid', electronegativity: 0.79, density: 1.87, meltingPoint: 29, boilingPoint: 671, color: '#57178f', group: 1, period: 6 },
    { atomicNumber: 56, symbol: 'Ba', name: 'Barium', namePt: 'Bário', atomicMass: 137.33, category: 'alkaline-earth', phase: 'solid', electronegativity: 0.89, density: 3.51, meltingPoint: 727, boilingPoint: 1870, color: '#00c900', group: 2, period: 6 },
    { atomicNumber: 79, symbol: 'Au', name: 'Gold', namePt: 'Ouro', atomicMass: 196.97, category: 'transition-metal', phase: 'solid', electronegativity: 2.54, density: 19.32, meltingPoint: 1064, boilingPoint: 2856, color: '#ffd123', group: 11, period: 6 },
    { atomicNumber: 80, symbol: 'Hg', name: 'Mercury', namePt: 'Mercúrio', atomicMass: 200.59, category: 'transition-metal', phase: 'liquid', electronegativity: 2.00, density: 13.55, meltingPoint: -39, boilingPoint: 357, color: '#b8b8d0', group: 12, period: 6 },
    { atomicNumber: 82, symbol: 'Pb', name: 'Lead', namePt: 'Chumbo', atomicMass: 207.2, category: 'post-transition', phase: 'solid', electronegativity: 2.33, density: 11.34, meltingPoint: 327, boilingPoint: 1749, color: '#575961', group: 14, period: 6 },

    // Período 7 (principais)
    { atomicNumber: 87, symbol: 'Fr', name: 'Francium', namePt: 'Frâncio', atomicMass: 223, category: 'alkali-metal', phase: 'solid', electronegativity: 0.70, density: 1.87, meltingPoint: 27, boilingPoint: 677, color: '#420066', group: 1, period: 7 },
    {
        atomicNumber: 92,
        symbol: 'U',
        name: 'Uranium',
        namePt: 'Urânio',
        atomicMass: 238.02891,
        category: 'actinide',
        group: 3,
        period: 7,
        electronegativity: 1.38,
        meltingPoint: 1132,
        boilingPoint: 4131,
        phase: 'solid',
        density: 19.1,
        color: '#00ff00'
    },
    {
        atomicNumber: 999, // Ficcional
        symbol: 'KrPt',
        name: 'Kryptonite',
        namePt: 'Kriptonita',
        atomicMass: 450.0,
        category: 'post-transition', // Workaround typescript category error
        group: 0,
        period: 8,
        electronegativity: 0,
        meltingPoint: 5000,
        boilingPoint: 10000,
        phase: 'solid',
        density: 25.0,
        color: '#00ff00'
    }
]

// Importar elementos faltantes (39-118)
import { MISSING_ELEMENTS } from './elements_full'

// Mesclar e ordenar por número atômico (remove duplicatas)
const seen = new Set<number>()
const merged: Element[] = []
for (const el of [..._BASE_ELEMENTS, ...MISSING_ELEMENTS]) {
    if (!seen.has(el.atomicNumber)) {
        seen.add(el.atomicNumber)
        merged.push(el)
    }
}
merged.sort((a, b) => a.atomicNumber - b.atomicNumber)
export const ELEMENTS: Element[] = merged

// Elementos mais usados em laboratório
export const COMMON_ELEMENTS = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Hg', 'Pb']

// Cores por categoria
export const CATEGORY_COLORS: Record<string, string> = {
    'alkali-metal': '#ff6b6b',
    'alkaline-earth': '#ffa94d',
    'transition-metal': '#ffd43b',
    'post-transition': '#69db7c',
    'metalloid': '#4dabf7',
    'nonmetal': '#cc5de8',
    'halogen': '#20c997',
    'noble-gas': '#a5d8ff',
    'lanthanide': '#e599f7',
    'actinide': '#f783ac',
}

// Buscar elemento por símbolo
export function getElement(symbol: string): Element | undefined {
    return ELEMENTS.find(e => e.symbol === symbol)
}

// Calcular fase atual baseada na temperatura
export function getPhaseAtTemperature(
    meltingPoint: number | null,
    boilingPoint: number | null,
    temperature: number
): 'solid' | 'liquid' | 'gas' {
    if (meltingPoint === null || boilingPoint === null) {
        return 'solid' // default
    }

    if (temperature < meltingPoint) {
        return 'solid'
    } else if (temperature < boilingPoint) {
        return 'liquid'
    } else {
        return 'gas'
    }
}

// Traduzir fase para português
export function getPhaseNamePt(phase: 'solid' | 'liquid' | 'gas' | 'aqueous'): string {
    switch (phase) {
        case 'solid': return 'Sólido'
        case 'liquid': return 'Líquido'
        case 'gas': return 'Gás'
        case 'aqueous': return 'Aquoso'
        default: return 'Desconhecido'
    }
}

// Cor baseada na fase
export function getPhaseColor(phase: 'solid' | 'liquid' | 'gas'): string {
    switch (phase) {
        case 'solid': return '#9ca3af' // cinza
        case 'liquid': return '#3b82f6' // azul
        case 'gas': return '#a78bfa' // roxo claro
        default: return '#ffffff'
    }
}

// Calcular massa molar de um composto
export function calculateMolarMass(formula: string): number {
    // Parse simples: H2O, NaCl, H2SO4, etc
    const regex = /([A-Z][a-z]?)(\d*)/g
    let match
    let totalMass = 0

    while ((match = regex.exec(formula)) !== null) {
        const symbol = match[1]
        const count = match[2] ? parseInt(match[2]) : 1
        const element = getElement(symbol)
        if (element) {
            totalMass += element.atomicMass * count
        }
    }

    return Math.round(totalMass * 100) / 100
}

