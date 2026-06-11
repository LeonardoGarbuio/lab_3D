// src/hooks/useVSEPR.ts
import { useState, useEffect } from 'react'
import { VSEPR_MOLECULES, type VSEPRMolecule } from '../data/vseprData'
import { WorkerClient } from '../workers/WorkerClient'
import type { GeneratedMolecule } from '../physics/VSEPRCalculator'

export type AnyMolecule = VSEPRMolecule | GeneratedMolecule

export function useVSEPR(formula: string | null) {
    const [molecules, setMolecules] = useState<AnyMolecule[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!formula || formula === 'Mistura') {
            setMolecules([])
            setIsLoading(false)
            setError(formula === 'Mistura' ? 'Selecione uma amostra válida' : null)
            return
        }

        const subFormulas = formula.split('+').map(s => s.trim()).filter(Boolean)
        
        setIsLoading(true)
        setError(null)

        const resolveSubFormula = async (sub: string): Promise<AnyMolecule | null> => {
            if (VSEPR_MOLECULES[sub]) {
                return VSEPR_MOLECULES[sub]
            }
            try {
                return await WorkerClient.calculateVSEPR(sub)
            } catch (err) {
                console.error(err)
                return null
            }
        }

        Promise.all(subFormulas.map(resolveSubFormula))
            .then(results => {
                const validMolecules = results.filter((r): r is AnyMolecule => r !== null)
                if (validMolecules.length === 0) {
                    setMolecules([])
                    setError('Não foi possível gerar a estrutura')
                } else if (validMolecules.length < subFormulas.length) {
                    setMolecules(validMolecules)
                    setError('Aviso: Algumas partes da mistura não puderam ser analisadas')
                } else {
                    setMolecules(validMolecules)
                }
            })
            .catch(() => {
                setMolecules([])
                setError('Erro ao calcular VSEPR da mistura')
            })
            .finally(() => {
                setIsLoading(false)
            })

    }, [formula])

    return { molecules, isLoading, error }
}
