// src/physics/NamingEngine.ts
// ═══════════════════════════════════════════════════════════════════════
// 🏷️ GERADOR DE NOMENCLATURA IUPAC
// Tenta deduzir o nome oficial em português de uma molécula a partir da
// sua fórmula química bruta usando heurísticas.
// ═══════════════════════════════════════════════════════════════════════

import { MolecularCalculator } from './MolecularCalculator';

const ANION_ROOTS: Record<string, string> = {
    'F': 'Fluoreto',
    'Cl': 'Cloreto',
    'Br': 'Brometo',
    'I': 'Iodeto',
    'S': 'Sulfeto',
    'N': 'Nitreto',
    'P': 'Fosfeto',
    'C': 'Carbeto',
    'O': 'Óxido',
};

const POLYATOMIC_IONS: Record<string, { name: string, charge: number, acidName: string }> = {
    'OH': { name: 'Hidróxido', charge: -1, acidName: 'Água' }, // Hehe
    'SO4': { name: 'Sulfato', charge: -2, acidName: 'Sulfúrico' },
    'SO3': { name: 'Sulfito', charge: -2, acidName: 'Sulfuroso' },
    'NO3': { name: 'Nitrato', charge: -1, acidName: 'Nítrico' },
    'NO2': { name: 'Nitrito', charge: -1, acidName: 'Nitroso' },
    'CO3': { name: 'Carbonato', charge: -2, acidName: 'Carbônico' },
    'HCO3': { name: 'Bicarbonato', charge: -1, acidName: '...' },
    'PO4': { name: 'Fosfato', charge: -3, acidName: 'Fosfórico' },
    'PO3': { name: 'Fosfito', charge: -3, acidName: 'Fosforoso' },
    'CN': { name: 'Cianeto', charge: -1, acidName: 'Cianídrico' },
    'CH3COO': { name: 'Acetato', charge: -1, acidName: 'Acético' },
    'MnO4': { name: 'Permanganato', charge: -1, acidName: 'Permangânico' },
    'CrO4': { name: 'Cromato', charge: -2, acidName: 'Crômico' },
    'Cr2O7': { name: 'Dicromato', charge: -2, acidName: 'Dicrômico' },
    'ClO3': { name: 'Clorato', charge: -1, acidName: 'Clórico' },
    'ClO4': { name: 'Perclorato', charge: -1, acidName: 'Perclórico' },
};

// Metais de transição comuns que exigem algarismo romano
const TRANSITION_METALS = ['Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Hg', 'Ni', 'Co', 'Mn', 'Cr', 'Ti', 'V', 'Pt', 'Pd'];

function toRoman(num: number): string {
    const lookup: [string, number][] = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    let roman = '';
    for (let i = 0; i < lookup.length; i++) {
        while (num >= lookup[i][1]) {
            roman += lookup[i][0];
            num -= lookup[i][1];
        }
    }
    return roman;
}

export class NamingEngine {
    
