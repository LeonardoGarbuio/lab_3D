export interface Particle {
    pos: [number, number, number]
    vel: [number, number, number]
    force: [number, number, number]
    mass: number
    type: string
}

export type IMForceType = 'london' | 'dipole' | 'h-bond' | 'ion-dipole'

interface ForceParams {
    epsilon: number // Profundidade do poço (força de atração)
    sigma: number   // Distância de repulsão (tamanho da molécula)
}

const FORCE_PROFILES: Record<IMForceType, ForceParams> = {
    'london': { epsilon: 0.2, sigma: 0.8 },      // Fraca atração
    'dipole': { epsilon: 0.8, sigma: 0.8 },      // Atração média
    'h-bond': { epsilon: 2.5, sigma: 0.8 },      // Forte atração (tensão superficial alta)
    'ion-dipole': { epsilon: 4.0, sigma: 0.8 },  // Muito forte
}

export class FluidEngine {
    particles: Particle[] = []
    bounds: number = 5
    damping: number = 0.98
    timeStep: number = 0.016
    forceType: IMForceType = 'london'
    gravity: number = -2.0

    constructor(numParticles: number, forceType: IMForceType = 'london') {
        this.forceType = forceType
        this.reset(numParticles)
    }

    reset(numParticles: number) {
        this.particles = []
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                pos: [
                    (Math.random() - 0.5) * this.bounds,
                    (Math.random() - 0.5) * this.bounds,
                    (Math.random() - 0.5) * this.bounds
                ],
                vel: [
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ],
                force: [0, 0, 0],
                mass: 1,
                type: 'water'
            })
        }
    }

    setForceType(type: IMForceType) {
        this.forceType = type
    }

    update() {
        const { epsilon, sigma } = FORCE_PROFILES[this.forceType]
        const num = this.particles.length

        // Reset forces and add gravity
        for (let i = 0; i < num; i++) {
            const p = this.particles[i]
            p.force[0] = 0
            p.force[1] = this.gravity * p.mass
            p.force[2] = 0
        }

        // Lennard-Jones like interactions O(N^2)
        // Optimização: N é pequeno (~150), O(N^2) é ok
        for (let i = 0; i < num; i++) {
            for (let j = i + 1; j < num; j++) {
                const p1 = this.particles[i]
                const p2 = this.particles[j]

                const dx = p1.pos[0] - p2.pos[0]
                const dy = p1.pos[1] - p2.pos[1]
                const dz = p1.pos[2] - p2.pos[2]
                
                const distSq = dx * dx + dy * dy + dz * dz
                
                // Evitar divisão por zero e forças extremas se colados
                if (distSq < 0.01) continue
                if (distSq > 9.0) continue // Cutoff radius (3.0)

                const r2 = sigma * sigma / distSq
                const r6 = r2 * r2 * r2
                const r12 = r6 * r6

                // Força de atração/repulsão
                // F = 24 * epsilon * (2 * (sigma/r)^12 - (sigma/r)^6) / r
                const fMag = 24 * epsilon * (2 * r12 - r6) / Math.sqrt(distSq)
                
                // Limitar força máxima para evitar explosão
                const clampedF = Math.min(Math.max(fMag, -50), 50)

                const fx = (dx / Math.sqrt(distSq)) * clampedF
                const fy = (dy / Math.sqrt(distSq)) * clampedF
                const fz = (dz / Math.sqrt(distSq)) * clampedF

                p1.force[0] += fx
                p1.force[1] += fy
                p1.force[2] += fz
                
                p2.force[0] -= fx
                p2.force[1] -= fy
                p2.force[2] -= fz
            }
        }

        // Euler integration and boundaries
        const halfBound = this.bounds / 2
        for (let i = 0; i < num; i++) {
            const p = this.particles[i]
            
            // Integrar velocidade
            p.vel[0] += (p.force[0] / p.mass) * this.timeStep
            p.vel[1] += (p.force[1] / p.mass) * this.timeStep
            p.vel[2] += (p.force[2] / p.mass) * this.timeStep

            // Aplicar damping
            p.vel[0] *= this.damping
            p.vel[1] *= this.damping
            p.vel[2] *= this.damping

            // Integrar posição
            p.pos[0] += p.vel[0] * this.timeStep
            p.pos[1] += p.vel[1] * this.timeStep
            p.pos[2] += p.vel[2] * this.timeStep

            // Colisões com as paredes (caixa)
            if (p.pos[0] < -halfBound) { p.pos[0] = -halfBound; p.vel[0] *= -0.5 }
            if (p.pos[0] > halfBound) { p.pos[0] = halfBound; p.vel[0] *= -0.5 }
            
            if (p.pos[1] < -halfBound) { p.pos[1] = -halfBound; p.vel[1] *= -0.5 }
            if (p.pos[1] > halfBound) { p.pos[1] = halfBound; p.vel[1] *= -0.5 }
            
            if (p.pos[2] < -halfBound) { p.pos[2] = -halfBound; p.vel[2] *= -0.5 }
            if (p.pos[2] > halfBound) { p.pos[2] = halfBound; p.vel[2] *= -0.5 }
        }
    }
}
