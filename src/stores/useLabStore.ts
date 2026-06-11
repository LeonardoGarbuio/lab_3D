// src/stores/useLabStore.ts
// Estado completo do laboratório com TODAS as funcionalidades
import { create } from 'zustand'
import { ALL_SUBSTANCES, findReaction, resolveMixture, mixColors, calculatePH } from '../systems/ChemistryEngine'
import { NamingEngine } from '../physics/NamingEngine'
import { detectHazard, type HazardEvent } from '../systems/HazardDetection'
import type { Element } from '../data/elements'
import type { Experiment } from '../data/experiments'

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════
export interface LabObject {
    id: string
    type: 'beaker' | 'test-tube' | 'erlenmeyer' | 'flask' | 'graduated-cylinder' | 'burette' | 'cylinder' | 'separating_funnel' | 'pipette' | 'roundflask'
    position: [number, number, number]
    formula: string | null
    mols: number
    fillLevel: number
    color: string
    element?: Element
    customName?: string
    isBroken: boolean
    temperature: number
    isHeating: boolean
    isShaking: boolean
    isShocking: boolean
    activeEffect: 'none' | 'bubbles' | 'smoke' | 'precipitate' | 'explosion' | 'glow' | 'fire' | 'boiling' | 'freezing' | 'evaporating' | 'spark'
    effectColor: string
    effectIntensity: number

    // ═══════════════════════════════════════════════════════════════════
    // NOVAS PROPRIEDADES QUÍMICAS
    // ═══════════════════════════════════════════════════════════════════
    ph: number                  // 0-14, 7 = neutro
    concentration: number       // mol/L
    volume: number              // mL
    phase: 'solid' | 'liquid' | 'gas' | 'aqueous'
    boilingPoint: number        // °C
    freezingPoint: number       // °C
    indicator?: string          // Indicador adicionado (phenolphthalein, etc)
    isBoiling: boolean
    isFreezing: boolean
    density: number             // g/mL

    // ═══════════════════════════════════════════════════════════════════
    // PROPRIEDADES TERMODINÂMICAS (Fase 7)
    // ═══════════════════════════════════════════════════════════════════
    isSealed: boolean           // Se o recipiente está selado (pressão acumula)
    pressure: number            // Pressão interna (atm), default 1.0
    enthalpy: number            // Entalpia acumulada (kJ), default 0
}

interface ReactionLog {
    id: string
    timestamp: Date
    equation: string
    description: string
    deltaH?: number             // Variação de entalpia
}

export interface CorrosionMark {
    id: string
    position: [number, number, number]
    strength: number
    color: string
    timestamp: number
}

// ═══════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════
interface LabState {
    objects: LabObject[]
    selectedId: string | null
    pouringFromId: string | null
    draggingId: string | null
    hoveredObjectId: string | null
    lastReaction: string | null
    analysisTarget: string | null
    reactionLog: ReactionLog[]

    // Experimentos
    currentExperiment: Experiment | null
    completedExperiments: string[]

    // UI Modais
    isPeriodicTableOpen: boolean
    isReagentPanelOpen: boolean
    isExperimentPanelOpen: boolean
    isNotebookOpen: boolean
    isQuantumMicroscopeOpen: boolean
    activeQuantumFormula: string | null
    isQuantumZoomOpen: boolean
    isAtomicModelsOpen: boolean
    isPeriodicPropertiesOpen: boolean
    isNuclearPhysicsOpen: boolean
    isSoundEnabled: boolean
    isFPSLocked: boolean
    isElectronConfigOpen: boolean
    isElectrolysisPanelOpen: boolean
    isDistillationPanelOpen: boolean
    isCabinetOpen: boolean

    // Novos painéis de equipamentos avançados
    isSpectrometerPanelOpen: boolean
    spectrometerSampleElement: string | null
    isCrystallizerPanelOpen: boolean
    crystallizerSubstanceId: string
    crystallizerIsHeating: boolean
    crystallizerIsCooling: boolean
    isOrganicPanelOpen: boolean
    organicReactionId: string
    organicIsActive: boolean
    organicTemperature: number
    organicStirring: boolean

    // Bureta funcional
    buretteFillLevel: number
    buretteIsOpen: boolean
    buretteFormula: string | null
    buretteColor: string
    burettePh: number

    // Electrolysis config
    electrolysisVoltage: number
    electrolysisElectrolyteId: string
    electrolysisRunning: boolean

    // Distillation config
    distillationHeating: boolean

    // Score/Achievements
    experimentScore: number

    // Perigos e Efeitos
    hazardEvents: HazardEvent[]
    corrosionMarks: CorrosionMark[]
    explosions: Array<{ id: string; position: [number, number, number]; power: number; color: string; timestamp: number }>

