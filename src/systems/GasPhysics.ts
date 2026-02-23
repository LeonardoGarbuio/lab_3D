// src/systems/GasPhysics.ts
// Motor de física de gases - Lei dos Gases Ideais (PV = nRT)

export interface GasState {
    formula: string
    mols: number                // n (mols)
    pressure: number            // P (atm)
    volume: number              // V (litros)
    temperature: number         // T (Kelvin)
    containerMaxVolume: number  // Volume máximo do container
    isCompressed: boolean
    isExpanded: boolean
}

// Constante dos gases ideais
export const R = 0.0821  // L·atm/(mol·K)

/**
 * Calcula a pressão usando PV = nRT
 * P = nRT/V
 */
export function calculatePressure(n: number, T: number, V: number): number {
    if (V <= 0) return Infinity
    return (n * R * T) / V
}

/**
 * Calcula o volume usando PV = nRT
 * V = nRT/P
 */
export function calculateVolume(n: number, T: number, P: number): number {
    if (P <= 0) return Infinity
    return (n * R * T) / P
}

/**
 * Calcula a temperatura usando PV = nRT
 * T = PV/(nR)
 */
export function calculateTemperature(P: number, V: number, n: number): number {
    if (n <= 0) return 0
    return (P * V) / (n * R)
}

/**
 * Converte Celsius para Kelvin
 */
export function celsiusToKelvin(celsius: number): number {
    return celsius + 273.15
}

/**
 * Converte Kelvin para Celsius
 */
export function kelvinToCelsius(kelvin: number): number {
    return kelvin - 273.15
}

/**
 * Simula mudança de temperatura e calcula novo estado do gás
 */
export function changeTemperature(
    state: GasState,
    newTempCelsius: number,
    isConstantPressure: boolean = true
): GasState {
    const newTempKelvin = celsiusToKelvin(newTempCelsius)

    if (isConstantPressure) {
        // Lei de Charles: V1/T1 = V2/T2
        // V2 = V1 * T2/T1
        const newVolume = state.volume * (newTempKelvin / state.temperature)

        // Limitar ao volume máximo do container
        const clampedVolume = Math.min(newVolume, state.containerMaxVolume)
        const actualPressure = clampedVolume < newVolume
            ? calculatePressure(state.mols, newTempKelvin, clampedVolume)
            : state.pressure

        return {
            ...state,
            temperature: newTempKelvin,
            volume: clampedVolume,
            pressure: actualPressure,
            isExpanded: newVolume > state.volume,
            isCompressed: newVolume < state.volume
        }
    } else {
        // Volume constante - Lei de Gay-Lussac
        // P1/T1 = P2/T2
        const newPressure = state.pressure * (newTempKelvin / state.temperature)

        return {
            ...state,
            temperature: newTempKelvin,
            pressure: newPressure,
            isExpanded: false,
            isCompressed: false
        }
    }
}

/**
 * Simula mudança de pressão
 */
export function changePressure(
    state: GasState,
    newPressure: number,
    isConstantTemperature: boolean = true
): GasState {
    if (isConstantTemperature) {
        // Lei de Boyle: P1V1 = P2V2
        // V2 = P1V1/P2
        const newVolume = (state.pressure * state.volume) / newPressure
        const clampedVolume = Math.max(0.001, Math.min(newVolume, state.containerMaxVolume))

        return {
            ...state,
            pressure: newPressure,
            volume: clampedVolume,
            isCompressed: newVolume < state.volume,
            isExpanded: newVolume > state.volume
        }
    } else {
        // Pressão e temperatura variam juntas
        const newTemp = calculateTemperature(newPressure, state.volume, state.mols)

        return {
            ...state,
            pressure: newPressure,
            temperature: newTemp
        }
    }
}

/**
 * Calcula velocidade média das moléculas (para visualização)
 * v = sqrt(3RT/M) onde M é massa molar em kg/mol
 */
export function calculateMolecularSpeed(tempKelvin: number, molarMassGrams: number): number {
    const molarMassKg = molarMassGrams / 1000
    const R_joules = 8.314  // J/(mol·K)
    return Math.sqrt((3 * R_joules * tempKelvin) / molarMassKg)
}

/**
 * Cria estado inicial de um gás
 */
export function createGasState(
    formula: string,
    mols: number,
    tempCelsius: number,
    containerVolume: number,
    pressure: number = 1  // 1 atm padrão
): GasState {
    const tempKelvin = celsiusToKelvin(tempCelsius)

    // Calcular volume real do gás na pressão dada
    const actualVolume = calculateVolume(mols, tempKelvin, pressure)

    return {
        formula,
        mols,
        pressure,
        volume: Math.min(actualVolume, containerVolume),
        temperature: tempKelvin,
        containerMaxVolume: containerVolume,
        isCompressed: false,
        isExpanded: false
    }
}

/**
 * Interface para balão/recipiente expansível
 */
export interface BalloonState {
    id: string
    gasState: GasState
    radius: number              // Raio atual em metros
    maxRadius: number           // Raio máximo antes de estourar
    elasticity: number          // Coeficiente de elasticidade (0-1)
    color: string
    isPopped: boolean
}

/**
 * Calcula raio do balão baseado no volume
 * V = (4/3)πr³ → r = ∛(3V/4π)
 */
export function calculateBalloonRadius(volumeLiters: number): number {
    const volumeM3 = volumeLiters / 1000  // Converter para m³
    return Math.pow((3 * volumeM3) / (4 * Math.PI), 1 / 3)
}

/**
 * Atualiza estado do balão com base na temperatura
 */
export function updateBalloon(
    balloon: BalloonState,
    newTempCelsius: number
): BalloonState {
    if (balloon.isPopped) return balloon

    const newGasState = changeTemperature(balloon.gasState, newTempCelsius, true)
    const newRadius = calculateBalloonRadius(newGasState.volume)

    // Verificar se estourou
    if (newRadius > balloon.maxRadius) {
        return {
            ...balloon,
            gasState: newGasState,
            radius: 0,
            isPopped: true
        }
    }

    return {
        ...balloon,
        gasState: newGasState,
        radius: newRadius
    }
}

/**
 * Cria um balão com gás
 */
export function createBalloon(
    id: string,
    gasFormula: string,
    mols: number,
    tempCelsius: number,
    maxRadius: number = 0.15,
    color: string = '#ff6b6b'
): BalloonState {
    const gasState = createGasState(gasFormula, mols, tempCelsius, 10, 1)

    return {
        id,
        gasState,
        radius: calculateBalloonRadius(gasState.volume),
        maxRadius,
        elasticity: 0.8,
        color,
        isPopped: false
    }
}
