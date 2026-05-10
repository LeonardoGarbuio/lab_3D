// src/data/nuclearData.ts
export interface DecayStep {
  parent: string; parentZ: number; parentA: number
  type: 'alpha'|'beta-minus'|'beta-plus'|'gamma'|'electron-capture'
  daughter: string; daughterZ: number; daughterA: number
}

export interface RadioisotopeData {
  symbol: string; name: string; z: number; a: number
  halfLife: number; halfLifeUnit: string; halfLifeDisplay: string
  decayType: string
}

export const RADIOISOTOPES: RadioisotopeData[] = [
  { symbol:'U-238', name:'Urânio-238', z:92, a:238, halfLife:4.468e9, halfLifeUnit:'anos', halfLifeDisplay:'4,47 bilhões de anos', decayType:'α' },
  { symbol:'U-235', name:'Urânio-235', z:92, a:235, halfLife:7.04e8, halfLifeUnit:'anos', halfLifeDisplay:'704 milhões de anos', decayType:'α' },
  { symbol:'Th-232', name:'Tório-232', z:90, a:232, halfLife:1.405e10, halfLifeUnit:'anos', halfLifeDisplay:'14 bilhões de anos', decayType:'α' },
  { symbol:'C-14', name:'Carbono-14', z:6, a:14, halfLife:5730, halfLifeUnit:'anos', halfLifeDisplay:'5.730 anos', decayType:'β⁻' },
  { symbol:'Co-60', name:'Cobalto-60', z:27, a:60, halfLife:5.27, halfLifeUnit:'anos', halfLifeDisplay:'5,27 anos', decayType:'β⁻' },
  { symbol:'Ra-226', name:'Rádio-226', z:88, a:226, halfLife:1600, halfLifeUnit:'anos', halfLifeDisplay:'1.600 anos', decayType:'α' },
  { symbol:'I-131', name:'Iodo-131', z:53, a:131, halfLife:8.02, halfLifeUnit:'dias', halfLifeDisplay:'8,02 dias', decayType:'β⁻' },
  { symbol:'Sr-90', name:'Estrôncio-90', z:38, a:90, halfLife:28.8, halfLifeUnit:'anos', halfLifeDisplay:'28,8 anos', decayType:'β⁻' },
  { symbol:'Cs-137', name:'Césio-137', z:55, a:137, halfLife:30.17, halfLifeUnit:'anos', halfLifeDisplay:'30,17 anos', decayType:'β⁻' },
  { symbol:'Po-210', name:'Polônio-210', z:84, a:210, halfLife:138.4, halfLifeUnit:'dias', halfLifeDisplay:'138,4 dias', decayType:'α' },
  { symbol:'Tc-99m', name:'Tecnécio-99m', z:43, a:99, halfLife:6.01, halfLifeUnit:'horas', halfLifeDisplay:'6,01 horas', decayType:'γ' },
  { symbol:'F-18', name:'Flúor-18', z:9, a:18, halfLife:109.77, halfLifeUnit:'min', halfLifeDisplay:'109,77 min', decayType:'β⁺' },
]

export const URANIUM_SERIES: DecayStep[] = [
  { parent:'U-238', parentZ:92, parentA:238, type:'alpha', daughter:'Th-234', daughterZ:90, daughterA:234 },
  { parent:'Th-234', parentZ:90, parentA:234, type:'beta-minus', daughter:'Pa-234', daughterZ:91, daughterA:234 },
  { parent:'Pa-234', parentZ:91, parentA:234, type:'beta-minus', daughter:'U-234', daughterZ:92, daughterA:234 },
  { parent:'U-234', parentZ:92, parentA:234, type:'alpha', daughter:'Th-230', daughterZ:90, daughterA:230 },
  { parent:'Th-230', parentZ:90, parentA:230, type:'alpha', daughter:'Ra-226', daughterZ:88, daughterA:226 },
  { parent:'Ra-226', parentZ:88, parentA:226, type:'alpha', daughter:'Rn-222', daughterZ:86, daughterA:222 },
  { parent:'Rn-222', parentZ:86, parentA:222, type:'alpha', daughter:'Po-218', daughterZ:84, daughterA:218 },
  { parent:'Po-218', parentZ:84, parentA:218, type:'alpha', daughter:'Pb-214', daughterZ:82, daughterA:214 },
  { parent:'Pb-214', parentZ:82, parentA:214, type:'beta-minus', daughter:'Bi-214', daughterZ:83, daughterA:214 },
  { parent:'Bi-214', parentZ:83, parentA:214, type:'beta-minus', daughter:'Po-214', daughterZ:84, daughterA:214 },
  { parent:'Po-214', parentZ:84, parentA:214, type:'alpha', daughter:'Pb-210', daughterZ:82, daughterA:210 },
  { parent:'Pb-210', parentZ:82, parentA:210, type:'beta-minus', daughter:'Bi-210', daughterZ:83, daughterA:210 },
  { parent:'Bi-210', parentZ:83, parentA:210, type:'beta-minus', daughter:'Po-210', daughterZ:84, daughterA:210 },
  { parent:'Po-210', parentZ:84, parentA:210, type:'alpha', daughter:'Pb-206', daughterZ:82, daughterA:206 },
]

