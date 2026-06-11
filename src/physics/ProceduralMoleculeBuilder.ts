// src/physics/ProceduralMoleculeBuilder.ts
import { MolecularCalculator } from './MolecularCalculator';

export interface FormulaCoeff {
    formula: string;
    coeff: number;
}

interface Ion {
    formula: string;
    charge: number;
    isPolyatomic: boolean;
    elements: Record<string, number>;
}

// Lista de íons poliatômicos comuns e suas cargas
const POLYATOMIC_IONS: Record<string, number> = {
    'OH': -1,
    'SO4': -2,
    'SO3': -2,
    'NO3': -1,
    'NO2': -1,
    'CO3': -2,
    'HCO3': -1,
    'PO4': -3,
    'PO3': -3,
    'NH4': 1,
    'CN': -1,
    'CH3COO': -1,
    'MnO4': -1,
    'CrO4': -2,
    'Cr2O7': -2
};

// Estados de oxidação típicos para metais de transição comuns
const TRANSITION_METALS_OX: Record<string, number[]> = {
    'Fe': [3, 2], // Preferência pelo 3+ na natureza (oxidado)
    'Cu': [2, 1],
    'Zn': [2],
    'Ag': [1],
    'Au': [3, 1],
    'Hg': [2, 1],
    'Ni': [2, 3],
    'Co': [2, 3],
    'Mn': [2, 4, 7],
    'Cr': [3, 6],
};

export class ProceduralMoleculeBuilder {
    
    /**
     * Tenta prever os produtos de uma reação entre dois reagentes.
     */
    static predictReaction(reactant1: string, reactant2: string): string[] | null {
        // Normalizar a ordem para facilitar regras de combustão (O2 por último ou primeiro)
        let r1 = reactant1;
        let r2 = reactant2;
        
        // Regra Especial 1: Combustão Orgânica
        if (this.isCombustion(r1, r2)) {
            return ['CO2', 'H2O']; // Assume combustão completa para simplificar termodinâmica
        }

        // Tentar quebrar os reagentes em íons
        const ions1 = this.parseIntoIons(r1);
        const ions2 = this.parseIntoIons(r2);

        if (ions1.length > 0 && ions2.length > 0) {
            // Reação de Dupla Troca (A+B- + C+D- -> A+D- + C+B-)
            if (ions1.length === 2 && ions2.length === 2) {
                const cation1 = ions1.find(i => i.charge > 0);
                const anion1 = ions1.find(i => i.charge < 0);
                const cation2 = ions2.find(i => i.charge > 0);
                const anion2 = ions2.find(i => i.charge < 0);

                if (cation1 && anion1 && cation2 && anion2) {
                    const prod1 = this.combineIons(cation1, anion2);
                    const prod2 = this.combineIons(cation2, anion1);
                    if (prod1 && prod2) {
                        return [prod1, prod2];
                    }
                }
            }

            // Reação de Simples Troca (Metal A + C+D- -> A+D- + C)
            // Para simplificar, assumimos que elementos puros formam cátions se tiverem eletronegatividade baixa,
            // ou ânions se alta.
            if ((ions1.length === 1 && ions2.length === 2) || (ions2.length === 1 && ions1.length === 2)) {
                const element = ions1.length === 1 ? ions1[0] : ions2[0];
                const compound = ions1.length === 2 ? ions1 : ions2;
                
                const cation = compound.find(i => i.charge > 0);
                const anion = compound.find(i => i.charge < 0);
                
                if (cation && anion) {
                    // Se o elemento puro é um metal (tende a formar cátion)
                    if (element.charge > 0) {
                        // Elemento desloca o cátion (ex: Zn + 2HCl -> ZnCl2 + H2)
                        const prod1 = this.combineIons(element, anion);
                        const prod2 = this.elementToDiatomic(cation.formula); 
                        if (prod1 && prod2) return [prod1, prod2];
                    } else if (element.charge < 0) {
                        // Elemento desloca o ânion (ex: Cl2 + 2NaBr -> 2NaCl + Br2)
                        const prod1 = this.combineIons(cation, element);
                        const prod2 = this.elementToDiatomic(anion.formula);
                        if (prod1 && prod2) return [prod1, prod2];
                    }
                }
            }
        }

        // Síntese (A + B -> AB)
        // Ocorre geralmente entre dois elementos puros
        if (ions1.length === 1 && ions2.length === 1) {
            const e1 = ions1[0];
            const e2 = ions2[0];
            
            // Impede dimerização procedural de átomos (A + A -> AA)
            if (e1.formula === e2.formula) return null;

            // Impede reação (ligação covalente/iônica) entre dois metais puros no simulador
            // Na vida real formam ligas metálicas, mas nosso motor não deve processá-las como moléculas
            const data1 = MolecularCalculator.getElement(e1.formula.replace(/\d+/g, ''));
            const data2 = MolecularCalculator.getElement(e2.formula.replace(/\d+/g, ''));
            if (data1 && data2) {
                const isMetal = (cat: string) => cat.includes('metal') || cat.includes('lanthanide') || cat.includes('actinide');
                if (isMetal(data1.category) && isMetal(data2.category)) {
                    return null;
                }
            } // <- ESTA CHAVE ESTAVA FALTANDO!
            
            // Impede reação procedural com gases nobres (eles só reagem via reações conhecidas/choque)
            const NOBLE_GASES = ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'];
            if (NOBLE_GASES.includes(e1.formula.replace(/\d+/g, '')) || NOBLE_GASES.includes(e2.formula.replace(/\d+/g, ''))) {
                return null;
            }

            // Um deve ser positivo e o outro negativo para formar um composto iônico/covalente polar
            if (e1.charge > 0 && e2.charge < 0) {
                const prod = this.combineIons(e1, e2);
                if (prod) return [prod];
            } else if (e2.charge > 0 && e1.charge < 0) {
                const prod = this.combineIons(e2, e1);
                if (prod) return [prod];
            } else {
                // Forçar eletronegatividade para definir quem puxa elétrons
                const sym1 = e1.formula.replace(/\d+/g, '');
                const sym2 = e2.formula.replace(/\d+/g, '');
                const en1 = this.getElectronegativity(sym1);
                const en2 = this.getElectronegativity(sym2);
                const val1 = this.getValence(sym1);
                const val2 = this.getValence(sym2);

                // Se o átomo menos eletronegativo for um não-metal (val >= 4) e estiver reagindo
                // com um halogênio/oxigênio muito eletronegativo (EN >= 3.0), ele atinge seu
                // estado de oxidação máximo (hipervalência), usando todos os elétrons de valência.
                if (en1 < en2) {
                    e1.charge = (val1 >= 4 && en2 >= 3.0) ? val1 : Math.max(1, Math.abs(e1.charge));
                    e2.charge = -Math.max(1, Math.abs(e2.charge));
                    const prod = this.combineIons(e1, e2);
                    if (prod) return [prod];
                } else {
                    e2.charge = (val2 >= 4 && en1 >= 3.0) ? val2 : Math.max(1, Math.abs(e2.charge));
                    e1.charge = -Math.max(1, Math.abs(e1.charge));
                    const prod = this.combineIons(e2, e1);
                    if (prod) return [prod];
                }
            }
        }

        return null;
    }

