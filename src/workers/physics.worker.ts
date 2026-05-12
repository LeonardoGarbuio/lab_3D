// src/workers/physics.worker.ts
// ═══════════════════════════════════════════════════════════════════════
// 🧠 CÉREBRO — Web Worker de Física
// Roda num thread separado do browser, isolado da Main Thread.
// Recebe comandos via postMessage, executa a simulação, e devolve
// apenas as coordenadas prontas para renderização (Float32Array).
//
// Protocolo de mensagens:
//   Main → Worker:
//     { type: 'INIT',                numParticles, forceType }
//     { type: 'SET_FORCE',           forceType }
//     { type: 'RESET',               numParticles }
//     { type: 'UPDATE_THERMO_STATE', state: Partial<ThermodynamicState> }
//     { type: 'START' }
//     { type: 'STOP' }
//     { type: 'TICK' }  // pedir um frame único
//     { type: 'EVALUATE_REACTION', formula1, formula2, tempCelsius }
//     { type: 'CALCULATE_VSEPR', formula }
//
//   Worker → Main:
//     { type: 'FRAME', positions: Float32Array, count: number }
//     { type: 'READY' }
//     { type: 'REACTION_RESULT', result: ReactionResult | null }
//     { type: 'VSEPR_RESULT', molecule: GeneratedMolecule | null }
// ═══════════════════════════════════════════════════════════════════════

// Contexto do Worker — self é o global scope da thread
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workerSelf = self as any
export type {} // forçar module mode para verbatimModuleSyntax

import { FluidEngine } from '../physics/FluidEngine'
import type { IMForceType, ThermodynamicState } from '../physics/FluidEngine'
import { ReactionEvaluator } from '../physics/ReactionEvaluator'
import { VSEPRCalculator } from '../physics/VSEPRCalculator'
import { calculateTitrationPH } from '../systems/TitrationSystem'
import { detectFunctionalGroups, findReactionByAffinity } from '../systems/OrganicReactionsSystem'

// ─── Estado do Worker ─────────────────────────────────────────────────
let engine: FluidEngine | null = null
let loopInterval: ReturnType<typeof setInterval> | null = null
let lastTime = 0
const TARGET_DT = 1000 / 60 // 60 Hz = ~16.67ms

// ─── Game Loop Interno ────────────────────────────────────────────────
function startLoop(): void {
    if (loopInterval !== null) return // já está rodando
    lastTime = performance.now()

    loopInterval = setInterval(() => {
        if (!engine) return

        // Delta time real para estabilidade
        const now = performance.now()
        const _dt = now - lastTime
        lastTime = now

        // Limitar dt para evitar "espiral da morte" em lags
        const cappedDt = Math.min(_dt, 33) // max 2 frames de atraso
        engine.timeStep = cappedDt / 1000

        // Executar simulação
        engine.update()

        // Enviar posições para a Main Thread
        const buffer = engine.getPositionBuffer()
        const msg = {
            type: 'FRAME' as const,
            positions: buffer,
            count: engine.count,
        }

        // Transferir ownership do buffer (zero-copy)
        workerSelf.postMessage(msg, { transfer: [buffer.buffer] })
    }, TARGET_DT)
}

function stopLoop(): void {
    if (loopInterval !== null) {
        clearInterval(loopInterval)
        loopInterval = null
    }
}

// ─── Handler de Mensagens ─────────────────────────────────────────────
workerSelf.onmessage = (event: MessageEvent) => {
    const { type } = event.data

    switch (type) {
        case 'INIT': {
            const { numParticles, forceType } = event.data as {
                numParticles: number
                forceType: IMForceType
            }
            engine = new FluidEngine(numParticles, forceType)
            workerSelf.postMessage({ type: 'READY' })
            // Auto-start após init
            startLoop()
            break
        }

        case 'SET_FORCE': {
            const { forceType } = event.data as { forceType: IMForceType }
            if (engine) {
                engine.setForceType(forceType)
            }
            break
        }

        case 'RESET': {
            const { numParticles } = event.data as { numParticles: number }
            if (engine) {
                engine.reset(numParticles)
            }
            break
        }

        case 'UPDATE_THERMO_STATE': {
            const { state } = event.data as { state: Partial<ThermodynamicState> }
            if (engine) {
                engine.setThermodynamicState(state)
            }
            break
        }

        case 'START': {
            startLoop()
            break
        }

        case 'STOP': {
            stopLoop()
            break
        }

        case 'TICK': {
            // Frame único sob demanda (sem loop)
            if (engine) {
                engine.update()
                const buffer = engine.getPositionBuffer()
                workerSelf.postMessage(
                    { type: 'FRAME', positions: buffer, count: engine.count },
                    { transfer: [buffer.buffer] }
                )
            }
            break
        }

        case 'EVALUATE_REACTION': {
            // Avaliar viabilidade termodinâmica de uma reação
            const { formula1, formula2, tempCelsius } = event.data as {
                formula1: string
                formula2: string
                tempCelsius: number
            }
            const result = ReactionEvaluator.evaluate(formula1, formula2, tempCelsius)
            workerSelf.postMessage({ type: 'REACTION_RESULT', result })
            break
        }

        case 'CALCULATE_TITRATION': {
            const { titrantFormula, analyteFormula, titrantMols, analyteMols, volumeML, id } = event.data
            const pH = calculateTitrationPH(titrantFormula, analyteFormula, titrantMols, analyteMols, volumeML)
            workerSelf.postMessage({ type: 'TITRATION_RESULT', result: { pH }, id })
            break
        }

        case 'CALCULATE_VSEPR': {
            // Calcular geometria molecular procedural
            const { formula: vsepFormula, id } = event.data as { formula: string, id: string }
            const molecule = VSEPRCalculator.calculate(vsepFormula)
            workerSelf.postMessage({ type: 'VSEPR_RESULT', result: molecule, id })
            break
        }

        // ─── QUÍMICA ORGÂNICA (Fase 6) ───
        case 'DETECT_FUNCTIONAL_GROUPS': {
            const { formula, id } = event.data
            const groups = detectFunctionalGroups(formula)
            workerSelf.postMessage({ type: 'FUNCTIONAL_GROUPS_RESULT', result: groups, id })
            break
        }

        case 'EVALUATE_ORGANIC_REACTION': {
            const { formula1, formula2, tempCelsius, id } = event.data
            const reaction = findReactionByAffinity(formula1, formula2, tempCelsius)
            workerSelf.postMessage({ type: 'ORGANIC_REACTION_RESULT', result: reaction, id })
            break
        }

        default:
            console.warn('[PhysicsWorker] Mensagem desconhecida:', type)
    }
}
