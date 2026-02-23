// src/constants/physicsConfig.ts

/**
 * Configurações padrão de física
 */
export const PHYSICS_CONFIG = {
    gravity: [0, -9.81, 0] as [number, number, number],
    defaultFriction: 0.4,
    defaultRestitution: 0.2,

    // Materiais específicos
    materials: {
        glass: {
            friction: 0.3,
            restitution: 0.1, // Vidro não quica muito
        },
        metal: {
            friction: 0.5,
            restitution: 0.3,
        },
        rubber: {
            friction: 0.8,
            restitution: 0.7, // Borracha quica bastante
        },
        liquid: {
            friction: 0.1,
            restitution: 0.0,
        },
    },

    // Limites do laboratório
    worldBounds: {
        minX: -10,
        maxX: 10,
        minY: 0,
        maxY: 5,
        minZ: -10,
        maxZ: 10,
    },
} as const

/**
 * Configurações de simulação
 */
export const SIMULATION_CONFIG = {
    defaultTimeScale: 1,
    minTimeScale: 0.1,
    maxTimeScale: 3,
    substepsPerFrame: 3, // Precisão da física
} as const