    private static isCombustion(r1: string, r2: string): boolean {
        if (r1 !== 'O2' && r2 !== 'O2') return false;
        const target = r1 === 'O2' ? r2 : r1;
        
        // Verifica se contém apenas C, H e O
        const regex = /^C\d*H\d*(O\d*)?$/;
        return regex.test(target);
    }

    private static elementToDiatomic(element: string): string {
        const diatomics = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
        return diatomics.includes(element) ? element + '2' : element;
    }

    private static getElectronegativity(symbol: string): number {
        // Approximate values se MolecularCalculator não exportar a tabela direto
        const enMap: Record<string, number> = {
            H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
            Na: 0.93, Mg: 1.31, Al: 1.61, P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.00, Fe: 1.83, Cu: 1.90, Zn: 1.65, Br: 2.96, I: 2.66
        };
        return enMap[symbol] || 2.0; // Padrão intermediário
    }

    private static getValence(symbol: string): number {
        const valMap: Record<string, number> = {
            H: 1, C: 4, N: 5, O: 6, F: 7,
            Na: 1, Mg: 2, Al: 3, P: 5, S: 6, Cl: 7, K: 1, Ca: 2, Fe: 2, Cu: 2, Zn: 2, Br: 7, I: 7
        };
        return valMap[symbol] || 0;
    }

    /**
     * Determina a carga típica baseada nos elétrons de valência (Regra do Octeto)
     */
    private static determineOctetCharge(symbol: string): number {
        if (TRANSITION_METALS_OX[symbol]) {
            return TRANSITION_METALS_OX[symbol][0]; // Usa o estado de oxidação mais comum
        }
        
        const valence = this.getValence(symbol);
        if (valence === 0) return 0;
        
        // Metais alcalinos / alcalinoterrosos (perdem elétrons)
        if (valence <= 3) return valence;
        // Não-metais (ganham elétrons para fechar 8)
        if (valence >= 5) return valence - 8;
        // Carbono / Silício (grupo 14)
        return 4; // Pode ser +4 ou -4 dependendo da molécula, mas assumimos +4 como cátion base para cruzar
    }

