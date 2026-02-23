// src/types/lab.types.ts

/**
 * Tipos de vidrarias do laboratório
 */
export type GlasswareType = 'beaker' | 'test-tube' | 'flask' | 'erlenmeyer' | 'funnel' | 'pipette'

/**
 * Objeto genérico do laboratório
 */
export interface LabObject {
    id: string
    type: GlasswareType | 'bunsen-burner' | 'tripod' | 'generic'
    position: [number, number, number]
    rotation: [number, number, number]
    scale: number

    // Capacidade para vidrarias
    capacity?: number // mL
    currentVolume?: number // mL

    // Referência à substância contida
    substanceId?: string

    // Estado físico
    temperature?: number // °C
    isBroken?: boolean
}

/**
 * Estado de interação do usuário
 */
export interface InteractionState {
    selectedObjectId: string | null
    draggedObjectId: string | null
    hoveredObjectId: string | null
    isPouringFrom?: string
    isPouringTo?: string
}

/**
 * Configurações gerais do laboratório
 */
export interface LabConfig {
    ambientTemperature: number // °C
    allowExplosions: boolean
    showLabels: boolean
    showGrid: boolean
}
