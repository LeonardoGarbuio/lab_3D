// src/systems/HazardEffects.ts
// Sistema de efeitos visuais de perigos do laboratório

import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export type HazardEffectType =
    | 'explosion'
    | 'fire'
    | 'corrosion'
    | 'toxic-gas'
    | 'broken-glass'
    | 'chemical-spill'
    | 'smoke'
    | 'flash'
    | 'spark'

export interface HazardEffect {
    type: HazardEffectType
    position: THREE.Vector3
    intensity: number        // 0-1
    radius: number           // Raio de efeito
    duration: number         // Duração em ms
    startTime: number
    isActive: boolean
    data?: Record<string, any>
}

export interface ExplosionParams {
    position: THREE.Vector3
    power: number           // 1-10
    isChemical: boolean     // Explosão química vs mecânica
    color?: string
    soundLevel?: number
}

export interface FireParams {
    position: THREE.Vector3
    intensity: number       // 0-1
    color: string           // Cor da chama
    spreadRate: number      // Taxa de propagação
}

export interface CorrosionParams {
    position: THREE.Vector3
    acidStrength: number    // 0-1
    affectedMaterial: 'metal' | 'organic' | 'glass' | 'plastic'
}

export interface GlassShatterParams {
    position: THREE.Vector3
    glassType: 'beaker' | 'flask' | 'test-tube' | 'window'
    cause: 'thermal' | 'pressure' | 'impact'
}

// ═══════════════════════════════════════════════════════════════════════
// GERENCIADOR DE EFEITOS
// ═══════════════════════════════════════════════════════════════════════

let effectIdCounter = 0
const activeEffects: Map<number, HazardEffect> = new Map()

export function createExplosion(params: ExplosionParams): HazardEffect {
    const id = effectIdCounter++
    const effect: HazardEffect = {
        type: 'explosion',
        position: params.position.clone(),
        intensity: Math.min(params.power / 10, 1),
        radius: params.power * 0.5,
        duration: 1000 + params.power * 200,
        startTime: Date.now(),
        isActive: true,
        data: {
            color: params.color || (params.isChemical ? '#ff6600' : '#ffaa00'),
            isChemical: params.isChemical,
            soundLevel: params.soundLevel || params.power * 10,
            phases: ['flash', 'fireball', 'smoke', 'debris'],
            currentPhase: 0
        }
    }

    activeEffects.set(id, effect)
    return effect
}

export function createFire(params: FireParams): HazardEffect {
    const id = effectIdCounter++
    const effect: HazardEffect = {
        type: 'fire',
        position: params.position.clone(),
        intensity: params.intensity,
        radius: 0.5 + params.intensity * 0.5,
        duration: -1, // Infinito até ser extinto
        startTime: Date.now(),
        isActive: true,
        data: {
            color: params.color,
            spreadRate: params.spreadRate,
            fuelRemaining: 100,
            temperature: 400 + params.intensity * 600
        }
    }

    activeEffects.set(id, effect)
    return effect
}

export function createCorrosion(params: CorrosionParams): HazardEffect {
    const id = effectIdCounter++
    const effect: HazardEffect = {
        type: 'corrosion',
        position: params.position.clone(),
        intensity: params.acidStrength,
        radius: 0.2,
        duration: 5000 + params.acidStrength * 5000,
        startTime: Date.now(),
        isActive: true,
        data: {
            material: params.affectedMaterial,
            damageProgress: 0,
            bubbling: params.acidStrength > 0.5
        }
    }

    activeEffects.set(id, effect)
    return effect
}

export function createGlassShatter(params: GlassShatterParams): HazardEffect {
    const id = effectIdCounter++

    // Gerar fragmentos
    const fragmentCount = getFragmentCount(params.glassType)
    const fragments = generateGlassFragments(params.position, fragmentCount, params.cause)

    const effect: HazardEffect = {
        type: 'broken-glass',
        position: params.position.clone(),
        intensity: 1,
        radius: 0.5,
        duration: 3000,
        startTime: Date.now(),
        isActive: true,
        data: {
            glassType: params.glassType,
            cause: params.cause,
            fragments,
            shatterSound: params.cause === 'thermal' ? 'crack' : 'shatter'
        }
    }

    activeEffects.set(id, effect)
    return effect
}