export const THORIUM_SERIES: DecayStep[] = [
  { parent:'Th-232', parentZ:90, parentA:232, type:'alpha', daughter:'Ra-228', daughterZ:88, daughterA:228 },
  { parent:'Ra-228', parentZ:88, parentA:228, type:'beta-minus', daughter:'Ac-228', daughterZ:89, daughterA:228 },
  { parent:'Ac-228', parentZ:89, parentA:228, type:'beta-minus', daughter:'Th-228', daughterZ:90, daughterA:228 },
  { parent:'Th-228', parentZ:90, parentA:228, type:'alpha', daughter:'Ra-224', daughterZ:88, daughterA:224 },
  { parent:'Ra-224', parentZ:88, parentA:224, type:'alpha', daughter:'Rn-220', daughterZ:86, daughterA:220 },
  { parent:'Rn-220', parentZ:86, parentA:220, type:'alpha', daughter:'Po-216', daughterZ:84, daughterA:216 },
  { parent:'Po-216', parentZ:84, parentA:216, type:'alpha', daughter:'Pb-212', daughterZ:82, daughterA:212 },
  { parent:'Pb-212', parentZ:82, parentA:212, type:'beta-minus', daughter:'Bi-212', daughterZ:83, daughterA:212 },
  { parent:'Bi-212', parentZ:83, parentA:212, type:'alpha', daughter:'Tl-208', daughterZ:81, daughterA:208 },
  { parent:'Tl-208', parentZ:81, parentA:208, type:'beta-minus', daughter:'Pb-208', daughterZ:82, daughterA:208 },
]

export const DECAY_TYPE_INFO = {
  'alpha': { symbol:'α', particle:'⁴₂He', desc:'Emissão de partícula alfa (2p+2n)', color:'#ef4444', deltaZ:-2, deltaA:-4 },
  'beta-minus': { symbol:'β⁻', particle:'e⁻+ν̄', desc:'Emissão de elétron e antineutrino', color:'#3b82f6', deltaZ:+1, deltaA:0 },
  'beta-plus': { symbol:'β⁺', particle:'e⁺+ν', desc:'Emissão de pósitron e neutrino', color:'#8b5cf6', deltaZ:-1, deltaA:0 },
  'gamma': { symbol:'γ', particle:'fóton', desc:'Emissão de radiação eletromagnética', color:'#22c55e', deltaZ:0, deltaA:0 },
  'electron-capture': { symbol:'CE', particle:'ν', desc:'Captura de elétron orbital pelo núcleo', color:'#f59e0b', deltaZ:-1, deltaA:0 },
}

export const FISSION_REACTION = {
  reactant: 'U-235', neutronIn: 1,
  products: ['Ba-141','Kr-92'], neutronsOut: 3,
  energy: 200, // MeV
  equation: '²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3¹₀n + 200 MeV',
}

export const FUSION_REACTION = {
  reactants: ['²H (D)','³H (T)'],
  products: ['⁴He','n'],
  energy: 17.6, // MeV
  equation: '²₁H + ³₁H → ⁴₂He + ¹₀n + 17,6 MeV',
  temperature: 150e6, // °C needed
}