    // Ações de UI
    selectObject: (id: string | null) => void
    setHoveredObject: (id: string | null) => void
    openPeriodicTable: () => void
    closePeriodicTable: () => void
    openReagentPanel: () => void
    closeReagentPanel: () => void
    openExperimentPanel: () => void
    closeExperimentPanel: () => void
    openNotebook: () => void
    closeNotebook: () => void
    openQuantumMicroscope: (formula?: string) => void
    closeQuantumMicroscope: () => void
    openQuantumZoom: (formula?: string) => void
    closeQuantumZoom: () => void
    isIntermolecularOpen: boolean
    openIntermolecular: () => void
    closeIntermolecular: () => void
    isSolidStateOpen: boolean
    openSolidState: () => void
    closeSolidState: () => void
    openElectrolysisPanel: () => void
    closeElectrolysisPanel: () => void
    setElectrolysisVoltage: (v: number) => void
    setElectrolysisElectrolyteId: (id: string) => void
    setElectrolysisRunning: (r: boolean) => void
    openDistillationPanel: () => void
    closeDistillationPanel: () => void
    setDistillationHeating: (h: boolean) => void
    distillationMixtureId: string
    setDistillationMixtureId: (id: string) => void
    openAtomicModels: () => void
    closeAtomicModels: () => void
    setFPSLocked: (locked: boolean) => void
    openElectronConfig: () => void
    closeElectronConfig: () => void
    openPeriodicProperties: () => void
    closePeriodicProperties: () => void
    openNuclearPhysics: () => void
    closeNuclearPhysics: () => void
    openCabinet: () => void
    closeCabinet: () => void

    // Novos painéis avançados
    openSpectrometerPanel: (element?: string) => void
    closeSpectrometerPanel: () => void
    setSpectrometerSample: (element: string | null) => void
    openCrystallizerPanel: () => void
    closeCrystallizerPanel: () => void
    setCrystallizerSubstanceId: (id: string) => void
    setCrystallizerIsHeating: (h: boolean) => void
    setCrystallizerIsCooling: (c: boolean) => void
    openOrganicPanel: () => void
    closeOrganicPanel: () => void
    setOrganicReactionId: (id: string) => void
    setOrganicIsActive: (a: boolean) => void
    setOrganicTemperature: (t: number) => void
    setOrganicStirring: (s: boolean) => void

    // Bureta funcional
    setBuretteIsOpen: (open: boolean) => void
    setBuretteFillLevel: (level: number) => void
    buretteDrip: (targetId: string, delta: number) => void
    toggleSound: () => void

    // Experimentos
    startExperiment: (experiment: Experiment) => void
    completeExperiment: () => void
    quitExperiment: () => void

    // Objetos
    addObject: (obj: LabObject) => void
    removeObject: (id: string) => void
    updateObjectPosition: (id: string, position: [number, number, number]) => void

    // Elementos e substâncias
    addElementToObject: (id: string, element: Element) => void
    addSubstanceToObject: (id: string, formula: string, mols: number) => void

    // Pouring e Dragging
    startPouring: (fromId: string) => void
    pourInto: (toId: string) => void
    cancelPouring: () => void
    startDragging: (id: string) => void
    stopDragging: () => void

    // Ações físicas
    startHeating: (id: string) => void
    stopHeating: (id: string) => void
    startShocking: (id: string) => void
    stopShocking: (id: string) => void
    startFreezing: (id: string) => void
    stopFreezing: (id: string) => void
    shakeObject: (id: string) => void
    coolDown: (id: string) => void
    emptyObject: (id: string) => void
    breakObject: (id: string) => void
    
    // Termodinâmica (Fase 7)
    sealObject: (id: string) => void
    unsealObject: (id: string) => void

    // Análise
    startAnalysis: (id: string) => void
    stopAnalysis: () => void

    // Perigos
    triggerHazard: (event: HazardEvent) => void
    addCorrosionMark: (mark: Omit<CorrosionMark, 'id' | 'timestamp'>) => void
    addExplosion: (position: [number, number, number], power: number, color?: string) => void
    clearExplosion: (id: string) => void

    // Feedback
    setLastReaction: (msg: string | null) => void

    // Reset
    resetLab: () => void
}

// Objetos iniciais
const createInitialObjects = (): LabObject[] => {
    const objects: LabObject[] = []
    // 5 beakers na bancada central, bem espaçados
    for (let i = 0; i < 5; i++) {
        objects.push({
            id: `beaker-${i + 1}`,
            type: 'beaker',
            position: [-2.5 + i * 1.2, 1.05, 0.5],
            formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4',
            isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
            activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
            ph: 7, concentration: 0, volume: 0, phase: 'liquid',
            boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
            density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
        })
    }
    // Erlenmeyer — sob a bureta na bancada central
    objects.push({
        id: 'erlenmeyer-1',
        type: 'erlenmeyer' as any,
        position: [-1.0, 1.15, -0.5], // Embaixo da bureta
        formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4',
        isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
        activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
        ph: 7, concentration: 0, volume: 0, phase: 'liquid',
        boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
        density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
    })
    // Pipeta volumetrica — bancada frontal
    objects.push({
        id: 'pipette-1',
        type: 'pipette' as any,
        position: [-1.7, 1.55, 0.0],
        formula: null, mols: 0, fillLevel: 0, color: '#ffffff',
        isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
        activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
        ph: 7, concentration: 0, volume: 0, phase: 'liquid',
        boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
        density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
    })
    // Balao de fundo redondo — bancada frontal
    objects.push({
        id: 'roundflask-1',
        type: 'roundflask' as any,
        position: [-2.5, 1.25, -0.5], // No tripé
        formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4',
        isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
        activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
        ph: 7, concentration: 0, volume: 0, phase: 'liquid',
        boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
        density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
    })

    // Proveta Graduada
    objects.push({
        id: 'cylinder-1',
        type: 'cylinder' as any,
        position: [2.8, 1.5, -0.5],
        formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4',
        isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
        activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
        ph: 7, concentration: 0, volume: 0, phase: 'liquid',
        boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
        density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
    })

    // Funil de Separação
    objects.push({
        id: 'separating_funnel-1',
        type: 'separating_funnel' as any,
        position: [0.2, 1.7, -0.5],
        formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4',
        isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
        activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
        ph: 7, concentration: 0, volume: 0, phase: 'liquid',
        boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
        density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
    })

    // 5 Tubos de Ensaio
    for (let i = 0; i < 5; i++) {
        objects.push({
            id: `test-tube-${i + 1}`,
            type: 'test-tube',
            position: [1.0 + i * 0.3, 1.57, -0.5], // alinhado aos furos do rack
            formula: null, mols: 0, fillLevel: 0, color: '#ff6b6b',
            isBroken: false, temperature: 25, isHeating: false, isShaking: false, isShocking: false,
            activeEffect: 'none', effectColor: '#ffffff', effectIntensity: 1,
            ph: 7, concentration: 0, volume: 0, phase: 'liquid',
            boilingPoint: 100, freezingPoint: 0, isBoiling: false, isFreezing: false,
            density: 1.0, isSealed: false, pressure: 1.0, enthalpy: 0,
        })
    }
    return objects
}

