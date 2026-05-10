// src/stores/useLabStore.ts
// Estado completo do laboratório com TODAS as funcionalidades
import { create } from 'zustand'
import { COMMON_SUBSTANCES, ALL_SUBSTANCES, findReaction, mixColors, calculatePH } from '../systems/ChemistryEngine'
import { detectHazard, type HazardEvent } from '../systems/HazardDetection'
import type { Element } from '../data/elements'
import type { Experiment } from '../data/experiments'

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════
export interface LabObject {
    id: string
    type: 'beaker' | 'test-tube' | 'erlenmeyer' | 'flask' | 'graduated-cylinder' | 'burette'
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
    activeEffect: 'none' | 'bubbles' | 'smoke' | 'precipitate' | 'explosion' | 'glow' | 'fire' | 'boiling' | 'freezing' | 'evaporating'
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
    isAtomicModelsOpen: boolean
    isPeriodicPropertiesOpen: boolean
    isNuclearPhysicsOpen: boolean
    isSoundEnabled: boolean
    isFPSLocked: boolean
    isElectronConfigOpen: boolean

    // Score/Achievements
    experimentScore: number

    // Perigos e Efeitos
    hazardEvents: HazardEvent[]
    corrosionMarks: CorrosionMark[]
    explosions: Array<{ id: string; position: [number, number, number]; power: number; color: string; timestamp: number }>

    // Ações de UI
    selectObject: (id: string | null) => void
    openPeriodicTable: () => void
    closePeriodicTable: () => void
    openReagentPanel: () => void
    closeReagentPanel: () => void
    openExperimentPanel: () => void
    closeExperimentPanel: () => void
    openNotebook: () => void
    closeNotebook: () => void
    openQuantumMicroscope: () => void
    closeQuantumMicroscope: () => void
    isIntermolecularOpen: boolean
    openIntermolecular: () => void
    closeIntermolecular: () => void
    isSolidStateOpen: boolean
    openSolidState: () => void
    closeSolidState: () => void
    openAtomicModels: () => void
    closeAtomicModels: () => void
    setFPSLocked: (locked: boolean) => void
    openElectronConfig: () => void
    closeElectronConfig: () => void
    openPeriodicProperties: () => void
    closePeriodicProperties: () => void
    openNuclearPhysics: () => void
    closeNuclearPhysics: () => void
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
    startFreezing: (id: string) => void
    stopFreezing: (id: string) => void
    shakeObject: (id: string) => void
    coolDown: (id: string) => void
    emptyObject: (id: string) => void
    breakObject: (id: string) => void

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
    // Apenas 5 béqueres, posicionados no centro-frente da bancada
    const positions: [number, number, number][] = [
        [-0.8, 1.05, 0.35],   // Centro-esquerda
        [-0.2, 1.05, 0.35],   // Centro
        [0.4, 1.05, 0.35],    // Centro-direita
        [1.0, 1.05, 0.35],    // Direita
        [1.6, 1.05, 0.35],    // Extrema direita
    ]
    positions.forEach((pos, i) => {
        objects.push({
            id: `beaker-${i + 1}`,
            type: 'beaker',
            position: pos,
            formula: null,
            mols: 0,
            fillLevel: 0,
            color: '#4ecdc4',
            isBroken: false,
            temperature: 25,
            isHeating: false,
            isShaking: false,
            activeEffect: 'none',
            effectColor: '#ffffff',
            effectIntensity: 1,
            // Novas propriedades químicas
            ph: 7,                    // Neutro quando vazio
            concentration: 0,         // mol/L
            volume: 0,                // mL
            phase: 'liquid',          // Estado padrão
            boilingPoint: 100,        // Água como padrão
            freezingPoint: 0,
            isBoiling: false,
            isFreezing: false,
            density: 1.0,             // g/mL
        })
    })
    return objects
}

