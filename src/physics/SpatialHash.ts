// src/physics/SpatialHash.ts
// ═══════════════════════════════════════════════════════════════════════
// 🗺️ SPATIAL HASHING — Grelha 3D para eliminar O(N²)
// Divide o espaço em células de tamanho fixo (= cutoff radius).
// Cada partícula é inserida na célula correspondente, e a busca
// de vizinhos percorre apenas a célula atual + as 26 vizinhas.
//
// Complexidade:
//   Inserção: O(N)
//   Busca de vizinhos para 1 partícula: O(k) onde k << N
//   Busca total (N partículas): O(N * k) ≈ O(N) na prática
// ═══════════════════════════════════════════════════════════════════════

export class SpatialHash {
    /** @internal */ cellSize: number
    private invCellSize: number
    private map: Map<number, number[]>       // hash → lista de índices
    private readonly PRIME1 = 73856093
    private readonly PRIME2 = 19349663
    private readonly PRIME3 = 83492791
    private readonly TABLE_SIZE = 262144     // 2^18, potência de 2 para bitmask

    constructor(cellSize: number) {
        this.cellSize = cellSize
        this.invCellSize = 1 / cellSize
        this.map = new Map()
    }

    /**
     * Limpa a grelha para reutilização no próximo frame.
     */
    clear(): void {
        this.map.clear()
    }

    /**
     * Hash de uma célula 3D (ix, iy, iz) → inteiro.
     * Usa primos grandes e bitmask para distribuição uniforme.
     */
    private hash(ix: number, iy: number, iz: number): number {
        return ((ix * this.PRIME1) ^ (iy * this.PRIME2) ^ (iz * this.PRIME3)) & (this.TABLE_SIZE - 1)
    }

    /**
     * Converte coordenada world → índice de célula.
     */
    private cellIndex(coord: number): number {
        return Math.floor(coord * this.invCellSize)
    }

    /**
     * Insere uma partícula (pelo seu índice) na grelha.
     * @param index  - Índice da partícula no array
     * @param x, y, z - Posição world da partícula
     */
    insert(index: number, x: number, y: number, z: number): void {
        const ix = this.cellIndex(x)
        const iy = this.cellIndex(y)
        const iz = this.cellIndex(z)
        const h  = this.hash(ix, iy, iz)

        let bucket = this.map.get(h)
        if (!bucket) {
            bucket = []
            this.map.set(h, bucket)
        }
        bucket.push(index)
    }

    /**
     * Popula a grelha com todas as partículas de uma vez.
     * Lê posições de um Float32Array flat [x0,y0,z0, x1,y1,z1, ...]
     */
    build(positions: Float32Array, count: number): void {
        this.clear()
        for (let i = 0; i < count; i++) {
            const off = i * 3
            this.insert(i, positions[off], positions[off + 1], positions[off + 2])
        }
    }

