// src/systems/SpectroscopySystem.ts
// Sistema de espectroscopia para análise de emissão/absorção

// ═══════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════

export interface SpectralLine {
    wavelength: number      // nm
    intensity: number       // 0-1
    color: string           // Cor visível
    transition?: string     // Transição eletrônica (ex: "3s→2p")
}

export interface ElementSpectrum {
    element: string
    symbol: string
    atomicNumber: number
    lines: SpectralLine[]
    dominantColor: string   // Cor dominante no teste de chama
}

export interface SpectrumAnalysis {
    sample: string
    type: 'emission' | 'absorption'
    detectedElements: string[]
    spectrum: SpectralLine[]
    confidence: number      // 0-1
}

// Perfil de absortividade molar para soluções (Lei de Beer-Lambert)
export interface AbsorptivityProfile {
    substanceId: string
    color: string           // Cor predominante transmitida
    lambdaMax: number       // Comprimento de onda de máxima absorção (nm)
    epsilonMax: number      // Absortividade molar máxima (L/(mol·cm))
    width: number           // Largura da banda de absorção (nm)
}

export const ABSORPTIVITY_PROFILES: Record<string, AbsorptivityProfile> = {
    'CuSO4': { substanceId: 'CuSO4', color: '#1e90ff', lambdaMax: 810, epsilonMax: 12.0, width: 100 },
    'KMnO4': { substanceId: 'KMnO4', color: '#ff00ff', lambdaMax: 525, epsilonMax: 2400, width: 45 },
    'NiSO4': { substanceId: 'NiSO4', color: '#00ff00', lambdaMax: 395, epsilonMax: 5.0, width: 50 },
    'CoCl2': { substanceId: 'CoCl2', color: '#ff69b4', lambdaMax: 510, epsilonMax: 4.5, width: 60 }
}

/**
 * Calcula a absorbância baseada na Lei de Beer-Lambert: A = ε * b * c
 * @param epsilonMax Absortividade molar no pico (L/mol.cm)
 * @param concentration Concentração (mol/L)
 * @param pathLength Caminho ótico em cm (padrão = 1cm)
 */
export function calculateBeerLambertAbsorbance(
    epsilonMax: number,
    concentration: number,
    pathLength: number = 1.0
): number {
    return epsilonMax * pathLength * concentration
}

/**
 * Gera a curva de Absorbância vs Comprimento de Onda
 */
export function generateAbsorbanceCurve(
    profile: AbsorptivityProfile,
    concentration: number,
    pathLength: number = 1.0,
    resolution: number = 1
): { wavelength: number; absorbance: number; transmittance: number }[] {
    const data = []
    const peakA = calculateBeerLambertAbsorbance(profile.epsilonMax, concentration, pathLength)
    
    for (let wl = 380; wl <= 700; wl += resolution) {
        // Distribuição Gaussiana ao redor do lambdaMax
        const factor = Math.exp(-Math.pow(wl - profile.lambdaMax, 2) / (2 * profile.width * profile.width))
        const absorbance = peakA * factor
        const transmittance = Math.pow(10, -absorbance)
        data.push({ wavelength: wl, absorbance, transmittance })
    }
    return data
}


// ═══════════════════════════════════════════════════════════════════════
// ESPECTROS DE EMISSÃO DOS ELEMENTOS
// ═══════════════════════════════════════════════════════════════════════

/*
// Cores baseadas no comprimento de onda
function _wavelengthToColor(wavelength: number): string {
    // Espectro visível: 380nm (violeta) - 700nm (vermelho)
    if (wavelength < 380) return '#8B00FF'  // UV -> violeta
    if (wavelength < 440) return '#4B0082'  // Violeta
    if (wavelength < 485) return '#0000FF'  // Azul
    if (wavelength < 510) return '#00FFFF'  // Ciano
    if (wavelength < 565) return '#00FF00'  // Verde
    if (wavelength < 590) return '#FFFF00'  // Amarelo
    if (wavelength < 625) return '#FF8C00'  // Laranja
    if (wavelength < 700) return '#FF0000'  // Vermelho
    return '#8B0000'  // Infravermelho -> vermelho escuro
}
*/