export function createToxicGas(position: THREE.Vector3, gasType: string, volume: number): HazardEffect {
    const id = effectIdCounter++

    const gasColors: Record<string, string> = {
        'Cl₂': '#90EE90',      // Verde claro
        'Br₂': '#8B4513',      // Marrom
        'NO₂': '#CD853F',      // Marrom-avermelhado
        'H₂S': '#DAA520',      // Amarelo-esverdeado
        'NH₃': '#E6E6FA',      // Incolor (ligeiramente azulado)
        'CO': '#f5f5f5',       // Incolor
        'HCl': '#ffffff',      // Incolor (névoa branca)
        'SO₂': '#E0E0E0'       // Incolor
    }

    const effect: HazardEffect = {
        type: 'toxic-gas',
        position: position.clone(),
        intensity: Math.min(volume / 100, 1),
        radius: 0.5 + volume * 0.01,
        duration: 10000 + volume * 100,
        startTime: Date.now(),
        isActive: true,
        data: {
            gasType,
            color: gasColors[gasType] || '#888888',
            spreadSpeed: 0.05,
            concentration: volume
        }
    }

    activeEffects.set(id, effect)
    return effect
}

export function createChemicalSpill(position: THREE.Vector3, chemical: string, volume: number, color: string): HazardEffect {
    const id = effectIdCounter++
    const effect: HazardEffect = {
        type: 'chemical-spill',
        position: position.clone(),
        intensity: Math.min(volume / 500, 1),
        radius: 0.3 + (volume / 500) * 0.5,
        duration: -1, // Permanente até limpeza
        startTime: Date.now(),
        isActive: true,
        data: {
            chemical,
            volume,
            color,
            spreadProgress: 0,
            evaporating: false
        }
    }

    activeEffects.set(id, effect)
    return effect
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

function getFragmentCount(glassType: string): number {
    switch (glassType) {
        case 'beaker': return 15
        case 'flask': return 20
        case 'test-tube': return 8
        case 'window': return 30
        default: return 12
    }
}

interface GlassFragment {
    id: number
    position: THREE.Vector3
    rotation: THREE.Euler
    velocity: THREE.Vector3
    size: number
    settled: boolean
}

function generateGlassFragments(
    origin: THREE.Vector3,
    count: number,
    cause: string
): GlassFragment[] {
    const fragments: GlassFragment[] = []

    for (let i = 0; i < count; i++) {
        // Velocidade baseada na causa
        const speedMultiplier = cause === 'pressure' ? 3 : cause === 'impact' ? 2 : 1

        const angle = Math.random() * Math.PI * 2
        const upAngle = Math.random() * Math.PI * 0.5

        fragments.push({
            id: i,
            position: origin.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            )),
            rotation: new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ),
            velocity: new THREE.Vector3(
                Math.cos(angle) * Math.cos(upAngle) * speedMultiplier * (0.5 + Math.random()),
                Math.sin(upAngle) * speedMultiplier * (0.5 + Math.random()),
                Math.sin(angle) * Math.cos(upAngle) * speedMultiplier * (0.5 + Math.random())
            ),
            size: 0.02 + Math.random() * 0.04,
            settled: false
        })
    }

    return fragments
}

// ═══════════════════════════════════════════════════════════════════════
// ATUALIZAÇÃO E LIMPEZA
// ═══════════════════════════════════════════════════════════════════════

export function updateEffects(deltaTime: number): HazardEffect[] {
    const now = Date.now()
    const toRemove: number[] = []

    activeEffects.forEach((effect, id) => {
        if (!effect.isActive) {
            toRemove.push(id)
            return
        }

        // Verificar duração
        if (effect.duration > 0 && now - effect.startTime > effect.duration) {
            effect.isActive = false
            toRemove.push(id)
            return
        }

        // Atualizar efeitos específicos
        switch (effect.type) {
            case 'explosion':
                updateExplosion(effect, deltaTime)
                break
            case 'fire':
                updateFire(effect, deltaTime)
                break
            case 'corrosion':
                updateCorrosion(effect, deltaTime)
                break
            case 'broken-glass':
                updateGlassFragments(effect, deltaTime)
                break
            case 'toxic-gas':
                updateToxicGas(effect, deltaTime)
                break
            case 'chemical-spill':
                updateSpill(effect, deltaTime)
                break
        }
    })

    // Remover efeitos inativos
    toRemove.forEach(id => activeEffects.delete(id))

    return Array.from(activeEffects.values())
}

