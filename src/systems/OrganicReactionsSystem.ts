// src/systems/OrganicReactionsSystem.ts
// Sistema de reações orgânicas com visualização

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export type FunctionalGroupId =
    | 'alcohol' | 'carboxylic_acid' | 'aldehyde' | 'ketone'
    | 'amine' | 'ester' | 'amide' | 'ether' | 'acyl_halide'
    | 'phenol' | 'sugar' | 'fat_triglyceride'

export interface FunctionalGroup {
    id: FunctionalGroupId
    name: string
    priority: number
}

// ═══════════════════════════════════════════════════════════════════════
// MOTOR DE GRAFOS SMILES (Fase 6 - Opção A)
// ═══════════════════════════════════════════════════════════════════════

export interface AtomNode {
    id: number
    element: string
    charge: number
}

export interface BondEdge {
    from: number
    to: number
    order: 1 | 2 | 3
}

export interface MoleculeGraph {
    nodes: Map<number, AtomNode>
    edges: BondEdge[]
}

/**
 * Parser de SMILES simplificado.
 * Converte strings como "CC(=O)O" em um Grafo Molecular (Nós e Arestas).
 * Suporta:
 * - Átomos: C, O, N, S, Cl, F, Br, I, P
 * - Ligações: - (implícita/simples), = (dupla), # (tripla)
 * - Ramificações: ()
 */
export function parseSMILES(smiles: string): MoleculeGraph {
    const graph: MoleculeGraph = { nodes: new Map(), edges: [] }
    let nodeIdCounter = 0
    let currentId = -1
    const branchStack: number[] = []
    let nextBondOrder: 1 | 2 | 3 = 1

    let i = 0
    while (i < smiles.length) {
        const char = smiles[i]

        // Ligações explícitas
        if (char === '=') { nextBondOrder = 2; i++; continue }
        if (char === '#') { nextBondOrder = 3; i++; continue }
        if (char === '-') { nextBondOrder = 1; i++; continue }

        // Ramificações
        if (char === '(') { branchStack.push(currentId); i++; continue }
        if (char === ')') { currentId = branchStack.pop() ?? currentId; i++; continue }

        // Átomos (simplificado para primeira letra maiúscula, opcional minúscula)
        if (/[A-Z]/.test(char)) {
            let element = char
            if (i + 1 < smiles.length && /[a-z]/.test(smiles[i + 1])) {
                element += smiles[i + 1]
                i++
            }

            const newId = nodeIdCounter++
            graph.nodes.set(newId, { id: newId, element, charge: 0 })

            if (currentId !== -1) {
                graph.edges.push({ from: currentId, to: newId, order: nextBondOrder })
            }

            currentId = newId
            nextBondOrder = 1 // Reseta para ligação simples
            i++
            continue
        }
        
        i++ // Ignorar caracteres não suportados por agora
    }

    return graph
}

/**
 * Busca por padrões estruturais (sub-grafos) para identificar Grupos Funcionais.
 */