export const ELEMENT_SPECTRA: Record<string, ElementSpectrum> = {
    // Hidrogênio - Série de Balmer
    H: {
        element: 'Hidrogênio',
        symbol: 'H',
        atomicNumber: 1,
        dominantColor: '#ff6666',
        lines: [
            { wavelength: 656.3, intensity: 1.0, color: '#ff0000', transition: 'Hα (n=3→2)' },
            { wavelength: 486.1, intensity: 0.7, color: '#00ffff', transition: 'Hβ (n=4→2)' },
            { wavelength: 434.0, intensity: 0.4, color: '#4444ff', transition: 'Hγ (n=5→2)' },
            { wavelength: 410.2, intensity: 0.2, color: '#4400ff', transition: 'Hδ (n=6→2)' }
        ]
    },

    // Hélio
    He: {
        element: 'Hélio',
        symbol: 'He',
        atomicNumber: 2,
        dominantColor: '#ffffcc',
        lines: [
            { wavelength: 587.6, intensity: 1.0, color: '#ffff00', transition: 'D3' },
            { wavelength: 501.6, intensity: 0.5, color: '#00ff00' },
            { wavelength: 447.1, intensity: 0.3, color: '#0044ff' },
            { wavelength: 667.8, intensity: 0.6, color: '#ff4400' }
        ]
    },

    // Lítio
    Li: {
        element: 'Lítio',
        symbol: 'Li',
        atomicNumber: 3,
        dominantColor: '#dc143c',
        lines: [
            { wavelength: 670.8, intensity: 1.0, color: '#dc143c', transition: '2p→2s' },
            { wavelength: 610.4, intensity: 0.3, color: '#ff6600' }
        ]
    },

    // Sódio
    Na: {
        element: 'Sódio',
        symbol: 'Na',
        atomicNumber: 11,
        dominantColor: '#ffa500',
        lines: [
            { wavelength: 589.0, intensity: 1.0, color: '#ffa500', transition: 'D1 (3p→3s)' },
            { wavelength: 589.6, intensity: 0.95, color: '#ffa500', transition: 'D2 (3p→3s)' },
            { wavelength: 568.8, intensity: 0.1, color: '#ccff00' },
            { wavelength: 498.3, intensity: 0.05, color: '#00ffcc' }
        ]
    },

    // Potássio
    K: {
        element: 'Potássio',
        symbol: 'K',
        atomicNumber: 19,
        dominantColor: '#ee82ee',
        lines: [
            { wavelength: 766.5, intensity: 1.0, color: '#8b0000', transition: '4p→4s' },
            { wavelength: 769.9, intensity: 0.9, color: '#8b0000', transition: '4p→4s' },
            { wavelength: 404.4, intensity: 0.3, color: '#5500ff' }
        ]
    },

    // Cálcio
    Ca: {
        element: 'Cálcio',
        symbol: 'Ca',
        atomicNumber: 20,
        dominantColor: '#ff4500',
        lines: [
            { wavelength: 422.7, intensity: 1.0, color: '#4400ff' },
            { wavelength: 616.2, intensity: 0.6, color: '#ff4500' },
            { wavelength: 643.9, intensity: 0.5, color: '#ff2200' },
            { wavelength: 612.2, intensity: 0.4, color: '#ff5500' }
        ]
    },

    // Bário
    Ba: {
        element: 'Bário',
        symbol: 'Ba',
        atomicNumber: 56,
        dominantColor: '#00ff00',
        lines: [
            { wavelength: 553.5, intensity: 1.0, color: '#44ff00' },
            { wavelength: 493.4, intensity: 0.5, color: '#00ff88' },
            { wavelength: 614.2, intensity: 0.3, color: '#ff6600' }
        ]
    },

    // Cobre
    Cu: {
        element: 'Cobre',
        symbol: 'Cu',
        atomicNumber: 29,
        dominantColor: '#00ff88',
        lines: [
            { wavelength: 510.6, intensity: 1.0, color: '#00ff00' },
            { wavelength: 515.3, intensity: 0.8, color: '#00ff44' },
            { wavelength: 521.8, intensity: 0.6, color: '#00ff88' },
            { wavelength: 578.2, intensity: 0.3, color: '#88ff00' }
        ]
    },

    // Estrôncio
    Sr: {
        element: 'Estrôncio',
        symbol: 'Sr',
        atomicNumber: 38,
        dominantColor: '#ff0000',
        lines: [
            { wavelength: 460.7, intensity: 1.0, color: '#0066ff' },
            { wavelength: 407.8, intensity: 0.7, color: '#6600ff' },
            { wavelength: 421.6, intensity: 0.5, color: '#5500ff' },
            { wavelength: 640.8, intensity: 0.8, color: '#ff2200' }
        ]
    },

    // Mercúrio
    Hg: {
        element: 'Mercúrio',
        symbol: 'Hg',
        atomicNumber: 80,
        dominantColor: '#8888ff',
        lines: [
            { wavelength: 404.7, intensity: 0.9, color: '#6600ff' },
            { wavelength: 435.8, intensity: 1.0, color: '#4400ff' },
            { wavelength: 546.1, intensity: 0.7, color: '#00ff00' },
            { wavelength: 576.9, intensity: 0.4, color: '#ccff00' },
            { wavelength: 579.1, intensity: 0.4, color: '#ccff00' }
        ]
    },

    // Neônio
    Ne: {
        element: 'Neônio',
        symbol: 'Ne',
        atomicNumber: 10,
        dominantColor: '#ff4400',
        lines: [
            { wavelength: 585.2, intensity: 0.8, color: '#ff8800' },
            { wavelength: 588.2, intensity: 0.9, color: '#ffa500' },
            { wavelength: 603.0, intensity: 0.7, color: '#ff6600' },
            { wavelength: 607.4, intensity: 0.6, color: '#ff5500' },
            { wavelength: 616.4, intensity: 1.0, color: '#ff4400' },
            { wavelength: 626.6, intensity: 0.9, color: '#ff3300' },
            { wavelength: 640.2, intensity: 0.8, color: '#ff2200' },
            { wavelength: 650.7, intensity: 0.7, color: '#ff1100' }
        ]
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES DO SISTEMA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Obtém espectro de emissão de um elemento
 */
export function getElementSpectrum(symbol: string): ElementSpectrum | null {
    return ELEMENT_SPECTRA[symbol] || null
}

/**
 * Analisa uma amostra e identifica elementos
 */
export function analyzeSpectrum(
    sampleName: string,
    elementSymbols: string[]
): SpectrumAnalysis {
    const detectedElements: string[] = []
    const combinedSpectrum: SpectralLine[] = []

    for (const symbol of elementSymbols) {
        const spectrum = ELEMENT_SPECTRA[symbol]
        if (spectrum) {
            detectedElements.push(spectrum.element)
            combinedSpectrum.push(...spectrum.lines)
        }
    }

    // Ordenar por comprimento de onda
    combinedSpectrum.sort((a, b) => a.wavelength - b.wavelength)

    return {
        sample: sampleName,
        type: 'emission',
        detectedElements,
        spectrum: combinedSpectrum,
        confidence: detectedElements.length > 0 ? 0.95 : 0
    }
}

/**
 * Gera dados para gráfico de espectro
 */
export function generateSpectrumData(
    spectrum: SpectralLine[],
    resolution: number = 1 // nm
): { wavelength: number; intensity: number }[] {
    const data: { wavelength: number; intensity: number }[] = []

    // Espectro visível: 380-700nm
    for (let wl = 380; wl <= 700; wl += resolution) {
        let intensity = 0

        // Somar contribuição de cada linha (aproximação gaussiana)
        for (const line of spectrum) {
            const sigma = 5 // Largura da linha
            const gaussian = Math.exp(-Math.pow(wl - line.wavelength, 2) / (2 * sigma * sigma))
            intensity += line.intensity * gaussian
        }

        data.push({ wavelength: wl, intensity: Math.min(intensity, 1) })
    }

    return data
}

/**
 * Obtém cor dominante de um espectro
 */
export function getDominantColor(spectrum: SpectralLine[]): string {
    if (spectrum.length === 0) return '#ffffff'

    // Encontrar linha mais intensa
    let maxLine = spectrum[0]
    for (const line of spectrum) {
        if (line.intensity > maxLine.intensity) {
            maxLine = line
        }
    }

    return maxLine.color
}

/**
 * Cria gradiente do espectro visível
 */
export function getVisibleSpectrumGradient(): string {
    return `linear-gradient(to right, 
        #8B00FF 0%,
        #4B0082 10%, 
        #0000FF 20%, 
        #00FFFF 30%, 
        #00FF00 45%, 
        #FFFF00 60%, 
        #FF8C00 75%, 
        #FF0000 90%,
        #8B0000 100%
    )`
}

/**
 * Converte comprimento de onda para posição percentual no espectro
 */
export function wavelengthToPosition(wavelength: number): number {
    // 380nm = 0%, 700nm = 100%
    return ((wavelength - 380) / (700 - 380)) * 100
}

/**
 * Lista todos os elementos com espectro conhecido
 */
export function getAvailableElements(): string[] {
    return Object.keys(ELEMENT_SPECTRA)
}

/**
 * Obtém linhas espectrais mais características de um elemento
 */
export function getCharacteristicLines(symbol: string, maxLines: number = 3): SpectralLine[] {
    const spectrum = ELEMENT_SPECTRA[symbol]
    if (!spectrum) return []

    return [...spectrum.lines]
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, maxLines)
}
