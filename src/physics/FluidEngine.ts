// src/physics/FluidEngine.ts
// ═══════════════════════════════════════════════════════════════════════
// 🧪 MOTOR DE FLUIDOS — Lennard-Jones com Spatial Hashing
// Roda EXCLUSIVAMENTE dentro do Web Worker.
// Usa arrays flat (Float32Array) para máxima performance e transferência
// zero-copy via postMessage (Transferable Objects).
//
// Otimizações implementadas:
//   1. Spatial Hashing (O(N) em vez de O(N²))
//   2. Float32Array flat (cache-friendly, transferable)
//   3. Sem alocação de objetos no loop (zero GC pressure)
//   4. Termodinâmica básica (temperatura → agitação)
// ═══════════════════════════════════════════════════════════════════════

import { SpatialHash } from './SpatialHash'

export type IMForceType = 'london' | 'dipole' | 'h-bond' | 'ion-dipole'

interface ForceParams {
    epsilon: number // Profundidade do poço (força de atração)
    sigma: number   // Distância de repulsão (tamanho da molécula)
}

const FORCE_PROFILES: Record<IMForceType, ForceParams> = {
    'london':     { epsilon: 0.2, sigma: 0.8 },      // Fraca atração
    'dipole':     { epsilon: 0.8, sigma: 0.8 },      // Atração média
    'h-bond':     { epsilon: 2.5, sigma: 0.8 },      // Forte atração
    'ion-dipole': { epsilon: 4.0, sigma: 0.8 },      // Muito forte
}

/**
 * Estado termodinâmico do recipiente.
 * Ditará a agitação térmica e eventualmente as mudanças de fase.
 */
export interface ThermodynamicState {
    temperature: number  // Kelvin (default 298 = 25°C)
    volume: number       // Litros (dimensão do recipiente)
    pressure: number     // atm (calculado via lei ideal)
    mols: number         // quantidade de matéria
}

const DEFAULT_THERMO: ThermodynamicState = {
    temperature: 298,
    volume: 1.0,
    pressure: 1.0,
    mols: 0.005,
}

export class FluidEngine {
    // ─── Arrays flat para performance ──────────────────────────────────
    positions: Float32Array   // [x0,y0,z0, x1,y1,z1, ...]
    velocities: Float32Array  // [vx0,vy0,vz0, ...]
    forces: Float32Array      // [fx0,fy0,fz0, ...]
    masses: Float32Array      // [m0, m1, ...]
    count: number

    // ─── Configuração ──────────────────────────────────────────────────
    bounds: number = 5
    damping: number = 0.98
    timeStep: number = 0.016
    forceType: IMForceType = 'london'
    gravity: number = -2.0
    cutoffRadius: number = 3.0
    cutoffRadiusSq: number = 9.0

    // ─── Spatial Hash ──────────────────────────────────────────────────
    private spatialHash: SpatialHash

    // ─── Termodinâmica ─────────────────────────────────────────────────
    thermo: ThermodynamicState

    constructor(numParticles: number, forceType: IMForceType = 'london') {
        this.count = numParticles
        this.forceType = forceType
        this.thermo = { ...DEFAULT_THERMO }

        // Alocar arrays flat
        this.positions  = new Float32Array(numParticles * 3)
        this.velocities = new Float32Array(numParticles * 3)
        this.forces     = new Float32Array(numParticles * 3)
        this.masses     = new Float32Array(numParticles)

        // Spatial hash com cellSize = cutoff radius
        this.spatialHash = new SpatialHash(this.cutoffRadius)

        this.reset(numParticles)
    }

    /**
     * Reinicializa partículas com posições e velocidades aleatórias.
     */
    reset(numParticles: number): void {
        this.count = numParticles

        // Realocar se necessário
        if (this.positions.length < numParticles * 3) {
            this.positions  = new Float32Array(numParticles * 3)
            this.velocities = new Float32Array(numParticles * 3)
            this.forces     = new Float32Array(numParticles * 3)
            this.masses     = new Float32Array(numParticles)
        }

        const halfBound = this.bounds * 0.4 // spawn dentro de 80% do volume

        for (let i = 0; i < numParticles; i++) {
            const off = i * 3
            // Posições aleatórias
            this.positions[off]     = (Math.random() - 0.5) * halfBound * 2
            this.positions[off + 1] = (Math.random() - 0.5) * halfBound * 2
            this.positions[off + 2] = (Math.random() - 0.5) * halfBound * 2

            // Velocidades iniciais baseadas na temperatura
            const thermalSpeed = this.thermalVelocityScale()
            this.velocities[off]     = (Math.random() - 0.5) * thermalSpeed
            this.velocities[off + 1] = (Math.random() - 0.5) * thermalSpeed
            this.velocities[off + 2] = (Math.random() - 0.5) * thermalSpeed

            this.masses[i] = 1.0
        }

        // Zerar forças
        this.forces.fill(0)
    }

    /**
     * Escala de velocidade térmica baseada na temperatura.
     * Boltzmann simplificado: v ∝ sqrt(T / m)
     */
    private thermalVelocityScale(): number {
        // Normalizado: 298K (25°C) → velocidade base 2.0
        return 2.0 * Math.sqrt(this.thermo.temperature / 298)
    }

    /**
     * Define o tipo de força intermolecular.
     */
    setForceType(type: IMForceType): void {
        this.forceType = type
    }