export function detectFunctionalGroupsFromGraph(graph: MoleculeGraph): FunctionalGroup[] {
    const detected: FunctionalGroup[] = []
    const hasGroup = (id: FunctionalGroupId) => detected.some(g => g.id === id)
    const addGroup = (id: FunctionalGroupId, name: string, priority: number) => {
        if (!hasGroup(id)) detected.push({ id, name, priority })
    }

    const { nodes, edges } = graph

    // Helpers
    const getNeighbors = (id: number) => edges.filter(e => e.from === id || e.to === id).map(e => ({
        neighborId: e.from === id ? e.to : e.from,
        order: e.order
    }))

    for (const [id, atom] of nodes.entries()) {
        const neighbors = getNeighbors(id)

        // Detectar -OH (Álcool ou parte de Ácido)
        // No SMILES simplificado que ignoram os H, o Álcool é um 'O' com apenas 1 vizinho (que não seja H explícito) 
        // ou um 'O' simples sem ligações duplas.
        if (atom.element === 'O') {
            const isDoubleBonded = neighbors.some(n => n.order === 2)
            
            if (!isDoubleBonded && neighbors.length === 1) { // Geralmente um C-O que representa o OH num SMILES sem H
                const cNeighbor = nodes.get(neighbors[0].neighborId)
                if (cNeighbor && cNeighbor.element === 'C') {
                    // Verificar se este C também tem um =O (Ácido Carboxílico)
                    const cNeighbors = getNeighbors(cNeighbor.id)
                    const hasCarbonyl = cNeighbors.some(cn => cn.order === 2 && nodes.get(cn.neighborId)?.element === 'O')
                    
                    if (hasCarbonyl) {
                        addGroup('carboxylic_acid', 'Ácido Carboxílico', 10)
                    } else {
                        addGroup('alcohol', 'Álcool', 6)
                    }
                }
            } else if (isDoubleBonded && neighbors.length === 1) {
                // É um =O (Carbonila). Pode ser Cetona, Aldeído, Éster, Ácido...
                const cNeighbor = nodes.get(neighbors[0].neighborId)
                if (cNeighbor && cNeighbor.element === 'C') {
                    const cNeighbors = getNeighbors(cNeighbor.id)
                    
                    // Se o C tiver outro O ligado por ligação simples -> Ácido ou Éster
                    const singleBondedO = cNeighbors.find(cn => cn.order === 1 && nodes.get(cn.neighborId)?.element === 'O')
                    if (singleBondedO) {
                        const oAtomNeighbors = getNeighbors(singleBondedO.neighborId)
                        if (oAtomNeighbors.length > 1) {
                            addGroup('ester', 'Éster', 9)
                        } else {
                            addGroup('carboxylic_acid', 'Ácido Carboxílico', 10)
                        }
                    } else {
                        // Se não tem O ligado, é Aldeído ou Cetona. 
                        // Simplificação para este TCC: Se o C for primário é aldeído, secundário é cetona
                        const cConnectedCarbons = cNeighbors.filter(cn => nodes.get(cn.neighborId)?.element === 'C')
                        if (cConnectedCarbons.length > 1) {
                            addGroup('ketone', 'Cetona', 5)
                        } else {
                            addGroup('aldehyde', 'Aldeído', 7)
                        }
                    }
                }
            } else if (!isDoubleBonded && neighbors.length === 2) {
                // Éter (C-O-C)
                const isEther = neighbors.every(n => nodes.get(n.neighborId)?.element === 'C')
                if (isEther) addGroup('ether', 'Éter', 4)
            }
        }

        // Detectar Amina (N com ligações simples)
        if (atom.element === 'N') {
            const isDoubleBonded = neighbors.some(n => n.order === 2)
            if (!isDoubleBonded) {
                addGroup('amine', 'Amina', 6)
            }
        }
    }

    // Ordenar por prioridade
    return detected.sort((a, b) => b.priority - a.priority)
}

/**
 * Função de retrocompatibilidade para o motor antigo se não conseguirmos parsear via SMILES
 */
export function detectFunctionalGroupsFallback(formula: string): FunctionalGroup[] {
    const detected: FunctionalGroup[] = []
    
    // Açúcar, Gordura, etc são difíceis de gerar via SMILES simplificado do usuário, mantemos os patterns especiais
    if (formula.includes('C₆H₁₂O₆') || formula.includes('C₁₂H₂₂O₁₁')) detected.push({ id: 'sugar', name: 'Açúcar', priority: 10 })
    if (formula.toLowerCase().includes('triglicerídeo')) detected.push({ id: 'fat_triglyceride', name: 'Gordura/Triglicerídeo', priority: 10 })
    if (formula.includes('C₆H₅OH')) detected.push({ id: 'phenol', name: 'Fenol', priority: 7 })

    return detected.sort((a, b) => b.priority - a.priority)
}