export const useLabStore = create<LabState>((set, get) => ({
    objects: createInitialObjects(),
    selectedId: null,
    pouringFromId: null,
    draggingId: null,
    hoveredObjectId: null,
    lastReaction: null,
    analysisTarget: null,
    reactionLog: [],
    currentExperiment: null,
    completedExperiments: [],
    isPeriodicTableOpen: false,
    isReagentPanelOpen: false,
    isExperimentPanelOpen: false,
    isNotebookOpen: false,
    isQuantumMicroscopeOpen: false,
    activeQuantumFormula: null,
    isQuantumZoomOpen: false,
    isAtomicModelsOpen: false,
    isPeriodicPropertiesOpen: false,
    isNuclearPhysicsOpen: false,
    isIntermolecularOpen: false,
    isSolidStateOpen: false,
    isSoundEnabled: true,
    isFPSLocked: false,
    isElectronConfigOpen: false,
    isElectrolysisPanelOpen: false,
    isDistillationPanelOpen: false,
    isCabinetOpen: false,
    electrolysisVoltage: 6,
    electrolysisElectrolyteId: 'sulfuricAcid',
    electrolysisRunning: false,
    distillationHeating: false,
    distillationMixtureId: 'ethanolWater',
    experimentScore: 0,

    // Novos painéis avançados
    isSpectrometerPanelOpen: false,
    spectrometerSampleElement: null,
    isCrystallizerPanelOpen: false,
    crystallizerSubstanceId: 'NaCl',
    crystallizerIsHeating: false,
    crystallizerIsCooling: false,
    isOrganicPanelOpen: false,
    organicReactionId: 'fermentation',
    organicIsActive: false,
    organicTemperature: 25,
    organicStirring: false,

    // Bureta funcional
    buretteFillLevel: 0,
    buretteIsOpen: false,
    buretteFormula: 'NaOH',
    buretteColor: '#4ecdc4',
    burettePh: 13,

    // Perigos e Efeitos - Estados iniciais
    hazardEvents: [],
    corrosionMarks: [],
    explosions: [],

    // UI
    selectObject: (id) => set({ selectedId: id }),
    setHoveredObject: (id) => set({ hoveredObjectId: id }),
    openPeriodicTable: () => set({ isPeriodicTableOpen: true }),
    closePeriodicTable: () => set({ isPeriodicTableOpen: false }),
    openReagentPanel: () => set({ isReagentPanelOpen: true }),
    closeReagentPanel: () => set({ isReagentPanelOpen: false }),
    openExperimentPanel: () => set({ isExperimentPanelOpen: true }),
    closeExperimentPanel: () => set({ isExperimentPanelOpen: false }),
    openNotebook: () => set({ isNotebookOpen: true }),
    closeNotebook: () => set({ isNotebookOpen: false }),
    openQuantumMicroscope: (formula) => set({ isQuantumMicroscopeOpen: true, activeQuantumFormula: formula || null }),
    closeQuantumMicroscope: () => set({ isQuantumMicroscopeOpen: false, activeQuantumFormula: null }),
    openQuantumZoom: (formula) => set({ isQuantumZoomOpen: true, activeQuantumFormula: formula || null }),
    closeQuantumZoom: () => set({ isQuantumZoomOpen: false }),
    openIntermolecular: () => set({ isIntermolecularOpen: true }),
    closeIntermolecular: () => set({ isIntermolecularOpen: false }),
    openSolidState: () => set({ isSolidStateOpen: true }),
    closeSolidState: () => set({ isSolidStateOpen: false }),
    openElectrolysisPanel: () => set({ isElectrolysisPanelOpen: true }),
    closeElectrolysisPanel: () => set({ isElectrolysisPanelOpen: false, electrolysisRunning: false }),
    setElectrolysisVoltage: (v) => set({ electrolysisVoltage: v }),
    setElectrolysisElectrolyteId: (id) => set({ electrolysisElectrolyteId: id }),
    setElectrolysisRunning: (r) => set({ electrolysisRunning: r }),
    openDistillationPanel: () => set({ isDistillationPanelOpen: true }),
    closeDistillationPanel: () => set({ isDistillationPanelOpen: false }),
    setDistillationHeating: (h) => set({ distillationHeating: h }),
    setDistillationMixtureId: (id) => set({ distillationMixtureId: id }),
    openAtomicModels: () => set({ isAtomicModelsOpen: true }),
    closeAtomicModels: () => set({ isAtomicModelsOpen: false }),
    setFPSLocked: (locked) => set({ isFPSLocked: locked }),
    openElectronConfig: () => set({ isElectronConfigOpen: true }),
    closeElectronConfig: () => set({ isElectronConfigOpen: false }),
    openPeriodicProperties: () => set({ isPeriodicPropertiesOpen: true }),
    closePeriodicProperties: () => set({ isPeriodicPropertiesOpen: false }),
    openNuclearPhysics: () => set({ isNuclearPhysicsOpen: true }),
    closeNuclearPhysics: () => set({ isNuclearPhysicsOpen: false }),
    openCabinet: () => set({ isCabinetOpen: true }),
    closeCabinet: () => set({ isCabinetOpen: false }),

    // Novos painéis avançados
    openSpectrometerPanel: (element) => set({ isSpectrometerPanelOpen: true, spectrometerSampleElement: element || null }),
    closeSpectrometerPanel: () => set({ isSpectrometerPanelOpen: false }),
    setSpectrometerSample: (element) => set({ spectrometerSampleElement: element }),
    openCrystallizerPanel: () => set({ isCrystallizerPanelOpen: true }),
    closeCrystallizerPanel: () => set({ isCrystallizerPanelOpen: false }),
    setCrystallizerSubstanceId: (id) => set({ crystallizerSubstanceId: id }),
    setCrystallizerIsHeating: (h) => set({ crystallizerIsHeating: h }),
    setCrystallizerIsCooling: (c) => set({ crystallizerIsCooling: c }),
    openOrganicPanel: () => set({ isOrganicPanelOpen: true }),
    closeOrganicPanel: () => set({ isOrganicPanelOpen: false, organicIsActive: false }),
    setOrganicReactionId: (id) => set({ organicReactionId: id, organicIsActive: false }),
    setOrganicIsActive: (a) => set({ organicIsActive: a }),
    setOrganicTemperature: (t) => set({ organicTemperature: t }),
    setOrganicStirring: (s) => set({ organicStirring: s }),

    // Bureta funcional
    setBuretteIsOpen: (open) => set({ buretteIsOpen: open }),
    setBuretteFillLevel: (level) => set({ buretteFillLevel: level }),
    buretteDrip: (targetId, delta) => {
        const state = get()
        if (!state.buretteIsOpen || state.buretteFillLevel <= 0) return

        const dripRate = 0.03 // por segundo
        const dripAmount = dripRate * delta
        const newFill = Math.max(0, state.buretteFillLevel - dripAmount)

        const target = state.objects.find(o => o.id === targetId)
        if (target && !target.isBroken && target.fillLevel < 1) {
            const addedFill = Math.min(dripAmount * 2, 1 - target.fillLevel)
            // Mistura de pH simples
            const oldPh = target.ph || 7
            const burettePh = state.burettePh
            const ratio = addedFill / (target.fillLevel + addedFill + 0.01)
            const newPh = oldPh + (burettePh - oldPh) * ratio

            set({
                buretteFillLevel: newFill,
                objects: state.objects.map(o =>
                    o.id === targetId
                        ? {
                            ...o,
                            fillLevel: Math.min(1, o.fillLevel + addedFill),
                            formula: o.formula || state.buretteFormula,
                            color: o.formula ? o.color : state.buretteColor,
                            ph: newPh,
                        }
                        : o
                )
            })
        } else {
            set({ buretteFillLevel: newFill })
        }
    },
    toggleSound: () => set((s) => ({ isSoundEnabled: !s.isSoundEnabled })),

    // Experimentos
    startExperiment: (experiment) => set({ currentExperiment: experiment, isExperimentPanelOpen: false, lastReaction: `📚 Iniciando: ${experiment.title}` }),
    completeExperiment: () => {
        const exp = get().currentExperiment
        if (exp) {
            set((s) => ({
                completedExperiments: [...s.completedExperiments, exp.id],
                experimentScore: s.experimentScore + (exp.difficulty === 'fácil' ? 10 : exp.difficulty === 'médio' ? 20 : 30),
                currentExperiment: null,
                lastReaction: `🎉 ${exp.title} concluído! +${exp.difficulty === 'fácil' ? 10 : exp.difficulty === 'médio' ? 20 : 30} pontos`,
            }))
        }
    },
    quitExperiment: () => set({ currentExperiment: null }),

    // Objetos
    addObject: (obj) => set((s) => ({ objects: [...s.objects, obj] })),
    removeObject: (id) => set((s) => ({ objects: s.objects.filter(o => o.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })),
    updateObjectPosition: (id, position) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, position } : o) })),

    // Elementos
    addElementToObject: (id, element) => {
        // Elementos diatômicos na natureza (estado padrão gasoso/líquido)
        const diatomicElements = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']
        let formula = element.symbol
        let mols = 1.0

        if (diatomicElements.includes(element.symbol)) {
            formula = `${element.symbol}2`
            mols = 0.5 // 1 mol de átomos = 0.5 mol de moléculas diatômicas
        }

        set((s) => ({
            objects: s.objects.map(o => o.id === id ? {
                ...o,
                formula: formula,
                element,
                mols: mols,
                color: element.color,
                fillLevel: 0.6,
                customName: element.namePt,
                phase: diatomicElements.includes(element.symbol) ? (element.symbol === 'Br' ? 'liquid' : (element.symbol === 'I' ? 'solid' : 'gas')) : 'solid'
            } : o),
            lastReaction: `⚛️ ${element.namePt} (${formula})`,
        }))
        setTimeout(() => set((s) => s.lastReaction?.includes(element.namePt) ? { lastReaction: null } : s), 2000)
    },

    addSubstanceToObject: (id, formula, mols) => {
        const substance = ALL_SUBSTANCES[formula]
        if (!substance) return

        // Calcular pH baseado na substância
        const substancePH = calculatePH(formula, mols > 0 ? mols : 1)

        // Determinar fase baseado na substância
        const phase = substance.phase || 'aqueous'

        // Volume em mL (aproximado: 1 mol ~ 100mL para soluções)
        const volume = mols * 100

        // Concentração
        const concentration = volume > 0 ? mols / (volume / 1000) : 0

        set((s) => ({
            objects: s.objects.map(o => o.id === id ? {
                ...o,
                formula,
                mols,
                color: substance.color,
                fillLevel: Math.min(1, mols / 2),
                customName: substance.name,
                // Novas propriedades
                ph: substancePH,
                volume: volume,
                concentration: concentration,
                phase: phase as LabObject['phase'],
                boilingPoint: substance.boilingPoint || 100,
                freezingPoint: substance.freezingPoint || 0,
                density: substance.density ? substance.density / 1000 : 1.0,
            } : o),
            lastReaction: `➕ ${substance.name} (pH: ${substancePH.toFixed(1)})`,
            isReagentPanelOpen: false,
        }))
    },

    // Pouring
    startPouring: (fromId) => {
        const obj = get().objects.find(o => o.id === fromId)
        if (obj && obj.fillLevel > 0 && !obj.isBroken) set({ pouringFromId: fromId, lastReaction: '🫗 Clique para despejar...' })
    },

    pourInto: (toId) => {
        const { pouringFromId, objects } = get()
        const from = objects.find(o => o.id === pouringFromId)
        const to = objects.find(o => o.id === toId)
        if (!from || !to || from.id === to.id || to.isBroken) { set({ pouringFromId: null, lastReaction: null }); return }

        // Calculate maximum transfer possible (up to 0.5 mols or available space/amount)
        const transferMols = Math.min(from.mols, 0.5)
        // Ratio of volume transferred
        const volumeRatio = from.mols > 0 ? transferMols / from.mols : 0
        const transferLevel = from.fillLevel * volumeRatio

        // Thermal Equilibrium Calculation
        const totalMols = to.mols + transferMols
        const effectiveTemp = totalMols > 0
            ? ((to.temperature * to.mols) + (from.temperature * transferMols)) / totalMols
            : to.temperature

        let msg = '', newColor = to.color, newFormula = to.formula
        const finalMols = totalMols
        let effect: LabObject['activeEffect'] = 'none', effectColor = '#fff'
        let exploded = false

        if (!to.formula) {
            // Empty beaker - just transfer
            newFormula = from.formula
            newColor = from.color
            msg = `✅ ${from.customName || from.formula}`
        }
        else if (from.formula && to.formula) {
            const sub1 = ALL_SUBSTANCES[from.formula]
            const sub2 = ALL_SUBSTANCES[to.formula]

            // ⚠️ NOVA LÓGICA: Detectar perigos PRIMEIRO
            if (sub1 && sub2) {
                const hazard = detectHazard(sub1, sub2, effectiveTemp)

                if (hazard) {
                    hazard.position = to.position

                    if (hazard.type === 'explosion') {
                        // 💥 EXPLOSÃO!
                        exploded = true
                        get().triggerHazard(hazard)
                        get().addExplosion(to.position, hazard.severity, hazard.effectColor)

                        // Quebrar recipiente e recipientes próximos
                        get().breakObject(toId)

                        const explosionRadius = hazard.severity * 0.4
                        objects.forEach(obj => {
                            if (obj.id === toId || obj.id === from.id) return
                            const dx = obj.position[0] - to.position[0]
                            const dz = obj.position[2] - to.position[2]
                            const distance = Math.sqrt(dx * dx + dz * dz)

                            if (distance < explosionRadius) {
                                get().breakObject(obj.id)
                            }
                        })

                        // Se o recipiente quebrou e tem substância corrosiva, adicionar marcas de corrosão
                        if (sub2.isCorrosive || sub1.isCorrosive) {
                            const corrosiveSubstance = sub2.isCorrosive ? sub2 : sub1
                            get().addCorrosionMark({
                                position: to.position,
                                strength: corrosiveSubstance.corrosionStrength || 5,
                                color: corrosiveSubstance.color
                            })
                        }

                        set({ pouringFromId: null, lastReaction: '💥 EXPLOSÃO!' })
                        return
                    }
                    else if (hazard.type === 'violent-reaction') {
                        // 🔥 Reação violenta (não explode, mas gera calor extremo)
                        effect = 'fire'
                        effectColor = hazard.effectColor || '#ff6600'
                        msg = hazard.description

                        get().triggerHazard(hazard)
                    }
                }
            }

            // NOVO MOTOR UNIVERSAL: Resolver toda a mistura iterativamente!
            const currentFormulas = (to.formula || '').split('+').map(s => s.trim()).filter(Boolean)
            const incomingFormulas = (from.formula || '').split('+').map(s => s.trim()).filter(Boolean)
            const mixture = [...currentFormulas, ...incomingFormulas]

            const mixtureResult = resolveMixture(mixture, effectiveTemp)

            if (!exploded && mixtureResult.description !== 'Mistura sem reação') {
                // REAÇÃO ACONTECE!
                newFormula = mixtureResult.formulas.join('+')
                newColor = mixtureResult.color || newColor
                effect = mixtureResult.effect as LabObject['activeEffect']
                effectColor = mixtureResult.effectColor || '#fff'
                msg = `⚗️ ${mixtureResult.description}`

                const finalTemp = effectiveTemp + (effect === 'explosion' || (effect === 'fire') ? 200 : 0)

                // Gerar Nome via IUPAC / NamingEngine
                let generatedName = to.customName
                if (newFormula) {
                    const parts = newFormula.split('+').map(f => f.trim())
                    if (parts.length === 1) {
                        generatedName = NamingEngine.generateName(parts[0])
                    } else {
                        generatedName = parts.map(f => NamingEngine.generateName(f)).join(' + ')
                    }
                }

                // Log it
                set((s) => ({
                    reactionLog: [...s.reactionLog, {
                        id: `${Date.now()}`,
                        timestamp: new Date(),
                        equation: mixture.join(' + ') + ' → ' + newFormula,
                        description: mixtureResult.description,
                        deltaH: mixtureResult.deltaH,
                    }]
                }))

                set((s) => ({
                    objects: s.objects.map(o => {
                        if (o.id === from.id) {
                            const empty = o.fillLevel - transferLevel <= 0.05
                            return {
                                ...o,
                                fillLevel: Math.max(0, o.fillLevel - transferLevel),
                                mols: Math.max(0, o.mols - transferMols),
                                formula: empty ? null : o.formula,
                                customName: empty ? undefined : o.customName
                            }
                        }
                        if (o.id === to.id) {
                            return {
                                ...o,
                                formula: newFormula,
                                customName: generatedName,
                                mols: finalMols,
                                fillLevel: Math.min(1, o.fillLevel + transferLevel),
                                color: newColor,
                                activeEffect: effect,
                                effectColor: effectColor,
                                temperature: finalTemp,
                                // Atualiza propriedades térmicas
                                isBoiling: finalTemp >= ((newFormula && ALL_SUBSTANCES[newFormula]?.boilingPoint) || 100),
                                isFreezing: finalTemp <= ((newFormula && ALL_SUBSTANCES[newFormula]?.freezingPoint) || 0)
                            }
                        }
                        return o
                    }),
                    pouringFromId: null, lastReaction: msg
                }))
            } else if (!exploded) {
                // No reaction found, just a physical mixture
                newColor = mixColors(from.color, to.color, transferMols / totalMols)
                newFormula = mixtureResult.formulas.join('+')
                msg = `🔀 Mistura misturada`
                
                set((s) => ({
                    objects: s.objects.map(o => {
                        if (o.id === from.id) return { ...o, mols: Math.max(0, o.mols - transferMols), fillLevel: Math.max(0, o.fillLevel - transferLevel) }
                        if (o.id === to.id) return {
                            ...o,
                            formula: newFormula,
                            mols: finalMols,
                            fillLevel: Math.min(1, o.fillLevel + transferLevel),
                            color: newColor,
                            temperature: effectiveTemp
                        }
                        return o
                    }),
                    pouringFromId: null, lastReaction: msg
                }))
            }
        }

        if (exploded) {
            get().breakObject(to.id)
            set({ pouringFromId: null, lastReaction: '💥 EXPLOSÃO!' })
            return
        }

        const finalTemp = effectiveTemp + (effect === 'explosion' || (effect === 'fire') ? 200 : 0)

        set((s) => ({
            objects: s.objects.map(o => {
                if (o.id === from.id) return { ...o, mols: Math.max(0, o.mols - transferMols), fillLevel: Math.max(0, o.fillLevel - transferLevel) }
                if (o.id === to.id) return {
                    ...o,
                    formula: newFormula,
                    mols: finalMols,
                    fillLevel: Math.min(1, o.fillLevel + transferLevel),
                    color: newColor,
                    activeEffect: effect,
                    effectColor,
                    effectIntensity: 1,
                    temperature: finalTemp,
                    customName: (newFormula ?? '').includes('+') ? 'Mistura' : (effect !== 'none' ? (newFormula || undefined) : o.customName),
                    element: undefined
                }
                return o
            }),
            pouringFromId: null, lastReaction: msg
        }))
        setTimeout(() => set((s) => ({ objects: s.objects.map(o => o.id === toId ? { ...o, activeEffect: 'none' } : o) })), 4000)
        setTimeout(() => set((s) => s.lastReaction === msg ? { lastReaction: null } : s), 2500)
    },
    cancelPouring: () => set({ pouringFromId: null, lastReaction: null }),

    // Dragging
    startDragging: (id) => set({ draggingId: id }),
    stopDragging: () => set({ draggingId: null }),

    // Termodinâmica (Fase 7)
    sealObject: (id) => set((s) => ({
        objects: s.objects.map(o => o.id === id ? { ...o, isSealed: true } : o)
    })),
    unsealObject: (id) => set((s) => ({
        objects: s.objects.map(o => o.id === id ? { ...o, isSealed: false, pressure: 1.0 } : o)
    })),

    // Ações físicas - AQUECIMENTO ATÉ 5000°C COM TRANSIÇÕES DE FASE
    startHeating: (id) => {
        set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isHeating: true, activeEffect: 'bubbles', effectColor: '#ff6600' } : o), lastReaction: '🔥 Aquecendo...' }))
        const interval = setInterval(() => {
            const obj = get().objects.find(o => o.id === id)
            if (!obj || !obj.isHeating) { clearInterval(interval); return }

            // Aquece gradualmente
            const newTemp = Math.min(1000000, obj.temperature + 50)

            // TRANSIÇÃO DE FASE - Verificar ebulição
            let newPhase = obj.phase
            let isBoiling = false
            let effect: typeof obj.activeEffect = 'bubbles'

            if (newTemp >= obj.boilingPoint && obj.phase === 'liquid') {
                newPhase = 'gas'
                isBoiling = true
                effect = 'boiling'
            } else if (newTemp >= obj.freezingPoint && obj.phase === 'solid') {
                newPhase = 'liquid'
                effect = 'bubbles'
            }

            // Efeitos visuais baseados na temperatura
            if (newTemp > 1000) effect = 'fire'
            else if (newTemp > obj.boilingPoint) effect = 'evaporating'
            else if (isBoiling) effect = 'boiling'

            const finalTemp = newTemp
            let finalFormula = obj.formula
            let finalColor = obj.color
            let finalName = obj.customName
            const finalPhase = newPhase
            let effectColor = obj.effectColor

            // VERIFICAÇÃO DE REAÇÃO TÉRMICA PARA MISTURAS
            let reacted = false
            let exploded = false

            if (obj.formula && obj.formula.includes('+')) {
                const parts = obj.formula.split('+')
                if (parts.length >= 2) {
                    const reaction = findReaction(parts[0] ?? '', parts[1] ?? '', newTemp)
                    
                    if (reaction && reaction.viable) {
                        reacted = true
                        finalFormula = reaction.products[0] ?? finalFormula
                        finalColor = reaction.productColor || finalColor
                        
                        // Verificar explosão/instabilidade térmica
                        const maxTemp = reaction.requiredTemp?.max ?? 10000
                        if (newTemp > maxTemp || reaction.unstable) {
                            exploded = true
                        } else {
                            // Reação bem sucedida
                            effect = reaction.effect as typeof obj.activeEffect
                            effectColor = reaction.effectColor || '#fff'
                            finalName = finalFormula // Remove o nome 'Mistura'
                            
                            // Log
                            set((s) => ({
                                reactionLog: [...s.reactionLog, {
                                    id: `${Date.now()}`,
                                    timestamp: new Date(),
                                    equation: reaction.equation,
                                    description: reaction.description,
                                    deltaH: reaction.deltaH,
                                }]
                            }))
                            get().setLastReaction(`⚗️ ${reaction.description}`)
                        }
                    }
                }
            }

            if (exploded) {
                clearInterval(interval)
                get().breakObject(id)
                get().setLastReaction('💥 EXPLOSÃO TÉRMICA!')
                
                // Add explosion effect
                get().addExplosion(obj.position, 2, '#ff6600')
                return
            }

            set((s) => ({
                objects: s.objects.map(o => o.id === id ? {
                    ...o,
                    temperature: finalTemp,
                    phase: finalPhase,
                    isBoiling: isBoiling,
                    activeEffect: effect,
                    effectColor: reacted ? effectColor : (newTemp > 1500 ? '#ff2200' : newTemp > 500 ? '#ff4400' : '#ff6600'),
                    effectIntensity: Math.min(1, newTemp / 500),
                    volume: isBoiling ? Math.max(0, o.volume - 5) : o.volume,
                    fillLevel: isBoiling ? Math.max(0, o.fillLevel - 0.02) : o.fillLevel,
                    formula: finalFormula,
                    color: finalColor,
                    customName: finalName
                } : o),
                lastReaction: reacted ? get().lastReaction : (isBoiling
                    ? `🫧 ${newTemp}°C - EBULIÇÃO! (${obj.boilingPoint}°C)`
                    : `🌡️ ${newTemp}°C${newPhase !== obj.phase ? ` → ${newPhase}` : ''}`)
            }))
            if (newTemp >= 1000000) clearInterval(interval)
        }, 300)
    },
    stopHeating: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isHeating: false, isBoiling: false, activeEffect: 'none' } : o), lastReaction: '⏹️ Aquecimento parado' })),

    startShocking: (id) => {
        set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isShocking: true, activeEffect: 'spark', effectColor: '#e0ffff' } : o), lastReaction: '⚡ Descarga Elétrica Ativada...' }))
        const interval = setInterval(() => {
            const obj = get().objects.find(o => o.id === id)
            if (!obj || !obj.isShocking) { clearInterval(interval); return }
            
            // Avaliar reações (passando true para isShocking)
            const mixture = (obj.formula || '').split('+').map(s => s.trim()).filter(Boolean)
            const resolved = resolveMixture(mixture, obj.temperature, true)
            
            let reacted = false
            let finalName = obj.customName
            let newFormula = resolved.formulas.join('+')

            if (newFormula !== obj.formula) {
                reacted = true
                
                // Gerar Nome via IUPAC / NamingEngine
                if (newFormula) {
                    const parts = newFormula.split('+').map(f => f.trim())
                    if (parts.length === 1) {
                        finalName = NamingEngine.generateName(parts[0])
                    } else {
                        finalName = parts.map(f => NamingEngine.generateName(f)).join(' + ')
                    }
                }
            }

            set((s) => ({
                objects: s.objects.map(o => o.id === id ? {
                    ...o,
                    formula: newFormula || null,
                    color: resolved.color || o.color,
                    activeEffect: reacted ? (resolved.effect as LabObject['activeEffect']) : o.activeEffect,
                    effectColor: reacted ? resolved.effectColor : o.effectColor,
                    customName: finalName
                } : o),
                lastReaction: reacted ? `⚡ ${resolved.description}` : get().lastReaction
            }))
        }, 500)
    },
    stopShocking: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isShocking: false, activeEffect: 'none' } : o), lastReaction: '⏹️ Descarga Elétrica Desligada' })),


    // Congelamento gradual COM TRANSIÇÃO DE FASE
    startFreezing: (id) => {
        set((s) => ({
            objects: s.objects.map(o => o.id === id ? { ...o, isHeating: false, activeEffect: 'glow', effectColor: '#00bfff' } : o),
            lastReaction: '🧊 Congelando...'
        }))
        const interval = setInterval(() => {
            const obj = get().objects.find(o => o.id === id)
            if (!obj) { clearInterval(interval); return }
            if (obj.isHeating) { clearInterval(interval); return }

            const newTemp = Math.max(-273, obj.temperature - 10)

            // TRANSIÇÃO DE FASE - Verificar congelamento
            let newPhase = obj.phase
            let isFreezing = false
            let effect: typeof obj.activeEffect = 'glow'

            if (newTemp <= obj.freezingPoint && obj.phase === 'liquid') {
                newPhase = 'solid'
                isFreezing = true
                effect = 'freezing'
            } else if (newTemp <= obj.freezingPoint && obj.phase === 'gas') {
                newPhase = 'liquid' // Condensação
            }

            set((s) => ({
                objects: s.objects.map(o => o.id === id ? {
                    ...o,
                    temperature: newTemp,
                    phase: newPhase,
                    isFreezing: isFreezing,
                    activeEffect: newTemp < 0 ? effect : 'none',
                    effectColor: '#00bfff'
                } : o),
                lastReaction: isFreezing
                    ? `❄️ ${newTemp}°C - CONGELANDO! (${obj.freezingPoint}°C)`
                    : newTemp <= -273 ? '❄️ Zero Absoluto! -273°C' : `🧊 ${newTemp}°C`
            }))
            if (newTemp <= -273) clearInterval(interval)
        }, 400)
    },
    stopFreezing: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isFreezing: false, activeEffect: 'none' } : o), lastReaction: '⏹️ Congelamento parado' })),

    shakeObject: (id) => {
        set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isShaking: true, activeEffect: 'bubbles', effectIntensity: 0.5 } : o), lastReaction: '🌀 Agitando...' }))
        setTimeout(() => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isShaking: false, activeEffect: 'none' } : o), lastReaction: null })), 2000)
    },
    coolDown: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, temperature: 25, isHeating: false, activeEffect: 'none' } : o), lastReaction: '🌡️ Ambiente: 25°C' })),
    emptyObject: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, formula: null, mols: 0, fillLevel: 0, color: '#4ecdc4', element: undefined, customName: undefined, activeEffect: 'none' } : o), lastReaction: '🗑️ Esvaziado' })),
    breakObject: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isBroken: true, fillLevel: 0, activeEffect: 'none', isHeating: false, isShocking: false } : o), lastReaction: '💥 Quebrado!', selectedId: null })),

    startAnalysis: (id) => set({ analysisTarget: id }),
    stopAnalysis: () => set({ analysisTarget: null }),
    setLastReaction: (msg) => set({ lastReaction: msg }),

    // Métodos de Perigos
    triggerHazard: (event) => {
        set((s) => ({
            hazardEvents: [...s.hazardEvents, event],
            lastReaction: event.description
        }))

        // Remover evento após 5 segundos
        setTimeout(() => {
            set((s) => ({
                hazardEvents: s.hazardEvents.filter(e => e !== event)
            }))
        }, 5000)
    },

    addCorrosionMark: (mark) => {
        const newMark: CorrosionMark = {
            ...mark,
            id: `corrosion-${Date.now()}-${Math.random()}`,
            timestamp: Date.now()
        }

        set((s) => ({
            corrosionMarks: [...s.corrosionMarks, newMark]
        }))
    },

    addExplosion: (position, power, color = '#ff6600') => {
        const explosion = {
            id: `explosion-${Date.now()}`,
            position,
            power,
            color,
            timestamp: Date.now()
        }

        set((s) => ({
            explosions: [...s.explosions, explosion]
        }))
    },

    clearExplosion: (id) => {
        set((s) => ({
            explosions: s.explosions.filter(e => e.id !== id)
        }))
    },

    resetLab: () => set({ objects: createInitialObjects(), selectedId: null, pouringFromId: null, draggingId: null, lastReaction: '🔄 Reiniciado!', analysisTarget: null, reactionLog: [], currentExperiment: null }),
}))