    /**
     * Tenta gerar um nome em português para a fórmula.
     */
    static generateName(formula: string): string {
        // Exceções conhecidas
        if (formula === 'H2O') return 'Água';
        if (formula === 'CO2') return 'Dióxido de Carbono';
        if (formula === 'CO') return 'Monóxido de Carbono';
        if (formula === 'NH3') return 'Amônia';
        if (formula === 'CH4') return 'Metano';
        if (formula === 'H2O2') return 'Peróxido de Hidrogênio';
        if (formula === 'C60') return 'Fulereno';
        if (formula === 'XeF4') return 'Tetrafluoreto de Xenônio';

        // Elemento puro (Diatômico ou Monotômico)
        const pureMatch = formula.match(/^([A-Z][a-z]?)(\d*)$/);
        if (pureMatch) {
            const el = pureMatch[1];
            const data = MolecularCalculator.getElement(el);
            if (data) {
                if (pureMatch[2] === '2') return `Gás ${data.name}`;
                if (pureMatch[2] === '3' && el === 'O') return 'Ozônio';
                return data.name;
            }
        }

        // Tenta extrair a estrutura: [Cátion][Ânion]
        // Ex: Ti(SO4)2, Fe2O3, HCl, NaOH, H2SO4

        // 1. ÁCIDOS (Começam com H e não são H2O)
        if (formula.startsWith('H') && !formula.startsWith('Hg') && !formula.startsWith('He') && !formula.startsWith('Hf')) {
            const anionPart = formula.replace(/^H\d*/, '');
            
            // Oxiácidos (com íon poliatômico)
            let polyAnionStr = anionPart;
            // Remover multiplicadores (ex: se fosse H2(SO4), muito raro, mas tratar)
            polyAnionStr = polyAnionStr.replace(/\(\)/g, '').replace(/\d+$/, '');
            
            for (const [ion, info] of Object.entries(POLYATOMIC_IONS)) {
                if (anionPart.startsWith(ion)) {
                    return `Ácido ${info.acidName}`;
                }
            }

            // Hidrácidos (sem oxigênio)
            const rootEl = anionPart.replace(/\d+$/, '');
            if (ANION_ROOTS[rootEl]) {
                const rootName = ANION_ROOTS[rootEl].replace('eto', 'ídrico').replace('Óxido', 'Oxídrico');
                return `Ácido ${rootName}`;
            }
        }

        // 2. SAIS, ÓXIDOS E BASES
        // Precisamos dividir a fórmula num Cátion (Metal) e num Ânion (Ametal ou Poliatômico)
        // Heurística de parsing simples
        
        let cationMatch = formula.match(/^([A-Z][a-z]?)(\d*)/);
        if (!cationMatch) return formula; // Falha no parsing
        
        let cationSymbol = cationMatch[1];
        let cationCount = parseInt(cationMatch[2] || '1', 10);
        let remainder = formula.substring(cationMatch[0].length);

        if (!remainder) return formula; // Algo deu errado, não tem ânion

        // Tentar identificar o ânion no remainder
        let anionName = '';
        let anionCharge = 0;
        let anionCount = 1;

        // Verifica se o remainder tem parênteses para íons poliatômicos Ex: (SO4)3
        const polyMatch = remainder.match(/^\((.+)\)(\d*)$/);
        if (polyMatch) {
            const innerIon = polyMatch[1];
            anionCount = parseInt(polyMatch[2] || '1', 10);
            
            if (POLYATOMIC_IONS[innerIon]) {
                anionName = POLYATOMIC_IONS[innerIon].name;
                anionCharge = Math.abs(POLYATOMIC_IONS[innerIon].charge);
            } else {
                anionName = `Composto de ${innerIon}`;
                anionCharge = 1; // Fallback
            }
        } else {
            // Pode ser um poliatômico sem parênteses Ex: SO4, OH
            let foundPoly = false;
            for (const [ion, info] of Object.entries(POLYATOMIC_IONS)) {
                if (remainder === ion) {
                    anionName = info.name;
                    anionCharge = Math.abs(info.charge);
                    anionCount = 1;
                    foundPoly = true;
                    break;
                }
            }

            // Ânion simples Ex: Cl3, O, S2
            if (!foundPoly) {
                const simpleMatch = remainder.match(/^([A-Z][a-z]?)(\d*)$/);
                if (simpleMatch) {
                    const el = simpleMatch[1];
                    anionCount = parseInt(simpleMatch[2] || '1', 10);
                    if (ANION_ROOTS[el]) {
                        anionName = ANION_ROOTS[el];
                        // Aproximar carga baseada nos elétrons de valência (Regra do Octeto)
                        const elData = MolecularCalculator.getElement(el);
                        if (elData && elData.valenceElectrons >= 5) {
                            anionCharge = 8 - elData.valenceElectrons;
                        } else {
                            anionCharge = 2; // Oxigênio/Enxofre default fallback
                            if (el === 'O' || el === 'S') anionCharge = 2;
                            if (el === 'Cl' || el === 'F' || el === 'Br' || el === 'I') anionCharge = 1;
                        }
                    } else {
                        const elData = MolecularCalculator.getElement(el);
                        anionName = elData ? elData.name : el;
                        anionCharge = 1;
                    }
                }
            }
        }

        // Nomear o cátion (Metal)
        const cationData = MolecularCalculator.getElement(cationSymbol);
        let cationFullName = cationData ? cationData.name : cationSymbol;

        const getPrefix = (count: number) => {
            const prefixes = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
            return prefixes[count] || '';
        }

        // Se for metal de transição, calcular NOX usando o balanço de cargas
        if (TRANSITION_METALS.includes(cationSymbol)) {
            const nox = (anionCount * anionCharge) / cationCount;
            if (Number.isInteger(nox) && nox > 0) {
                cationFullName += `(${toRoman(nox)})`;
            }
        } else if (cationData && cationData.category.includes('nonmetal') || cationData?.category.includes('halogen') || cationData?.category.includes('metalloid')) {
            // Compostos Covalentes (Ametal + Ametal) usam prefixos gregos
            const anionPrefix = getPrefix(anionCount);
            const cationPrefix = getPrefix(cationCount);
            
            anionName = (anionPrefix + anionName.toLowerCase());
            // Capitalizar primeira letra
            anionName = anionName.charAt(0).toUpperCase() + anionName.slice(1);
            
            if (cationCount > 1) {
                cationFullName = cationPrefix + cationFullName.toLowerCase();
            }
        }

        if (anionName && cationFullName) {
            const final = `${anionName} de ${cationFullName}`;
            console.log(`[NamingEngine] formula=${formula} -> anion=${anionName}, cation=${cationFullName} => ${final}`);
            return final;
        }

        console.log(`[NamingEngine] Fallback final para ${formula}`);
        // Fallback final: se não conseguiu nomear e tem mais de um elemento
        if (formula.length > 0 && formula !== cationSymbol) {
            // Tentar extrair todos os elementos da fórmula
            const elements = [...formula.matchAll(/([A-Z][a-z]?)/g)].map(m => m[1]);
            // Remover duplicatas
            const uniqueElements = [...new Set(elements)];
            
            if (uniqueElements.length > 1) {
                const elNames = uniqueElements.map(el => {
                    const data = MolecularCalculator.getElement(el);
                    return data ? data.name : el;
                });
                
                // Ex: "Composto de Carbono, Hidrogênio e Oxigênio"
                const last = elNames.pop();
                return `Composto de ${elNames.join(', ')} e ${last}`;
            }
        }

        return formula; // Fallback absoluto
    }
}