/**
 * Função Wrapper para compatibilidade com WorkerClient e chamadas externas.
 * Tenta usar o motor de grafos (SMILES), ou faz fallback.
 */
export function detectFunctionalGroups(formula: string): FunctionalGroup[] {
    const reagent = Object.values(ORGANIC_REAGENTS).find(r => r.formula === formula)
    const smiles = reagent?.smiles || formula
    
    const graph = parseSMILES(smiles)
    const groups = detectFunctionalGroupsFromGraph(graph)
    
    if (groups.length > 0) return groups
    return detectFunctionalGroupsFallback(formula)
}

// ═══════════════════════════════════════════════════════════════════════
// REGRAS DE AFINIDADE FUNCIONAL
// ═══════════════════════════════════════════════════════════════════════

interface AffinityRule {
    group1: FunctionalGroupId
    group2: FunctionalGroupId
    requiresHeat: boolean
    requiresCatalyst?: string
    minTemp: number
    reactionType: OrganicReactionType
    productName: string
    productFormula: string
    productColor: string
    byproductName?: string
    byproductFormula?: string
    visualEffect: OrganicReaction['visualEffect']
    reactionTime: number
    description: string
}

const AFFINITY_RULES: AffinityRule[] = [
    {
        group1: 'alcohol', group2: 'carboxylic_acid',
        requiresHeat: true, requiresCatalyst: 'H₂SO₄', minTemp: 60,
        reactionType: 'esterification',
        productName: 'Éster', productFormula: 'R-COO-R\'', productColor: '#fffaf0',
        byproductName: 'Água', byproductFormula: 'H₂O',
        visualEffect: 'smell', reactionTime: 30,
        description: 'Esterificação de Fischer: álcool + ácido carboxílico → éster + água'
    },
    {
        group1: 'fat_triglyceride', group2: 'alcohol', // NaOH is a "base" not alcohol, handle below
        requiresHeat: true, minTemp: 70,
        reactionType: 'saponification',
        productName: 'Sabão', productFormula: 'RCOONa', productColor: '#fffff0',
        byproductName: 'Glicerol', byproductFormula: 'C₃H₈O₃',
        visualEffect: 'heat', reactionTime: 60,
        description: 'Saponificação: gordura + base forte → sabão + glicerina'
    },
    {
        group1: 'sugar', group2: 'amine', // yeast mapped as 'catalyst', handled via fallback
        requiresHeat: false, minTemp: 20,
        reactionType: 'fermentation',
        productName: 'Etanol', productFormula: 'C₂H₅OH', productColor: '#f8f8ff',
        byproductName: 'CO₂', byproductFormula: 'CO₂',
        visualEffect: 'bubbles', reactionTime: 120,
        description: 'Fermentação alcoólica: glicose → etanol + CO₂'
    },
    {
        group1: 'alcohol', group2: 'ketone', // Oxidation with dichromate
        requiresHeat: false, minTemp: 20,
        reactionType: 'oxidation',
        productName: 'Aldeído', productFormula: 'R-CHO', productColor: '#f5f5f5',
        visualEffect: 'color-change', reactionTime: 10,
        description: 'Oxidação de álcool: álcool primário → aldeído (mudança de cor)'
    },
]

/**
 * Tenta encontrar uma reação por afinidade funcional entre dois reagentes.
 * Retorna uma reação gerada proceduralmente, ou null.
 */