    /**
     * Faz o parsing de uma molécula em seus íons constituintes.
     * Ex: "NaCl" -> [Na+, Cl-]
     * Ex: "H2SO4" -> [H+, SO4-2]
     * Ex: "O2" -> [O]
     */
    public static parseIntoIons(formula: string): Ion[] {
        // Remover coeficientes para análise (ex: 2H2O -> H2O)
        let pureFormula = formula.replace(/^\d+/, '');
        
        // Elementos puros (ex: O2, Fe, C)
        const pureElementMatch = pureFormula.match(/^([A-Z][a-z]?)(\d*)$/);
        if (pureElementMatch) {
            const sym = pureElementMatch[1];
            return [{
                formula: sym,
                charge: this.determineOctetCharge(sym),
                isPolyatomic: false,
                elements: { [sym]: 1 }
            }];
        }

        // Compostos
        // Tentar identificar íons poliatômicos primeiro
        let anions: Ion[] = [];
        let cations: Ion[] = [];

        // Buscar por poliatômicos na fórmula
        for (const [poly, charge] of Object.entries(POLYATOMIC_IONS)) {
            // Se a fórmula termina com o poliatômico (com ou sem quantidade)
            const regex = new RegExp(`(?:\\(${poly}\\)(\\d+)|${poly}(\\d*))$`);
            const match = pureFormula.match(regex);
            
            if (match) {
                // Extrair a parte que sobrou (provavelmente o cátion)
                const rest = pureFormula.replace(regex, '');
                const cationMatch = rest.match(/^([A-Z][a-z]?)(\d*)$/);
                
                if (cationMatch) {
                    const catSym = cationMatch[1];
                    const catCount = parseInt(cationMatch[2] || '1', 10);
                    
                    const polyCountStr = match[1] || match[2] || '1';
                    const polyCount = parseInt(polyCountStr, 10);

                    // Pela regra de neutralidade das cargas: catCount * catCharge + polyCount * charge = 0
                    const catCharge = Math.abs((polyCount * charge) / catCount);
                    
                    cations.push({
                        formula: catSym,
                        charge: catCharge,
                        isPolyatomic: false,
                        elements: { [catSym]: 1 }
                    });
                    
                    anions.push({
                        formula: poly,
                        charge: charge,
                        isPolyatomic: true,
                        elements: {} // Omitimos os elementos internos por simplificação
                    });
                    
                    return [...cations, ...anions];
                }
            }
        }

        // Se não tem poliatômicos, é um composto binário simples (ex: NaCl, CO2, Al2O3)
        const binaryMatch = pureFormula.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
        if (binaryMatch) {
            const sym1 = binaryMatch[1];
            const q1 = parseInt(binaryMatch[2] || '1', 10);
            const sym2 = binaryMatch[3];
            const q2 = parseInt(binaryMatch[4] || '1', 10);

            const en1 = this.getElectronegativity(sym1);
            const en2 = this.getElectronegativity(sym2);

            let catSym, anSym, catQ, anQ;

            if (en1 < en2) {
                catSym = sym1; catQ = q1;
                anSym = sym2; anQ = q2;
            } else {
                catSym = sym2; catQ = q2;
                anSym = sym1; anQ = q1;
            }

            // Descobre a carga cruzando os subscritos
            let catCharge = anQ;
            let anCharge = -catQ;
            
            // Corrige se as cargas forem reduzidas (ex: CO2 onde C=4, O=-2, subscritos são 1, 2)
            // Sabemos as cargas típicas do ânion pelo Octeto
            const expectedAnionCharge = this.determineOctetCharge(anSym);
            if (expectedAnionCharge < 0 && anCharge !== expectedAnionCharge) {
                const multiplier = expectedAnionCharge / anCharge;
                anCharge *= multiplier;
                catCharge *= multiplier;
            }

            return [
                { formula: catSym, charge: Math.abs(catCharge), isPolyatomic: false, elements: {[catSym]: 1} },
                { formula: anSym, charge: -Math.abs(anCharge), isPolyatomic: false, elements: {[anSym]: 1} }
            ];
        }

        return [];
    }

