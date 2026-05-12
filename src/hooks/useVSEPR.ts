// src/hooks/useVSEPR.ts
import { useState, useEffect } from 'react'
import { VSEPR_MOLECULES, type VSEPRMolecule } from '../data/vseprData'
import { WorkerClient } from '../workers/WorkerClient'
import type { GeneratedMolecule } from '../physics/VSEPRCalculator'

export function useVSEPR(formula: string | null) {
    const [molecule, setMolecule] = useState<VSEPRMolecule | GeneratedMolecule | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!formula) {
            setMolecule(null)
            return
        }

        // 1. Tentar os dados estáticos primeiro (rápido, inclui ressonância)
        if (VSEPR_MOLECULES[formula]) {
            setMolecule(VSEPR_MOLECULES[formula])
            setIsLoading(false)
            setError(null)
            return
        }

        // Se a fórmula tem um "+", não tem como ser uma molécula
        if (formula.includes('+') || formula === 'Mistura') {
            setMolecule(null)
            setIsLoading(false)
            setError('Mistura: Não é uma molécula pura')
            return
        }

        // 2. Não encontrou? Tenta o Worker (Procedural)
        setIsLoading(true)
        setError(null)
        
        WorkerClient.calculateVSEPR(formula)
            .then((result) => {
                if (result) {
                    setMolecule(result)
                } else {
                    setMolecule(null)
                    setError('Não foi possível gerar a estrutura')
                }
            })
            .catch((err) => {
                console.error(err)
                setMolecule(null)
                setError('Erro ao calcular VSEPR')
            })
            .finally(() => {
                setIsLoading(false)
            })

    }, [formula])

    return { molecule, isLoading, error }
}
