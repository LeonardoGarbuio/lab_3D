// src/types/physics.types.ts

/**
 * Tipos para configurações de física
 */
export interface PhysicsConfig {
    gravity: [number, number, number]
    friction: number
    restitution: number
}

export interface BodyConfig {
    mass: number
    position: [number, number, number]
    rotation?: [number, number, number]
    args: [number, number, number] // Tamanho do hitbox
    type?: 'Static' | 'Dynamic' | 'Kinematic'
    material?: {
        friction?: number
        restitution?: number
    }
}

export interface CollisionEvent {
    body: unknown
    contact: {
        ni: [number, number, number] // Normal de impacto
        bi: unknown // Body info
        bj: unknown
    }
}