    /**
     * Parseia uma fórmula em um mapa de Elemento -> Quantidade.
     */
    public static countElements(formula: string): Record<string, number> {
        const counts: Record<string, number> = {};
        const pure = formula.replace(/^\d+/, ''); // Remove coeff inicial
        const regex = /([A-Z][a-z]?)(\d*)/g;
        let match;
        while ((match = regex.exec(pure)) !== null) {
            const sym = match[1];
            const q = parseInt(match[2] || '1', 10);
            counts[sym] = (counts[sym] || 0) + q;
        }
        return counts;
    }

    /**
     * Tenta balancear uma equação quimica usando força bruta simples para coeficientes até 10.
     * (Abordagem viável pois o jogo usa reações simples).
     */
    public static balanceEquation(reactants: string[], products: string[]): { reactants: FormulaCoeff[], products: FormulaCoeff[] } | null {
        const MAX_COEFF = 12;
        
        // Coleta todos os elementos únicos
        const allElements = new Set<string>();
        const rCounts = reactants.map(r => this.countElements(r));
        const pCounts = products.map(p => this.countElements(p));
        
        rCounts.forEach(c => Object.keys(c).forEach(e => allElements.add(e)));
        pCounts.forEach(c => Object.keys(c).forEach(e => allElements.add(e)));
        
        const elements = Array.from(allElements);

        // Força bruta para matrizes de até 2 reagentes e 2 produtos
        if (reactants.length <= 2 && products.length <= 2) {
            for (let r1 = 1; r1 <= MAX_COEFF; r1++) {
                for (let r2 = 1; r2 <= (reactants.length === 2 ? MAX_COEFF : 1); r2++) {
                    for (let p1 = 1; p1 <= MAX_COEFF; p1++) {
                        for (let p2 = 1; p2 <= (products.length === 2 ? MAX_COEFF : 1); p2++) {
                            
                            let balanced = true;
                            for (const el of elements) {
                                const left = (rCounts[0][el] || 0) * r1 + 
                                             (reactants.length === 2 ? (rCounts[1][el] || 0) * r2 : 0);
                                const right = (pCounts[0][el] || 0) * p1 + 
                                              (products.length === 2 ? (pCounts[1][el] || 0) * p2 : 0);
                                if (left !== right) {
                                    balanced = false;
                                    break;
                                }
                            }

                            if (balanced) {
                                return {
                                    reactants: [
                                        { formula: reactants[0], coeff: r1 },
                                        ...(reactants.length === 2 ? [{ formula: reactants[1], coeff: r2 }] : [])
                                    ],
                                    products: [
                                        { formula: products[0], coeff: p1 },
                                        ...(products.length === 2 ? [{ formula: products[1], coeff: p2 }] : [])
                                    ]
                                };
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback: retorna com coeficientes 1 se não conseguiu balancear
        return {
            reactants: reactants.map(r => ({ formula: r, coeff: 1 })),
            products: products.map(p => ({ formula: p, coeff: 1 }))
        };
    }

    /**
     * Combina dois íons (cátion e ânion) numa fórmula neutralizada cruzando as cargas.
     * Ex: Al (+3) e O (-2) -> Al2O3
     */
    public static combineIons(cation: Ion, anion: Ion): string | null {
        if (cation.charge <= 0 || anion.charge >= 0) return null; // Um precisa ser positivo e o outro negativo

        const c = Math.abs(cation.charge);
        const a = Math.abs(anion.charge);

        // Simplificar proporções (ex: +2 e -2 -> 1 e 1)
        const gcd = this.calculateGCD(c, a);
        const catCount = a / gcd;
        const anCount = c / gcd;

        let first = cation;
        let firstCount = catCount;
        let second = anion;
        let secondCount = anCount;

        // Regras de ordenação (Hill / IUPAC exceptions)
        // Carbono ou Nitrogênio normalmente vêm antes do Hidrogênio em fórmulas moleculares
        if (cation.formula === 'H' && (anion.formula === 'C' || anion.formula === 'N')) {
            first = anion;
            firstCount = anCount;
            second = cation;
            secondCount = catCount;
        }

        let formula = '';
        
        if (firstCount === 1) formula += first.formula;
        else formula += first.formula + firstCount;

        if (secondCount === 1) formula += second.formula;
        else {
            if (second.isPolyatomic) formula += `(${second.formula})${secondCount}`;
            else formula += second.formula + secondCount;
        }

        return formula;
    }

    private static calculateGCD(a: number, b: number): number {
        return b === 0 ? a : this.calculateGCD(b, a % b);
    }
}