function updateExplosion(effect: HazardEffect, _deltaTime: number) {
    const elapsed = Date.now() - effect.startTime
    const progress = elapsed / effect.duration

    // Fases da explosão
    if (progress < 0.1) {
        effect.data!.currentPhase = 0 // Flash
    } else if (progress < 0.3) {
        effect.data!.currentPhase = 1 // Fireball
    } else if (progress < 0.7) {
        effect.data!.currentPhase = 2 // Smoke
    } else {
        effect.data!.currentPhase = 3 // Debris
    }

    // Diminuir intensidade
    effect.intensity = Math.max(0, 1 - progress)
}

function updateFire(effect: HazardEffect, deltaTime: number) {
    // Consumir combustível
    effect.data!.fuelRemaining -= deltaTime * 10 * effect.intensity

    if (effect.data!.fuelRemaining <= 0) {
        effect.isActive = false
    }

    // Flutuar intensidade
    effect.intensity = Math.min(1, effect.intensity + (Math.random() - 0.5) * 0.1)
}

function updateCorrosion(effect: HazardEffect, deltaTime: number) {
    // Progredir dano
    effect.data!.damageProgress += deltaTime * effect.intensity * 0.1

    if (effect.data!.damageProgress >= 1) {
        // Material totalmente corroído
        effect.isActive = false
    }
}

function updateGlassFragments(effect: HazardEffect, deltaTime: number) {
    const gravity = -9.8
    const fragments = effect.data!.fragments as GlassFragment[]

    let allSettled = true

    for (const fragment of fragments) {
        if (fragment.settled) continue

        // Aplicar gravidade
        fragment.velocity.y += gravity * deltaTime

        // Mover fragmento
        fragment.position.add(fragment.velocity.clone().multiplyScalar(deltaTime))

        // Rotacionar
        fragment.rotation.x += deltaTime * 5
        fragment.rotation.y += deltaTime * 3

        // Verificar se assentou (chão em y = 0)
        if (fragment.position.y <= 0) {
            fragment.position.y = 0
            fragment.velocity.set(0, 0, 0)
            fragment.settled = true
        } else {
            allSettled = false
        }
    }

    // Se todos assentaram, começar timer de remoção
    if (allSettled && !effect.data!.cleanupStarted) {
        effect.data!.cleanupStarted = true
        effect.duration = Date.now() - effect.startTime + 5000 // +5s
    }
}

function updateToxicGas(effect: HazardEffect, deltaTime: number) {
    // Expandir gás
    const spreadSpeed = effect.data!.spreadSpeed as number
    effect.radius += spreadSpeed * deltaTime

    // Dissipar concentração
    effect.data!.concentration -= deltaTime * 2
    effect.intensity = effect.data!.concentration / 100

    if (effect.intensity <= 0.01) {
        effect.isActive = false
    }
}

function updateSpill(effect: HazardEffect, deltaTime: number) {
    // Espalhar gradualmente
    if (effect.data!.spreadProgress < 1) {
        effect.data!.spreadProgress += deltaTime * 0.1
        effect.radius = 0.3 + effect.data!.spreadProgress * effect.intensity * 0.5
    }

    // Evaporar se for volátil
    if (effect.data!.evaporating) {
        effect.data!.volume -= deltaTime * 10
        effect.intensity = effect.data!.volume / 500

        if (effect.intensity <= 0) {
            effect.isActive = false
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════════

export function getAllActiveEffects(): HazardEffect[] {
    return Array.from(activeEffects.values())
}

export function clearAllEffects(): void {
    activeEffects.clear()
}

export function extinguishFire(position: THREE.Vector3, radius: number): number {
    let extinguished = 0

    activeEffects.forEach((effect) => {
        if (effect.type === 'fire') {
            const distance = effect.position.distanceTo(position)
            if (distance <= radius) {
                effect.isActive = false
                extinguished++
            }
        }
    })

    return extinguished
}

export function cleanSpill(position: THREE.Vector3, radius: number): boolean {
    let cleaned = false

    activeEffects.forEach((effect, id) => {
        if (effect.type === 'chemical-spill') {
            const distance = effect.position.distanceTo(position)
            if (distance <= radius) {
                activeEffects.delete(id)
                cleaned = true
            }
        }
    })

    return cleaned
}

export function ventilateArea(position: THREE.Vector3, radius: number, power: number): void {
    activeEffects.forEach((effect) => {
        if (effect.type === 'toxic-gas' || effect.type === 'smoke') {
            const distance = effect.position.distanceTo(position)
            if (distance <= radius) {
                effect.data!.concentration -= power * 10
                effect.intensity = effect.data!.concentration / 100
            }
        }
    })
}