    /**
     * Retorna os índices de todos os vizinhos potenciais de (x,y,z).
     * Percorre a célula atual e as 26 adjacentes (3×3×3 = 27 células).
     *
     * NOTA: Pode conter a própria partícula — o chamador deve filtrar.
     */
    queryNeighbors(x: number, y: number, z: number): number[] {
        const cx = this.cellIndex(x)
        const cy = this.cellIndex(y)
        const cz = this.cellIndex(z)

        const result: number[] = []

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const h = this.hash(cx + dx, cy + dy, cz + dz)
                    const bucket = this.map.get(h)
                    if (bucket) {
                        for (let k = 0; k < bucket.length; k++) {
                            result.push(bucket[k])
                        }
                    }
                }
            }
        }

        return result
    }

    /**
     * Itera sobre pares únicos de vizinhos sem alocação de arrays.
     * Callback recebe (i, j) onde i < j sempre (evita duplicatas).
     * Esta é a versão mais performática — zero garbage collection.
     */
    forEachPair(
        positions: Float32Array,
        _count: number,
        cutoffSq: number,
        callback: (i: number, j: number, distSq: number, dx: number, dy: number, dz: number) => void
    ): void {
        // Iterar sobre cada bucket
        this.map.forEach((bucket) => {
            const len = bucket.length
            // Pares dentro do mesmo bucket
            for (let a = 0; a < len; a++) {
                for (let b = a + 1; b < len; b++) {
                    const i = bucket[a]
                    const j = bucket[b]
                    const oi = i * 3
                    const oj = j * 3
                    const dx = positions[oi]     - positions[oj]
                    const dy = positions[oi + 1] - positions[oj + 1]
                    const dz = positions[oi + 2] - positions[oj + 2]
                    const dSq = dx * dx + dy * dy + dz * dz
                    if (dSq < cutoffSq && dSq > 0.0001) {
                        callback(i, j, dSq, dx, dy, dz)
                    }
                }
            }
        })

        // Pares entre buckets vizinhos
        // Para isso, precisamos iterar sobre pares de células adjacentes.
        // Uma abordagem mais eficiente é usar half-neighbor list:
        // para cada célula, checamos apenas 13 das 26 vizinhas (evita duplicatas).
        const visited = new Set<string>()
        this.map.forEach((bucket, h) => {
            // Para cada partícula neste bucket, checar vizinhos em outros buckets
            for (let a = 0; a < bucket.length; a++) {
                const i = bucket[a]
                const oi = i * 3
                const px = positions[oi]
                const py = positions[oi + 1]
                const pz = positions[oi + 2]

                const cx = this.cellIndex(px)
                const cy = this.cellIndex(py)
                const cz = this.cellIndex(pz)

                // Percorrer 13 vizinhos (half-shell para evitar duplicatas)
                for (const [ndx, ndy, ndz] of HALF_NEIGHBORS) {
                    const nh = this.hash(cx + ndx, cy + ndy, cz + ndz)
                    if (nh === h) continue // mesmo bucket, já processado

                    const pairKey = h < nh ? `${h}-${nh}` : `${nh}-${h}`
                    if (visited.has(pairKey)) continue

                    const neighborBucket = this.map.get(nh)
                    if (!neighborBucket) continue

                    for (let b = 0; b < neighborBucket.length; b++) {
                        const j = neighborBucket[b]
                        if (j === i) continue
                        const oj = j * 3
                        const dx = positions[oi]     - positions[oj]
                        const dy = positions[oi + 1] - positions[oj + 1]
                        const dz = positions[oi + 2] - positions[oj + 2]
                        const dSq = dx * dx + dy * dy + dz * dz
                        if (dSq < cutoffSq && dSq > 0.0001) {
                            const pi = Math.min(i, j)
                            const pj = Math.max(i, j)
                            callback(pi, pj, dSq, 
                                pi === i ? dx : -dx, 
                                pi === i ? dy : -dy, 
                                pi === i ? dz : -dz)
                        }
                    }
                }

                // Marcar pares de buckets visitados
                for (const [ndx, ndy, ndz] of HALF_NEIGHBORS) {
                    const nh = this.hash(cx + ndx, cy + ndy, cz + ndz)
                    if (nh !== h) {
                        const pairKey = h < nh ? `${h}-${nh}` : `${nh}-${h}`
                        visited.add(pairKey)
                    }
                }
            }
        })
    }

    /** Atualiza o tamanho da célula (ex: quando o cutoff muda) */
    setCellSize(size: number): void {
        this.cellSize = size
        this.invCellSize = 1 / size
    }
}

/**
 * 13 vizinhos "half-shell" — evita processar cada par duas vezes.
 * Convenção: percorremos apenas vizinhos com offset "positivo" na
 * ordenação lexicográfica de (dx, dy, dz).
 */
const HALF_NEIGHBORS: [number, number, number][] = [
    [ 1,  0,  0],
    [ 1,  1,  0],
    [ 1, -1,  0],
    [ 1,  0,  1],
    [ 1,  0, -1],
    [ 1,  1,  1],
    [ 1,  1, -1],
    [ 1, -1,  1],
    [ 1, -1, -1],
    [ 0,  1,  0],
    [ 0,  1,  1],
    [ 0,  1, -1],
    [ 0,  0,  1],
]