export function findReactionByAffinity(
    formula1: string,
    formula2: string,
    temperature: number
): OrganicReaction | null {
    // Procurar os reagentes para tentar obter o SMILES
    const r1 = Object.values(ORGANIC_REAGENTS).find(r => r.formula === formula1)
    const r2 = Object.values(ORGANIC_REAGENTS).find(r => r.formula === formula2)

    const smiles1 = r1?.smiles || formula1
    const smiles2 = r2?.smiles || formula2

    // Construir os grafos
    const graph1 = parseSMILES(smiles1)
    const graph2 = parseSMILES(smiles2)

    // Detectar grupos (com fallback para fórmulas especiais que não dão parse no SMILES simplificado)
    let groups1 = detectFunctionalGroupsFromGraph(graph1)
    if (groups1.length === 0) groups1 = detectFunctionalGroupsFallback(formula1)

    let groups2 = detectFunctionalGroupsFromGraph(graph2)
    if (groups2.length === 0) groups2 = detectFunctionalGroupsFallback(formula2)
    if (groups1.length === 0 && groups2.length === 0) return null

    for (const rule of AFFINITY_RULES) {
        const match1to2 = groups1.some(g => g.id === rule.group1) && groups2.some(g => g.id === rule.group2)
        const match2to1 = groups1.some(g => g.id === rule.group2) && groups2.some(g => g.id === rule.group1)

        if ((match1to2 || match2to1) && temperature >= rule.minTemp) {
            // Gerar reação procedural
            const r1 = Object.values(ORGANIC_REAGENTS).find(r => r.formula === formula1) || {
                id: formula1, name: formula1, formula: formula1,
                type: 'other' as const, color: '#f0f0f0', viscosity: 0.1, isOrganic: true
            }
            const r2 = Object.values(ORGANIC_REAGENTS).find(r => r.formula === formula2) || {
                id: formula2, name: formula2, formula: formula2,
                type: 'other' as const, color: '#f0f0f0', viscosity: 0.1, isOrganic: true
            }

            const product: OrganicReagent = {
                id: `product-${rule.reactionType}`,
                name: rule.productName,
                formula: rule.productFormula,
                type: 'other',
                color: rule.productColor,
                viscosity: 0.1,
                isOrganic: true
            }

            const byproducts: OrganicReagent[] = rule.byproductFormula ? [{
                id: `byproduct-${rule.reactionType}`,
                name: rule.byproductName || '',
                formula: rule.byproductFormula,
                type: 'other',
                color: '#e0f7ff',
                viscosity: 0,
                isOrganic: false
            }] : []

            return {
                id: `affinity-${rule.reactionType}-${Date.now()}`,
                type: rule.reactionType,
                name: rule.description.split(':')[0],
                description: rule.description,
                reagent1: r1,
                reagent2: r2,
                products: [product],
                byproducts,
                visualEffect: rule.visualEffect,
                reactionTime: rule.reactionTime,
                requiresHeat: rule.requiresHeat,
                optimalTemp: rule.minTemp + 10,
            }
        }
    }

    return null
}

export type OrganicReactionType =
    | 'nylon-synthesis'      // Polimerização de nylon
    | 'slime-synthesis'      // Síntese de slime (PVA + borato)
    | 'esterification'       // Formação de éster
    | 'saponification'       // Fabricação de sabão
    | 'fermentation'         // Fermentação alcoólica
    | 'combustion'           // Combustão orgânica
    | 'oxidation'            // Oxidação de álcool

export interface OrganicReagent {
    id: string
    name: string
    formula: string
    smiles?: string         // Notação SMILES para construção do grafo (Opção A)
    type: 'monomer' | 'polymer' | 'alcohol' | 'acid' | 'base' | 'ester' | 'catalyst' | 'other'
    color: string
    viscosity: number       // 0-1 (água=0, slime=0.9)
    isOrganic: boolean
}

export interface OrganicReaction {
    id: string
    type: OrganicReactionType
    name: string
    description: string
    reagent1: OrganicReagent
    reagent2: OrganicReagent
    catalyst?: OrganicReagent
    products: OrganicReagent[]
    byproducts?: OrganicReagent[]
    visualEffect: 'thread-formation' | 'gel-formation' | 'bubbles' | 'color-change' | 'smell' | 'heat'
    reactionTime: number    // segundos
    requiresHeat: boolean
    optimalTemp?: number    // °C
}

