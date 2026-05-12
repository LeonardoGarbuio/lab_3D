// src/workers/WorkerClient.ts
import type { GeneratedMolecule } from '../physics/VSEPRCalculator'
import type { FunctionalGroup, OrganicReaction } from '../systems/OrganicReactionsSystem'

export class WorkerClient {
    private static instance: Worker | null = null
    private static pendingRequests: Map<string | number, (result: any) => void> = new Map()

    private static getWorker(): Worker {
        if (!this.instance) {
            this.instance = new Worker(
                new URL('./physics.worker.ts', import.meta.url),
                { type: 'module' }
            )

            this.instance.onmessage = (e) => {
                const { type, id, result } = e.data
                if ((
                    type === 'VSEPR_RESULT' || 
                    type === 'TITRATION_RESULT' ||
                    type === 'FUNCTIONAL_GROUPS_RESULT' ||
                    type === 'ORGANIC_REACTION_RESULT'
                ) && id) {
                    const resolve = this.pendingRequests.get(id)
                    if (resolve) {
                        resolve(result)
                        this.pendingRequests.delete(id)
                    }
                }
            }

            this.instance.onerror = (err) => {
                console.error('[WorkerClient] Error:', err)
            }
        }
        return this.instance
    }

    /**
     * Calcula a estrutura VSEPR via Web Worker.
     */
    static calculateVSEPR(formula: string): Promise<GeneratedMolecule | null> {
        return new Promise((resolve) => {
            const id = Date.now().toString() + Math.random().toString()
            this.pendingRequests.set(id, resolve)
            this.getWorker().postMessage({
                type: 'CALCULATE_VSEPR',
                formula,
                id
            })
        })
    }

    /**
     * Calcula o pH da Titulação via Web Worker.
     */
    static calculateTitration(titrantFormula: string, analyteFormula: string, titrantMols: number, analyteMols: number, volumeML: number): Promise<{ pH: number }> {
        return new Promise((resolve) => {
            const id = Date.now().toString() + Math.random().toString()
            this.pendingRequests.set(id, resolve)
            this.getWorker().postMessage({
                type: 'CALCULATE_TITRATION',
                titrantFormula,
                analyteFormula,
                titrantMols,
                analyteMols,
                volumeML,
                id
            })
        })
    }

    /**
     * Detecta grupos funcionais via Web Worker (Fase 6).
     */
    static detectFunctionalGroups(formula: string): Promise<FunctionalGroup[]> {
        return new Promise((resolve) => {
            const id = Date.now().toString() + Math.random().toString()
            this.pendingRequests.set(id, resolve)
            this.getWorker().postMessage({
                type: 'DETECT_FUNCTIONAL_GROUPS',
                formula,
                id
            })
        })
    }

    /**
     * Avalia reação orgânica por afinidade via Web Worker (Fase 6).
     */
    static evaluateOrganicReaction(formula1: string, formula2: string, tempCelsius: number): Promise<OrganicReaction | null> {
        return new Promise((resolve) => {
            const id = Date.now().toString() + Math.random().toString()
            this.pendingRequests.set(id, resolve)
            this.getWorker().postMessage({
                type: 'EVALUATE_ORGANIC_REACTION',
                formula1,
                formula2,
                tempCelsius,
                id
            })
        })
    }
}
