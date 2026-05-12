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
export const R = 0.0821  // L·atm/(mol·K)\n
// Constantes de Van der Waals (a: L²·atm/mol², b: L/mol)
export const VAN_DER_WAALS_CONSTANTS: Record<string, { a: number, b: number }> = {
    'H2O': { a: 5.464, b: 0.03049 },
    'CO2': { a: 3.592, b: 0.04267 },
    'O2': { a: 1.360, b: 0.03183 },
    'N2': { a: 1.390, b: 0.03913 },
    'H2': { a: 0.2444, b: 0.02661 },
    'NH3': { a: 4.170, b: 0.03707 },
    'CH4': { a: 2.253, b: 0.04278 },
    'He': { a: 0.03412, b: 0.02370 },
    'DEFAULT': { a: 0, b: 0 } // Gás Ideal
}

export function getVDWConstants(formula: string) {
    return VAN_DER_WAALS_CONSTANTS[formula] || VAN_DER_WAALS_CONSTANTS['DEFAULT']
}


/**
 * Calcula a pressão usando PV = nRT
 * P = nRT/V
 */
export function calculatePressure(n: number, T: number, V: number, formula: string = 'DEFAULT'): number {
    if (V <= 0) return Infinity
    const { a, b } = getVDWConstants(formula)
    
    // P = nRT/(V - nb) - a(n/V)²
    const effectiveVolume = V - n * b
    if (effectiveVolume <= 0) return Infinity // Compressão máxima física
    
    return ((n * R * T) / effectiveVolume) - (a * Math.pow(n / V, 2))
}

/**
 * Calcula o volume usando PV = nRT
 * V = nRT/P
 */
export function calculateVolume(n: number, T: number, P: number, formula: string = 'DEFAULT'): number {
    if (P <= 0) return Infinity
    const { a, b } = getVDWConstants(formula)
    
    // Se for gás ideal, usa a fórmula simples
    if (a === 0 && b === 0) return (n * R * T) / P
    
    // Para Van der Waals, usamos Newton-Raphson para achar a raiz de f(V) = 0
    // f(V) = (P + a*n²/V²)(V - nb) - nRT = 0
    let V = (n * R * T) / P // Chute inicial (Gás Ideal)
    const maxIters = 20
    const tol = 1e-6
    
    for (let i = 0; i < maxIters; i++) {
        const n2 = n * n
        const V2 = V * V
        const V3 = V2 * V
        
        const fV = (P + a * n2 / V2) * (V - n * b) - n * R * T
        // Derivada: f'(V) = P - a*n²/V² + 2*a*b*n³/V³
        const dfV = P - (a * n2 / V2) + (2 * a * b * Math.pow(n, 3) / V3)
        
        const dV = fV / dfV
        V -= dV
        
        if (Math.abs(dV) < tol) break
    }
    
    // Evitar retornos físicos impossíveis (menor que o volume das próprias partículas)
    return Math.max(V, n * b + 0.001)
}

/**
 * Calcula a temperatura usando PV = nRT
 * T = PV/(nR)
 */
export function calculateTemperature(P: number, V: number, n: number, formula: string = 'DEFAULT'): number {
    if (n <= 0) return 0
    const { a, b } = getVDWConstants(formula)
    
    // T = (P + a*n²/V²)(V - nb) / nR
    const P_eff = P + a * Math.pow(n / V, 2)
    const V_eff = V - n * b
    
    if (V_eff <= 0) return 0 // Inválido
    
    return (P_eff * V_eff) / (n * R)
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
            ? calculatePressure(state.mols, newTempKelvin, clampedVolume, state.formula)
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
        const newVolume = calculateVolume(state.mols, state.temperature, newPressure, state.formula)
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
        const newTemp = calculateTemperature(newPressure, state.volume, state.mols, state.formula)

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
    const actualVolume = calculateVolume(mols, tempKelvin, pressure, formula)

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