export const useLabStore = create<LabState>((set, get) => ({
    objects: createInitialObjects(),
    selectedId: null,
    pouringFromId: null,
    draggingId: null,
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
    isAtomicModelsOpen: false,
    isPeriodicPropertiesOpen: false,
    isNuclearPhysicsOpen: false,
    isIntermolecularOpen: false,
    isSolidStateOpen: false,
    isSoundEnabled: true,
    isFPSLocked: false,
    isElectronConfigOpen: false,
    experimentScore: 0,

    // Perigos e Efeitos - Estados iniciais
    hazardEvents: [],
    corrosionMarks: [],
    explosions: [],

    // UI
    selectObject: (id) => set({ selectedId: id }),
    openPeriodicTable: () => set({ isPeriodicTableOpen: true }),
    closePeriodicTable: () => set({ isPeriodicTableOpen: false }),
    openReagentPanel: () => set({ isReagentPanelOpen: true }),
    closeReagentPanel: () => set({ isReagentPanelOpen: false }),
    openExperimentPanel: () => set({ isExperimentPanelOpen: true }),
    closeExperimentPanel: () => set({ isExperimentPanelOpen: false }),
    openNotebook: () => set({ isNotebookOpen: true }),
    closeNotebook: () => set({ isNotebookOpen: false }),
    openQuantumMicroscope: () => set({ isQuantumMicroscopeOpen: true }),
    closeQuantumMicroscope: () => set({ isQuantumMicroscopeOpen: false }),
    openIntermolecular: () => set({ isIntermolecularOpen: true }),
    closeIntermolecular: () => set({ isIntermolecularOpen: false }),
    openSolidState: () => set({ isSolidStateOpen: true }),
    closeSolidState: () => set({ isSolidStateOpen: false }),
    openAtomicModels: () => set({ isAtomicModelsOpen: true }),
    closeAtomicModels: () => set({ isAtomicModelsOpen: false }),
    setFPSLocked: (locked) => set({ isFPSLocked: locked }),
    openElectronConfig: () => set({ isElectronConfigOpen: true }),
    closeElectronConfig: () => set({ isElectronConfigOpen: false }),
    openPeriodicProperties: () => set({ isPeriodicPropertiesOpen: true }),
    closePeriodicProperties: () => set({ isPeriodicPropertiesOpen: false }),
    openNuclearPhysics: () => set({ isNuclearPhysicsOpen: true }),
    closeNuclearPhysics: () => set({ isNuclearPhysicsOpen: false }),
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
        set((s) => ({
            objects: s.objects.map(o => o.id === id ? { ...o, formula: element.symbol, element, mols: 1.0, color: element.color, fillLevel: 0.6, customName: element.namePt } : o),
            lastReaction: `⚛️ ${element.namePt} (${element.symbol})`,
        }))
        setTimeout(() => set((s) => s.lastReaction?.includes(element.symbol) ? { lastReaction: null } : s), 2000)
    },

    addSubstanceToObject: (id, formula, mols) => {
        const substance = ALL_SUBSTANCES[formula] || COMMON_SUBSTANCES[formula]
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

        let msg = '', newColor = to.color, newFormula = to.formula, finalMols = totalMols
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

                        // Aumentar temperatura drasticamente
                        const tempIncrease = 150

                        get().triggerHazard(hazard)
                    }
                }
            }

            // Tentar encontrar reação normal
            const reaction = findReaction(from.formula, to.formula)
            if (reaction && !exploded) {
                // CHECK TEMPERATURE
                const minTemp = reaction.requiredTemp?.min ?? -273
                const maxTemp = reaction.requiredTemp?.max ?? 10000

                if (effectiveTemp < minTemp) {
                    // Too cold to react -> Just mix
                    newColor = mixColors(from.color, to.color, transferMols / totalMols)
                    newFormula = `${to.formula}+${from.formula}`
                    msg = `❄️ Muito frio para reagir (Req: ${minTemp}°C)`
                } else if (effectiveTemp > maxTemp || (reaction.unstable && effectiveTemp > 50)) {
                    // Too hot or unstable! EXPLOSION
                    effect = 'explosion'
                    exploded = true
                    msg = `💥 INSTABILIDADE TÉRMICA!`
                } else {
                    // REACTION HAPPENS!
                    newFormula = reaction.products[0]
                    newColor = reaction.productColor || newColor
                    effect = reaction.effect as LabObject['activeEffect']
                    effectColor = reaction.effectColor || '#fff'
                    msg = `⚗️ ${reaction.description}`

                    // Log it
                    set((s) => ({
                        reactionLog: [...s.reactionLog, {
                            id: `${Date.now()}`,
                            timestamp: new Date(),
                            equation: reaction.equation,
                            description: reaction.description
                        }]
                    }))
                }
            } else if (!exploded && !reaction) {
                // No reaction found
                newColor = mixColors(from.color, to.color, transferMols / totalMols)
                newFormula = `${to.formula}+${from.formula}`
                msg = `🔀 Mistura idêntica`
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
                    customName: effect !== 'none' ? (newFormula || undefined) : o.customName,
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

    // Ações físicas - AQUECIMENTO ATÉ 5000°C COM TRANSIÇÕES DE FASE
    startHeating: (id) => {
        set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isHeating: true, activeEffect: 'bubbles', effectColor: '#ff6600' } : o), lastReaction: '🔥 Aquecendo...' }))
        const interval = setInterval(() => {
            const obj = get().objects.find(o => o.id === id)
            if (!obj || !obj.isHeating) { clearInterval(interval); return }

            // Aquece gradualmente
            const newTemp = Math.min(5000, obj.temperature + 50)

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

            set((s) => ({
                objects: s.objects.map(o => o.id === id ? {
                    ...o,
                    temperature: newTemp,
                    phase: newPhase,
                    isBoiling: isBoiling,
                    activeEffect: effect,
                    effectColor: newTemp > 1500 ? '#ff2200' : newTemp > 500 ? '#ff4400' : '#ff6600',
                    effectIntensity: Math.min(1, newTemp / 500),
                    // Evaporação: reduz volume quando está fervendo
                    volume: isBoiling ? Math.max(0, o.volume - 5) : o.volume,
                    fillLevel: isBoiling ? Math.max(0, o.fillLevel - 0.02) : o.fillLevel,
                } : o),
                lastReaction: isBoiling
                    ? `🫧 ${newTemp}°C - EBULIÇÃO! (${obj.boilingPoint}°C)`
                    : `🌡️ ${newTemp}°C${newPhase !== obj.phase ? ` → ${newPhase}` : ''}`
            }))
            if (newTemp >= 5000) clearInterval(interval)
        }, 300)
    },
    stopHeating: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isHeating: false, isBoiling: false, activeEffect: 'none' } : o), lastReaction: '⏹️ Aquecimento parado' })),

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
    breakObject: (id) => set((s) => ({ objects: s.objects.map(o => o.id === id ? { ...o, isBroken: true, fillLevel: 0, activeEffect: 'none', isHeating: false } : o), lastReaction: '💥 Quebrado!', selectedId: null })),

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