export interface OrganicReactionState {
    reaction: OrganicReaction | null
    progress: number        // 0-1
    isReacting: boolean
    temperature: number
    stirring: boolean
    threadLength?: number   // Para síntese de nylon
    gelViscosity?: number   // Para slime
    bubbleRate?: number     // Para fermentação
}

// ═══════════════════════════════════════════════════════════════════════
// REAGENTES ORGÂNICOS
// ═══════════════════════════════════════════════════════════════════════

export const ORGANIC_REAGENTS: Record<string, OrganicReagent> = {
    // Monômeros para Nylon
    hexamethyleneDiamine: {
        id: 'hexamethyleneDiamine',
        name: 'Hexametilenodiamina',
        formula: 'H₂N(CH₂)₆NH₂',
        smiles: 'NCCCCCCN',
        type: 'monomer',
        color: '#f5f5dc',
        viscosity: 0.1,
        isOrganic: true
    },
    adipoylChloride: {
        id: 'adipoylChloride',
        name: 'Cloreto de Adipoíla',
        formula: 'ClOC(CH₂)₄COCl',
        smiles: 'ClC(=O)CCCCC(=O)Cl',
        type: 'monomer',
        color: '#fffaf0',
        viscosity: 0.15,
        isOrganic: true
    },
    nylon66: {
        id: 'nylon66',
        name: 'Nylon 6,6',
        formula: '[-NH(CH₂)₆NH-CO(CH₂)₄CO-]ₙ',
        type: 'polymer',
        color: '#f5f5f5',
        viscosity: 0.9,
        isOrganic: true
    },

    // Reagentes para Slime
    pva: {
        id: 'pva',
        name: 'Cola Branca (PVA)',
        formula: '[-CH₂CHOCOCH₃-]ₙ',
        type: 'polymer',
        color: '#fffafa',
        viscosity: 0.4,
        isOrganic: true
    },
    borax: {
        id: 'borax',
        name: 'Bórax',
        formula: 'Na₂B₄O₇·10H₂O',
        type: 'other',
        color: '#ffffff',
        viscosity: 0.1,
        isOrganic: false
    },
    slime: {
        id: 'slime',
        name: 'Slime (Gel de PVA)',
        formula: 'PVA-B-PVA',
        type: 'polymer',
        color: '#7fff00',
        viscosity: 0.85,
        isOrganic: true
    },

    // Reagentes para Esterificação
    ethanol: {
        id: 'ethanol',
        name: 'Etanol',
        formula: 'C₂H₅OH',
        smiles: 'CCO',
        type: 'alcohol',
        color: '#f8f8ff',
        viscosity: 0.05,
        isOrganic: true
    },
    aceticAcid: {
        id: 'aceticAcid',
        name: 'Ácido Acético (Vinagre)',
        formula: 'CH₃COOH',
        smiles: 'CC(=O)O',
        type: 'acid',
        color: '#f5fffa',
        viscosity: 0.08,
        isOrganic: true
    },
    sulfuricAcidCatalyst: {
        id: 'sulfuricAcidCatalyst',
        name: 'Ácido Sulfúrico (catalisador)',
        formula: 'H₂SO₄',
        type: 'catalyst',
        color: '#f0f8ff',
        viscosity: 0.2,
        isOrganic: false
    },
    ethylAcetate: {
        id: 'ethylAcetate',
        name: 'Acetato de Etila',
        formula: 'CH₃COOC₂H₅',
        smiles: 'CC(=O)OCC',
        type: 'ester',
        color: '#fffaf0',
        viscosity: 0.03,
        isOrganic: true
    },

    // Reagentes para Saponificação
    vegetableOil: {
        id: 'vegetableOil',
        name: 'Óleo Vegetal',
        formula: 'Triglicerídeo',
        type: 'other',
        color: '#f0e68c',
        viscosity: 0.5,
        isOrganic: true
    },
    sodiumHydroxide: {
        id: 'sodiumHydroxide',
        name: 'Hidróxido de Sódio (Soda)',
        formula: 'NaOH',
        type: 'base',
        color: '#ffffff',
        viscosity: 0.1,
        isOrganic: false
    },
    soap: {
        id: 'soap',
        name: 'Sabão',
        formula: 'RCOONa',
        type: 'other',
        color: '#fffff0',
        viscosity: 0.3,
        isOrganic: true
    },
    glycerol: {
        id: 'glycerol',
        name: 'Glicerol (Glicerina)',
        formula: 'C₃H₈O₃',
        smiles: 'OCC(O)CO',
        type: 'alcohol',
        color: '#f8f8ff',
        viscosity: 0.6,
        isOrganic: true
    },

    // Reagentes para Fermentação
    glucose: {
        id: 'glucose',
        name: 'Glicose',
        formula: 'C₆H₁₂O₆',
        smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O',
        type: 'other',
        color: '#fffaf0',
        viscosity: 0.3,
        isOrganic: true
    },
    yeast: {
        id: 'yeast',
        name: 'Fermento Biológico',
        formula: 'Saccharomyces',
        type: 'catalyst',
        color: '#f5deb3',
        viscosity: 0.2,
        isOrganic: true
    },
    carbonDioxide: {
        id: 'carbonDioxide',
        name: 'Dióxido de Carbono',
        formula: 'CO₂',
        type: 'other',
        color: '#f5f5f5',
        viscosity: 0,
        isOrganic: false
    },

    // Para oxidação
    potassiumDichromate: {
        id: 'potassiumDichromate',
        name: 'Dicromato de Potássio',
        formula: 'K₂Cr₂O₇',
        type: 'catalyst',
        color: '#ff8c00',
        viscosity: 0.1,
        isOrganic: false
    },
    aceticAldehyde: {
        id: 'aceticAldehyde',
        name: 'Acetaldeído',
        formula: 'CH₃CHO',
        smiles: 'CC(=O)',
        type: 'other',
        color: '#f5f5f5',
        viscosity: 0.02,
        isOrganic: true
    }
}

