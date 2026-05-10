// src/data/atomicModelsData.ts
export interface AtomicModel {
  id: string; name: string; scientist: string; year: number
  icon: string; color: string; descriptionPt: string
  keyInsight: string; limitations: string; experiment: string
  shellConfig?: number[]
}

export const ATOMIC_MODELS: AtomicModel[] = [
  {
    id: 'dalton', name: 'Modelo de Dalton', scientist: 'John Dalton', year: 1803,
    icon: '⚫', color: '#8b8b8b',
    descriptionPt: 'O átomo é uma esfera maciça, indivisível e indestrutível. Todos os átomos de um mesmo elemento são idênticos.',
    keyInsight: 'Primeira teoria atômica científica. Explicou as leis ponderais.',
    limitations: 'Não explica partículas subatômicas nem fenômenos elétricos.',
    experiment: 'Leis Ponderais e proporções de massa em compostos.',
  },
  {
    id: 'thomson', name: 'Modelo de Thomson', scientist: 'J.J. Thomson', year: 1897,
    icon: '🟡', color: '#f0c040',
    descriptionPt: 'Esfera de carga positiva com elétrons incrustados — "pudim de passas". Carga total neutra.',
    keyInsight: 'Descoberta do elétron! Provou que o átomo é divisível.',
    limitations: 'Não explica espectro de emissão nem a existência do núcleo.',
    experiment: 'Tubo de Raios Catódicos — desvio por campos E e B revelou elétrons.',
  },
  {
    id: 'rutherford', name: 'Modelo de Rutherford', scientist: 'Ernest Rutherford', year: 1911,
    icon: '⚛️', color: '#ff6b35',
    descriptionPt: 'Núcleo pequeno, denso e positivo com elétrons orbitando. Maior parte é espaço vazio.',
    keyInsight: 'Descoberta do núcleo! Massa concentrada em volume ~10.000× menor.',
    limitations: 'Elétrons acelerados emitiriam radiação e colapsariam no núcleo.',
    experiment: 'Folha de Ouro — partículas α: maioria atravessou, raras ricochetearam.',
  },
  {
    id: 'bohr', name: 'Modelo de Bohr', scientist: 'Niels Bohr', year: 1913,
    icon: '🔵', color: '#4ea8de',
    descriptionPt: 'Elétrons em órbitas circulares quantizadas (K,L,M,N). Saltos emitem/absorvem fótons.',
    keyInsight: 'Quantização da energia! Explicou espectro do H. E = -13.6/n² eV.',
    limitations: 'Funciona apenas para H. Não explica efeito Zeeman anômalo.',
    experiment: 'Espectro do H: Hα=656nm, Hβ=486nm, Hγ=434nm, Hδ=410nm.',
    shellConfig: [2, 8, 18, 32],
  },
  {
    id: 'schrodinger', name: 'Modelo Quântico', scientist: 'Erwin Schrödinger', year: 1926,
    icon: '🌀', color: '#a855f7',
    descriptionPt: 'Elétron descrito por função de onda Ψ. |Ψ|² = probabilidade. Orbitais s,p,d,f.',
    keyInsight: 'Números quânticos (n,l,ml,ms). Princípio da Incerteza: Δx·Δp ≥ ℏ/2.',
    limitations: 'Modelo atual. Limitações são computacionais (sistemas multieletrônicos).',
    experiment: 'Difração de elétrons (Davisson-Germer, 1927) confirmou natureza ondulatória.',
  },
]

export const ORBITAL_COLORS: Record<string, string> = { s:'#4ea8de', p:'#f0c040', d:'#ff6b35', f:'#a855f7' }

export const HYDROGEN_TRANSITIONS = [
  { from:2, to:1, series:'Lyman', wavelength:121.6, color:'#8b5cf6' },
  { from:3, to:2, series:'Balmer', wavelength:656.3, color:'#ef4444' },
  { from:4, to:2, series:'Balmer', wavelength:486.1, color:'#06b6d4' },
  { from:5, to:2, series:'Balmer', wavelength:434.0, color:'#6366f1' },
  { from:4, to:3, series:'Paschen', wavelength:1875, color:'#dc2626' },
]