    /**
     * Atualiza o estado termodinâmico.
     */
    setThermodynamicState(state: Partial<ThermodynamicState>): void {
        if (state.temperature !== undefined) this.thermo.temperature = state.temperature
        if (state.volume !== undefined)      this.thermo.volume = state.volume
        if (state.pressure !== undefined)    this.thermo.pressure = state.pressure
        if (state.mols !== undefined)        this.thermo.mols = state.mols
    }

    /**
     * Loop principal de atualização da física (1 tick).
     * Chamado pelo Worker a cada frame.
     */
    update(): void {
        const { epsilon, sigma } = FORCE_PROFILES[this.forceType]
        const sigmaSq = sigma * sigma
        const num = this.count
        const pos = this.positions
        const vel = this.velocities
        const frc = this.forces

        // ─── 1. Reset forces + Gravity ────────────────────────────────
        for (let i = 0; i < num; i++) {
            const off = i * 3
            frc[off]     = 0
            frc[off + 1] = this.gravity * this.masses[i]
            frc[off + 2] = 0
        }

        // ─── 2. Agitação Térmica ──────────────────────────────────────
        // Adiciona ruído proporcional à temperatura (entropia)
        const thermalNoise = (this.thermo.temperature - 200) * 0.002
        if (thermalNoise > 0) {
            for (let i = 0; i < num; i++) {
                const off = i * 3
                frc[off]     += (Math.random() - 0.5) * thermalNoise
                frc[off + 1] += (Math.random() - 0.5) * thermalNoise
                frc[off + 2] += (Math.random() - 0.5) * thermalNoise
            }
        }

        // ─── 3. Build Spatial Hash ────────────────────────────────────
        this.spatialHash.build(pos, num)

        // ─── 4. Lennard-Jones via Spatial Hash (O(N) efetivo) ─────────
        // Usar queryNeighbors para cada partícula (mais simples e robusto)
        // Rastreamos pares para não calcular forças duplicadas
        const processed = new Set<number>()

        for (let i = 0; i < num; i++) {
            const oi = i * 3
            const px = pos[oi]
            const py = pos[oi + 1]
            const pz = pos[oi + 2]

            const neighbors = this.spatialHash.queryNeighbors(px, py, pz)

            for (let k = 0; k < neighbors.length; k++) {
                const j = neighbors[k]
                if (j <= i) continue // Processar cada par uma vez (j > i)

                // Chave de par para evitar duplicatas
                const pairKey = i * num + j
                if (processed.has(pairKey)) continue
                processed.add(pairKey)

                const oj = j * 3
                const dx = pos[oi]     - pos[oj]
                const dy = pos[oi + 1] - pos[oj + 1]
                const dz = pos[oi + 2] - pos[oj + 2]

                const distSq = dx * dx + dy * dy + dz * dz

                // Cutoff: ignorar partículas muito distantes ou sobrepostas
                if (distSq < 0.01 || distSq > this.cutoffRadiusSq) continue

                const r2 = sigmaSq / distSq
                const r6 = r2 * r2 * r2
                const r12 = r6 * r6

                // F = 24 * ε * (2*(σ/r)^12 - (σ/r)^6) / r
                const invDist = 1 / Math.sqrt(distSq)
                const fMag = 24 * epsilon * (2 * r12 - r6) * invDist

                // Clamp para evitar explosão numérica
                const clampedF = fMag > 50 ? 50 : (fMag < -50 ? -50 : fMag)

                const fx = dx * invDist * clampedF
                const fy = dy * invDist * clampedF
                const fz = dz * invDist * clampedF

                frc[oi]     += fx
                frc[oi + 1] += fy
                frc[oi + 2] += fz

                frc[oj]     -= fx
                frc[oj + 1] -= fy
                frc[oj + 2] -= fz
            }
        }

        // ─── 5. Euler Integration + Boundary Collisions ──────────────
        const halfBound = this.bounds / 2
        const dt = this.timeStep
        const damp = this.damping

        for (let i = 0; i < num; i++) {
            const off = i * 3
            const invM = 1 / this.masses[i]

            // Integrar velocidade
            vel[off]     += frc[off]     * invM * dt
            vel[off + 1] += frc[off + 1] * invM * dt
            vel[off + 2] += frc[off + 2] * invM * dt

            // Aplicar damping
            vel[off]     *= damp
            vel[off + 1] *= damp
            vel[off + 2] *= damp

            // Integrar posição
            pos[off]     += vel[off]     * dt
            pos[off + 1] += vel[off + 1] * dt
            pos[off + 2] += vel[off + 2] * dt

            // Colisões com as paredes (caixa)
            for (let axis = 0; axis < 3; axis++) {
                const idx = off + axis
                if (pos[idx] < -halfBound) {
                    pos[idx] = -halfBound
                    vel[idx] *= -0.5
                }
                if (pos[idx] > halfBound) {
                    pos[idx] = halfBound
                    vel[idx] *= -0.5
                }
            }
        }
    }

    /**
     * Retorna uma CÓPIA do buffer de posições para transferência.
     * O Worker enviará este buffer para a Main Thread.
     */
    getPositionBuffer(): Float32Array {
        return new Float32Array(this.positions.buffer.slice(0, this.count * 3 * 4))
    }
}