// ═══════════════════════════════════════════════════════════════════════
// REAÇÕES ORGÂNICAS
// ═══════════════════════════════════════════════════════════════════════

export const ORGANIC_REACTIONS: Record<string, OrganicReaction> = {
    nylonSynthesis: {
        id: 'nylonSynthesis',
        type: 'nylon-synthesis',
        name: 'Síntese do Nylon 6,6',
        description: 'Polimerização interfacial formando um fio de nylon que pode ser puxado continuamente.',
        reagent1: ORGANIC_REAGENTS.hexamethyleneDiamine,
        reagent2: ORGANIC_REAGENTS.adipoylChloride,
        products: [ORGANIC_REAGENTS.nylon66],
        byproducts: [{ ...ORGANIC_REAGENTS.sodiumHydroxide, name: 'HCl (liberado)', formula: 'HCl' }],
        visualEffect: 'thread-formation',
        reactionTime: 2,
        requiresHeat: false,
        optimalTemp: 25
    },

    slimeSynthesis: {
        id: 'slimeSynthesis',
        type: 'slime-synthesis',
        name: 'Síntese de Slime',
        description: 'O bórax forma ligações cruzadas entre as cadeias de PVA, criando um gel viscoso.',
        reagent1: ORGANIC_REAGENTS.pva,
        reagent2: ORGANIC_REAGENTS.borax,
        products: [ORGANIC_REAGENTS.slime],
        visualEffect: 'gel-formation',
        reactionTime: 5,
        requiresHeat: false,
        optimalTemp: 25
    },

    esterification: {
        id: 'esterification',
        type: 'esterification',
        name: 'Esterificação de Fischer',
        description: 'Álcool + Ácido carboxílico → Éster + Água. Produz aroma característico de frutas.',
        reagent1: ORGANIC_REAGENTS.ethanol,
        reagent2: ORGANIC_REAGENTS.aceticAcid,
        catalyst: ORGANIC_REAGENTS.sulfuricAcidCatalyst,
        products: [ORGANIC_REAGENTS.ethylAcetate],
        byproducts: [{
            id: 'water',
            name: 'Água',
            formula: 'H₂O',
            type: 'other',
            color: '#e0f7ff',
            viscosity: 0,
            isOrganic: false
        }],
        visualEffect: 'smell',
        reactionTime: 30,
        requiresHeat: true,
        optimalTemp: 70
    },

    saponification: {
        id: 'saponification',
        type: 'saponification',
        name: 'Saponificação (Fazer Sabão)',
        description: 'Gordura + Base forte → Sabão + Glicerina. Reação exotérmica.',
        reagent1: ORGANIC_REAGENTS.vegetableOil,
        reagent2: ORGANIC_REAGENTS.sodiumHydroxide,
        products: [ORGANIC_REAGENTS.soap, ORGANIC_REAGENTS.glycerol],
        visualEffect: 'heat',
        reactionTime: 60,
        requiresHeat: true,
        optimalTemp: 80
    },

    fermentation: {
        id: 'fermentation',
        type: 'fermentation',
        name: 'Fermentação Alcoólica',
        description: 'Glicose → Etanol + CO₂. Processo biológico que produz bolhas.',
        reagent1: ORGANIC_REAGENTS.glucose,
        reagent2: ORGANIC_REAGENTS.yeast,
        products: [ORGANIC_REAGENTS.ethanol, ORGANIC_REAGENTS.carbonDioxide],
        visualEffect: 'bubbles',
        reactionTime: 120,
        requiresHeat: false,
        optimalTemp: 35
    },

    alcoholOxidation: {
        id: 'alcoholOxidation',
        type: 'oxidation',
        name: 'Oxidação de Álcool',
        description: 'Oxidação do etanol com dicromato, mudando a cor de laranja para verde.',
        reagent1: ORGANIC_REAGENTS.ethanol,
        reagent2: ORGANIC_REAGENTS.potassiumDichromate,
        products: [ORGANIC_REAGENTS.aceticAldehyde],
        visualEffect: 'color-change',
        reactionTime: 10,
        requiresHeat: false,
        optimalTemp: 25
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DO SISTEMA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Verifica se dois reagentes podem reagir.
 * Primeiro tenta lookup direto por ID, depois tenta afinidade funcional.
 */
export function canReact(reagent1Id: string, reagent2Id: string, temperature: number = 25): OrganicReaction | null {
    // 1. Lookup direto por ID (reações conhecidas)
    for (const reaction of Object.values(ORGANIC_REACTIONS)) {
        if (
            (reaction.reagent1.id === reagent1Id && reaction.reagent2.id === reagent2Id) ||
            (reaction.reagent1.id === reagent2Id && reaction.reagent2.id === reagent1Id)
        ) {
            return reaction
        }
    }

    // 2. Fallback: afinidade funcional por fórmula
    const r1 = ORGANIC_REAGENTS[reagent1Id]
    const r2 = ORGANIC_REAGENTS[reagent2Id]
    if (r1 && r2) {
        const affinityResult = findReactionByAffinity(r1.formula, r2.formula, temperature)
        if (affinityResult) return affinityResult
    }

    // 3. Tentar diretamente com os IDs como fórmulas (caso venham do ChemistryEngine)
    return findReactionByAffinity(reagent1Id, reagent2Id, temperature)
}

/**
 * Cria estado inicial de reação
 */
export function createReactionState(reactionId?: string): OrganicReactionState {
    return {
        reaction: reactionId ? ORGANIC_REACTIONS[reactionId] : null,
        progress: 0,
        isReacting: false,
        temperature: 25,
        stirring: false,
        threadLength: 0,
        gelViscosity: 0,
        bubbleRate: 0
    }
}

/**
 * Atualiza o estado da reação orgânica
 */
export function updateOrganicReaction(
    state: OrganicReactionState,
    deltaTime: number
): OrganicReactionState {
    if (!state.reaction || !state.isReacting) return state

    const newState = { ...state }

    // Verificar temperatura adequada
    const tempOk = !state.reaction.requiresHeat ||
        (state.temperature >= (state.reaction.optimalTemp || 25) - 10)

    if (!tempOk) {
        // Reação muito lenta se temperatura inadequada
        newState.progress += deltaTime / (state.reaction.reactionTime * 10)
    } else {
        // Progresso normal
        newState.progress += deltaTime / state.reaction.reactionTime

        // Agitação acelera a reação
        if (state.stirring) {
            newState.progress += deltaTime / (state.reaction.reactionTime * 2)
        }
    }

    // Clamp progress
    newState.progress = Math.min(newState.progress, 1)

    // Atualizar efeitos específicos por tipo
    switch (state.reaction.type) {
        case 'nylon-synthesis':
            // Comprimento do fio cresce continuamente
            if (newState.progress > 0.1) {
                newState.threadLength = (newState.threadLength || 0) + deltaTime * 0.05
            }
            break

        case 'slime-synthesis':
            // Viscosidade aumenta
            newState.gelViscosity = newState.progress * 0.85
            break

        case 'fermentation':
            // Taxa de bolhas baseada no progresso
            if (newState.progress > 0.05 && newState.progress < 0.95) {
                newState.bubbleRate = 5 + newState.progress * 10
            } else {
                newState.bubbleRate = 0
            }
            break
    }

    // Reação completa
    if (newState.progress >= 1) {
        newState.isReacting = false
    }

    return newState
}

/**
 * Calcula a cor resultante baseada no progresso
 */
export function getReactionColor(state: OrganicReactionState): string {
    if (!state.reaction) return '#ffffff'

    const { reaction, progress } = state

    // Interpolação de cor entre reagentes e produto
    const startColor = reaction.reagent1.color
    const endColor = reaction.products[0]?.color || '#ffffff'

    // Interpolação simples
    return lerpColor(startColor, endColor, progress)
}

function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)

    if (!c1 || !c2) return color1

    const r = Math.round(c1.r + (c2.r - c1.r) * t)
    const g = Math.round(c1.g + (c2.g - c1.g) * t)
    const b = Math.round(c1.b + (c2.b - c1.b) * t)

    return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

/**
 * Obtém descrição do estado atual
 */
export function getReactionStatus(state: OrganicReactionState): string {
    if (!state.reaction) return 'Sem reação'

    if (!state.isReacting && state.progress === 0) {
        return 'Pronto para reagir'
    }

    if (state.isReacting) {
        const percentage = Math.round(state.progress * 100)

        switch (state.reaction.type) {
            case 'nylon-synthesis':
                return `Polimerizando... ${percentage}% (${(state.threadLength || 0).toFixed(1)}m de fio)`
            case 'slime-synthesis':
                return `Gelificando... ${percentage}%`
            case 'fermentation':
                return `Fermentando... ${percentage}% (${state.bubbleRate?.toFixed(0) || 0} bolhas/s)`
            case 'esterification':
                return `Esterificando... ${percentage}%`
            case 'saponification':
                return `Saponificando... ${percentage}%`
            case 'oxidation':
                return `Oxidando... ${percentage}%`
            default:
                return `Reagindo... ${percentage}%`
        }
    }

    return `Reação completa: ${state.reaction.products.map(p => p.name).join(' + ')}`
}

/**
 * Obtém ícone/emoji para o efeito visual
 */
export function getEffectEmoji(effect: OrganicReaction['visualEffect']): string {
    switch (effect) {
        case 'thread-formation': return '🧵'
        case 'gel-formation': return '🟢'
        case 'bubbles': return '🫧'
        case 'color-change': return '🎨'
        case 'smell': return '👃'
        case 'heat': return '🔥'
        default: return '⚗️'
    }
}
