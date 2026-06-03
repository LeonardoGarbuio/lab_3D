// src/utils/SDFParser.ts
import * as THREE from 'three'

export interface Molecule3D {
    atoms: { element: string; position: THREE.Vector3; color: string; radius: number }[]
    bonds: { source: number; target: number; type: number }[]
}

const ELEMENT_COLORS: Record<string, string> = {
    'H': '#ffffff', 'C': '#222222', 'O': '#ff0000', 'N': '#0000ff',
    'S': '#cccc00', 'P': '#ff8000', 'Cl': '#00ff00', 'F': '#00ccff',
    'Br': '#882200', 'I': '#6600aa', 'Na': '#aaaaaa'
}

const ELEMENT_RADII: Record<string, number> = {
    'H': 0.3, 'C': 0.7, 'O': 0.6, 'N': 0.65,
    'S': 1.0, 'P': 1.0, 'Cl': 0.9, 'F': 0.5,
    'Br': 1.1, 'I': 1.3, 'Na': 1.5
}

export function parseSDF(sdfText: string): Molecule3D {
    const lines = sdfText.split('\n')
    const atoms: Molecule3D['atoms'] = []
    const bonds: Molecule3D['bonds'] = []

    let countsLineIndex = -1
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].includes('V2000')) {
            countsLineIndex = i
            break
        }
    }

    if (countsLineIndex === -1) return { atoms, bonds }

    const numAtoms = parseInt(lines[countsLineIndex].substring(0, 3).trim())
    const numBonds = parseInt(lines[countsLineIndex].substring(3, 6).trim())

    let currentLine = countsLineIndex + 1

    for (let i = 0; i < numAtoms; i++) {
        const line = lines[currentLine++]
        if (!line) break
        const x = parseFloat(line.substring(0, 10).trim())
        const y = parseFloat(line.substring(10, 20).trim())
        const z = parseFloat(line.substring(20, 30).trim())
        const symbol = line.substring(31, 34).trim()

        atoms.push({
            element: symbol,
            position: new THREE.Vector3(x, y, z),
            color: ELEMENT_COLORS[symbol] || '#ff00ff',
            radius: ELEMENT_RADII[symbol] || 0.8
        })
    }

    for (let i = 0; i < numBonds; i++) {
        const line = lines[currentLine++]
        if (!line) break
        const source = parseInt(line.substring(0, 3).trim()) - 1
        const target = parseInt(line.substring(3, 6).trim()) - 1
        const type = parseInt(line.substring(6, 9).trim())

        bonds.push({ source, target, type })
    }

    // Centralizar a molécula
    const center = new THREE.Vector3()
    atoms.forEach(a => center.add(a.position))
    center.divideScalar(atoms.length)
    atoms.forEach(a => a.position.sub(center))

    return { atoms, bonds }
}
