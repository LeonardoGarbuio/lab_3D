# 📋 PROGRESS TRACKER — NASA-Grade Chemistry Lab

> **Última atualização:** 2026-04-18
> **Status Geral:** 🟢 Em Rápida Expansão

### Legenda
- `[ ]` — Não iniciado
- `[/]` — Em progresso  
- `[x]` — Completo e testado
- `[~]` — Parcialmente implementado (funciona mas falta profundidade)

---

## 🤯 UX / Interação Visual Principal

- [~] Microscópio Quântico com Holograma VSEPR (`MoleculeViewer.tsx` — básico)
- [ ] Escurecimento do lab ao ativar holograma + molécula massiva flutuante
- [ ] Drag & Drop de pares de elétrons → deformação geométrica em tempo real
- [ ] Mergulho Subatômico (zoom: molécula → átomo → núcleo → orbitais s/p/d/f)
- [ ] Nuvens de probabilidade eletrônica nas camadas K, L, M, N
- [ ] Salto quântico visual com emissão de fóton colorido
- [~] HUD Estequiométrico Dinâmico (`LabHUD.tsx` — existe mas incompleto)
- [ ] Equação balanceada instantânea ao misturar
- [ ] Reagente Limitante calculado ao vivo no HUD
- [ ] ΔH exibido ao vivo no HUD
- [ ] Painel de mols/concentração em tempo real

---

## 🧪 Nível I: Currículo Universal de Ensino Médio

### 1. Atomística e Mecânica Quântica Básica

- [x] Visualização dos Modelos Atômicos históricos (Dalton, Thomson, Rutherford, Bohr, Schrödinger)
- [x] Sistema de Configuração Eletrônica (Pauling, Hund, Aufbau)
- [x] Princípio de Exclusão de Pauli (bloqueio de configurações inválidas)
- [x] Tabela Periódica Interativa (`PeriodicTable.tsx` — 118 elementos)
- [x] Gráficos interativos de Propriedades Periódicas (Raio Atômico, EI, EN, Afinidade)
- [x] Comparação Pauling vs Mulliken vs Allred-Rochow para eletronegatividade
- [x] Radioatividade: partículas α, β, raios γ
- [x] Curvas de Meia-Vida logarítmicas
- [x] Séries de Decaimento (ex: Urânio → Chumbo)
- [x] Fissão Nuclear em cadeia (nêutrons)
- [x] Fusão Nuclear (Deutério + Trítio)
- [X] Captura Eletrônica / Emissão de Pósitron (β⁺)

### 2. Geometria Molecular, Hibridização e Forças Intermoleculares

- [x] VSEPR — geometrias básicas implementadas
- [x] Geometrias faltantes: Forma de T, Gangorra (Seesaw), Quadrada Plana, Piramidal Base Quadrada, Pentagonal Bipiramidal
- [x] Hibridização visual: promoções eletrônicas sp, sp², sp³, sp³d, sp³d², sp³d³
- [x] Diferenciação visual ligações σ (axial) e π (sobreposição)
- [x] Estruturas Ressonantes com deslocalização (benzeno, ozônio)
- [x] Cargas Formais ao vivo
- [x] Ciclo de Born-Haber (ligações iônicas em grades cristalinas de Bravais)
- [x] Teoria das Bandas (Band Gap de semicondutores para ligações metálicas)
- [x] Ligação Covalente Dativa / Coordenada visual
- [x] Expansão do Octeto (Cl, P, S)
- [x] Forças Intermoleculares controlando tensão superficial no motor SPH:
  - [x] Íon-Dipolo
  - [x] Pontes de Hidrogênio 
  - [x] Forças de London (Dipolo Induzido)
  - [x] Dipolo-Dipolo

### 3. Físico-Química: Termodinâmica, Cinética e Eletroquímica

**Estequiometria:**
- [~] Cálculo de Massa Molar (`calculateMolarMass`)
- [~] Reagente Limitante (`calculateLimitingReagent` — existe mas não integrado ao HUD)
- [ ] Leis Ponderais visuais (Lavoisier, Proust, Dalton)
- [ ] Gay-Lussac volumétrica
- [ ] Grau de Pureza no inventário

**Gases:**
- [x] Lei dos Gases Ideais PV=nRT (`GasPhysics.ts`)
- [x] Lei de Boyle (P₁V₁ = P₂V₂)
- [x] Lei de Charles (V₁/T₁ = V₂/T₂)
- [x] Lei de Gay-Lussac (P₁/T₁ = P₂/T₂)
- [ ] Misturas Gasosas — Pressão Parcial de Dalton
- [ ] Difusão/Efusão de Graham (visual no exaustor)
- [ ] Van der Waals: [P + a(n/V)²][V - nb] = nRT

**Termoquímica:**
- [ ] Banco de Entalpias de Formação Padrão (ΔH°f)
- [ ] Lei de Hess
- [ ] Entalpia de Combustão e Ligação
- [ ] Entropia (ΔS)
- [ ] Energia Livre de Gibbs: ΔG = ΔH - TΔS
- [ ] Bloqueio de reações não-espontâneas (ΔG > 0)
- [ ] Bomba Calorimétrica no HUD

**Cinética:**
- [ ] Ordens de Reação (0ª, 1ª, 2ª, Pseudo-1ª)
- [ ] Lei de Velocidade
- [ ] Curva de Decaimento Logarítmica
- [ ] Meia-Vida Cinética (t₁/₂)
- [ ] Equação de Arrhenius: k = Ae^(-Ea/RT)
- [ ] Energia de Ativação (Ea) — gráfico
- [ ] Complexo Ativado
- [ ] Catalisadores Homogêneos/Heterogêneos (alterar Ea no gráfico)

**Eletroquímica:**
- [x] Eletrólise com Faraday (`ElectrolysisSystem.ts`)
- [x] Potenciais Padrão de Redução
- [ ] Pilhas Galvânicas (voltaica)
- [ ] Equação de Nernst avançada (pares não-padrão)
- [ ] Multímetro na bancada
- [ ] Galvanoplastia visual
- [ ] Refino catódico

### 4. Equilíbrios Químicos e Soluções

**Soluções:**
- [~] Molaridade (básica no store)
- [ ] Molalidade (m/kg)
- [ ] Frações Molares cruzadas
- [ ] ppm / ppb / ppt
- [ ] Lei de Henry: S = kH·Pg (gás escapando em descompressão)

**Propriedades Coligativas:**
- [ ] Tonoscopia (Lei de Raoult)
- [ ] Ebulioscopia (constante Kb)
- [ ] Crioscopia (constante Kf)
- [ ] Osmose e Pressão Osmótica
- [ ] Fator de Van't Hoff (i)

**Equilíbrio:**
- [ ] Constante de Equilíbrio Kc
- [ ] Constante de Equilíbrio Kp
- [ ] Produto de Solubilidade (Kps) — precipitação visual ao violar Kps
- [ ] Le Chatelier Dinâmico on-the-fly (pressão/temp/concentração)
- [ ] Deslocamento visual do equilíbrio em tempo real

**Titulação / pH:**
- [~] Titulação básica (`TitrationSystem.ts`)
- [ ] pKa / pKb / pKw (dissociação logarítmica)
- [ ] Ácidos/Bases fracas multipróticas
- [ ] Henderson-Hasselbalch
- [ ] Sistemas Tampão reais
- [ ] Bureta eletrônica de gotejamento com indicador  

### 5. Química Inorgânica Pura

- [ ] Nomenclatura avançada: Óxidos Neutros/Anfóteros, Peróxidos, Superóxidos, Hidretos, Carbetos
- [ ] Fila de Reatividade completa (eletropositividade metálica)
- [ ] Teoria Ácido-Base de Arrhenius
- [ ] Teoria Ácido-Base de Brønsted-Lowry
- [ ] Teoria Ácido-Base de Lewis (HSAB)
- [ ] Campo Cristalino (cor de complexos octaédricos/tetraédricos)
- [ ] Complexos hexaaquometal

### 6. Química Orgânica Mecanizada

**Modelagem:**
- [ ] Tipologia de Carbonos (sp³/sp²/sp com ângulos) em holograma
- [ ] Construção de moléculas orgânicas pelo usuário
- [ ] Anéis aromáticos (Kekulé) com regra de Hückel (4n+2)
- [ ] Esqueletos conjugados e ramificados

**Funções Orgânicas:**
- [~] Algumas reações orgânicas (`OrganicReactionsSystem.ts`)
- [ ] Catálogo completo: álcool, fenol, éter, ácido carboxílico, éster, aldeído, cetona, amina, amida, nitrila, tiol, organometálico (Grignard)

**Isomeria:**
- [ ] Polarímetro visual (desvio de luz polarizada)
- [ ] Enantiômeros Levogiro (-) / Dextrogiro (+)
- [ ] Cahn-Ingold-Prelog (E/Z)
- [ ] Tautomeria Ceto-Enólica (flip de elétrons)
- [ ] C Quiral e diastereoisômeros
- [ ] Racematos

**Mecanismos Reacionais:**
- [ ] Substituição Eletrofílica Aromática (M-O-P)
- [ ] SN1 (carbocátion intermediário)
- [ ] SN2 (inversão de Walden holográfica)
- [ ] E1 / E2 (Zaitsev vs Hofmann)
- [ ] Oxidação branda (Baeyer)
- [ ] Ozonólise
- [ ] Markovnikov / Anti-Markovnikov (Kharasch)
- [ ] Visualização frame-by-frame dos mecanismos

### 7. Processos Físicos e Tecnologias de Refino

- [x] Destilação Simples/Fracionada (`DistillationSystem.ts` + `DistillationApparatus.tsx`)
- [ ] Evaporador Rotativo (RV-10)
- [ ] Cromatografia TLC (Placa)
- [ ] Cromatografia em Papel
- [ ] Filtração a Vácuo (Büchner visual)
- [ ] Centrifugação (Eppendorfs)
- [ ] Levigação
- [ ] Flotação em tensoativo
- [ ] Chuva Ácida (corrosão de Carbonato visual)
- [ ] Fotólise de CFCs (radicais Cl• destruindo O₃)

---

## 🔬 Nível II: Química Analítica e Instrumental

### 1. Espectrometria de Massas (HRMS)
- [ ] Ionização (EI, ESI) em UI
- [ ] Tubo de vácuo curvo com campo eletromagnético (Lorentz)
- [ ] Gráfico m/z interativo
- [ ] Identificação de isótopos moleculares
- [ ] Base Peak (esqueleto de carbono)

### 2. Cromatografias Avançadas
- [ ] GC-MS: forno, coluna capilar, gás de arraste, cromatograma
- [ ] HPLC: bomba 400+ Bar, coluna C18, gradiente Água/Acetonitrila, UV

### 3. Catedral Espectroscópica
- [x] Espectroscopia de Emissão (10 elementos — `SpectroscopySystem.ts`)
- [ ] RMN ¹H: Chemical Shift (ppm), J-Coupling (multiplicidade), integrações
- [ ] RMN ¹³C
- [ ] FTIR: Stretching, Scissoring, Wagging (400–4000 cm⁻¹)
- [ ] Carbonila a ~1700 cm⁻¹
- [ ] UV-Vis

### 4. Condutividade e Auto-Tituladores
- [ ] Micro-eletrodos de vidro
- [ ] Primeira Derivada (dE/dV)  
- [ ] Segunda Derivada
- [ ] Conformidade ISO 17025

---

## 🌌 Nível III: Simulação Espacial e Astroquímica

### 1. Câmaras UHV
- [ ] Bombas turbomoleculares magnéticas
- [ ] Pressão < 10⁻¹¹ Torr
- [ ] Bake-Out molecular (300°C nas paredes)
- [ ] Outgassing de vapor de água
- [ ] Sublimação agressiva em vácuo (cometas)

### 2. Aceleradores e Síncrotrons
- [ ] LINAC e Ciclotron em UI
- [ ] Scattering de Rutherford interativo
- [ ] Transmutação (Ca + Am → Moscóvio)
- [ ] Degradação polimérica por raios γ

### 3. Criogenia
- [ ] Tanques He-3/He-4 diluidores
- [ ] Temperaturas em miliKelvins (~0.001 K)
- [ ] Superfluido Hélio (viscosidade 0, escalar paredes)
- [ ] Condensado de Bose-Einstein visual
- [ ] Supercondutores YBCO em N₂ líquido
- [ ] Efeito Meissner (levitação magnética)

---

## 🕳️ Nível IV: In Silico — Computação Quântica e IA Molecular

### 1. Ab initio / DFT
- [ ] Exportação .XYZ, .PDB, .CIF
- [ ] Integração CLI transparente (ORCA, Quantum ESPRESSO, NWChem)
- [ ] Basis Sets: 6-31G*, def2-SVP, cc-pVTZ
- [ ] Métodos: B3LYP, PBE, CCSD(T)

### 2. Dinâmica Molecular
- [ ] Motor MD (estilo GROMACS/LAMMPS)
- [ ] Ensembles NVT (Nosé-Hoover)
- [ ] Ensembles NPT (Parrinello-Rahman)
- [ ] Molecular Docking (proteínas)
- [ ] Visualização de protein folding

### 3. Machine Learning Molecular
- [ ] MLIPs (Machine Learning Interatomic Potentials)
- [ ] Python scripting embutido (Active Learning)
- [ ] AiiDA workflow

---

## 📊 Nível V: Auditoria Científica

### 1. Propagação de Erro (σ)
- [ ] Campo `uncertainty` em toda medição do LabObject
- [ ] Propagação derivativa paralela (GUM/ISO)
- [ ] Classes de precisão por instrumento (Classe A, B)
- [ ] Efeito da temperatura na calibração
- [ ] HUD Metrológico: `5.00 ± 0.08 mol/L (σ)`
- [ ] Soma em quadratura: σ_total = √(σ₁² + σ₂²)

### 2. Parser SMILES / InChI
- [ ] Parser lexical de SMILES
- [ ] Parser InChI
- [ ] Force Field Embedding (MMFF94) → coordenadas 3D
- [ ] Integração com MoleculeViewer
- [ ] UI "Constructor" com terminal de entrada

### 3. Exportação de Relatórios
- [ ] Exportação CSV (log completo: pH, T, t, pressão, reações)
- [ ] Banco SQLite paralelo (armazenar cada micro-flutuação)
- [ ] Geração de LaTeX/PDF com MathJax/KaTeX
- [ ] Equações balanceadas no relatório
- [ ] Gráficos integrados do experimento no PDF

---

## ⚡ Nível VI: Bioquímica de Interfaces e Física Quântica

### 1. Efeito Zeeman
- [ ] Controle de magneto supercondutor (campo B) no UI
- [ ] Splitting de linhas espectrais: 1 → 3 (Normal Zeeman)
- [ ] Fórmula: Δλ = eλ²B / (4πmₑc)
- [ ] Visualização no gráfico de espectro em tempo real

### 2. Efeito Stark
- [ ] Eletrodos de alta voltagem (campo E)
- [ ] Efeito Stark linear (Hidrogênio)
- [ ] Efeito Stark quadrático (outros átomos)
- [ ] Deslocamento + splitting das linhas espectrais

### 3. Transporte Nernst-Planck e Potencial Zeta
- [ ] Equação de Nernst-Planck: J = -D(∂c/∂x) - (zFDc/RT)(∂φ/∂x)
- [ ] Camada Dupla Elétrica (Stern + Difusa)
- [ ] Potencial Zeta (mV)
- [ ] Controle de campo elétrico horizontal no béquer
- [ ] Micro-eletroforese visual
- [ ] Coagulação/estabilização coloidal

---

## 💻 Arquitetura do Motor Físico-Químico

### Cinética Estocástica
- [ ] Algoritmo de Gillespie (Monte Carlo cinético)
- [ ] Arrhenius dinâmico no frame loop: k = Ae^(-Ea/RT)
- [ ] RNG físico determinando probabilidade de colisão
- [ ] Concentrações ultra-baixas → tempo real de espera

### GPU e Performance
- [x] Throttling de re-renders de estado (setState bypass para WebGL 60FPS)
- [x] Object Pooling implementado em reações intensas (Eletrólise/Destilação)
- [x] Mitigação do limite de Pixel Ratio (DPR) em telas 4K/Retina
- [x] Remoção de Shadow Maps transversais em Malhas de Vidro Transparentes 
- [ ] WebGPU Compute Shaders (migrar cálculos pesados)
- [ ] PES (Potential Energy Surface) renderizada
- [ ] 10M+ instâncias de partículas

### Arquitetura de Nível (Level Design)
- [x] Expansão volumétrica de sala do laboratório (Room bounds: 26x18)
- [x] Rotação Dinâmica via tensores de matriz para disposição matricial de Bancadas
- [x] Layout segmentado (Ilha Central, Síntese Avançada e Análise Instrumental)

### Dados Termodinâmicos
- [ ] NIST-JANAF Tables integradas
- [ ] Cp polinomial: Cp = A + BT + CT² + DT³ + ET⁻²
- [ ] Perfis termofísicos variáveis por grau
- [ ] Choque Térmico (frasco estilhaçando por ΔT brusco)

### Mecânica de Fluidos
- [ ] SPH (Smoothed-Particle Hydrodynamics)
- [ ] Navier-Stokes incompressível
- [ ] Número de Weber (inércia vs tensão superficial)
- [ ] Número de Bond capilar
- [ ] Dispersão Browniana visual (plumas de corante)
- [ ] Agitador Magnético → vórtice hidrodinâmico
- [ ] Microgravidade (g = 0 m/s² — ISS Mode)
- [ ] Fluidos não-newtonianos
- [ ] Tensão superficial dominante em zero-G

### Espectroscopia Visual
- [ ] Beer-Lambert: A = ε·c·l (cor dinâmica por concentração)
- [ ] Lâmpadas espectrais intercambiáveis (Sódio monocromática, LED branco)
- [ ] Substância "some" sob luz errada (absorção total)
- [ ] Doppler Broadening gaussiano nos picos espectrais
- [ ] Alargamento por pressão (Lorentziano)

### Equilíbrio e Gases Reais
- [ ] Le Chatelier dinâmico ininterrupto on-the-fly
- [ ] Van der Waals: [P + a(n/V)²][V - nb] = nRT
- [ ] Liquefação de gás por compressão extrema
- [ ] Equilíbrio NO₂ ↔ N₂O₄ com mudança de cor visual

### Caos e Impurezas
- [ ] Efeito Isotópico Cinético (KIE) — D₂O vs H₂O
- [ ] Impurezas RNG (pureza 97% em reagentes baratos)
- [ ] Reações laterais espúrias gerando borras
- [ ] Loja de suprimentos com graus de pureza

---

## ⚙️ Inventário e Hardware Simulado

### Vidrarias
- [x] Béquer (`Beaker.tsx`, `InteractiveBeaker.tsx`)
- [x] Erlenmeyer (`Erlenmeyer.tsx`)
- [x] Tubo de Ensaio + Rack (`TestTube.tsx`, `TestTubeRack.tsx`)
- [x] Pipeta (`Pipette.tsx`)
- [x] Bureta (`Burette.tsx`, `InteractiveBurette.tsx`)
- [x] Cilindro Graduado (`GraduatedCylinder.tsx`, `InteractiveGraduatedCylinder.tsx`)
- [x] Funil de Separação (`SeparatingFunnel.tsx`)
- [ ] Balão de Fundo Chato
- [ ] Balão de Fundo Redondo
- [ ] Reatores Bi/Tri-gargalo
- [ ] Balões Volumétricos (Classe A/AS)

### Condensadores
- [~] Condensador básico (no aparelho de destilação)
- [ ] Condensador Liebig vertical
- [ ] Condensador Graham (serpentina)
- [ ] Condensador Allihn (esferóide)

### Aquecimento
- [x] Bico de Bunsen (`BunsenBurner.tsx`)
- [ ] Manta Aquecedora esférica
- [ ] Banho Termostático (óleo sintético)
- [ ] Barras de Agitação Magnética (Stirring Bars) com vórtice
- [ ] Maçarico Industrial
- [ ] Arco de Plasma

### Segurança
- [~] Alertas de segurança (`SafetyWarnings.tsx`, `SafetySystem.ts`, `HazardDetection.ts`)
- [ ] Capela Química com exaustor digital (visor HUD)
- [ ] Glovebox (atmosfera inerte / Argônio)
- [ ] Pressurização reversa contínua

### Instrumentação
- [x] Termômetro (`Thermometer.tsx`)
- [x] Manômetro (`Manometer.tsx`)
- [x] Espectrômetro de Emissão (`Spectrometer.tsx`)
- [x] Célula de Eletrólise (`ElectrolysisCell.tsx`)
- [x] Aparelho de Destilação (`DistillationApparatus.tsx`)
- [x] Prato de Cristalização (`CrystallizationDish.tsx`)
- [x] Vaso de Reação Orgânica (`OrganicReactionVessel.tsx`)
- [ ] Funil de Büchner (filtração a vácuo)
- [ ] Centrífuga (Eppendorf)
- [ ] Polarímetro
- [ ] Multímetro elétrico
- [ ] Evaporador Rotativo

---

## 📈 Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de Features | ~210 |
| ✅ Completas | ~18 |
| [~] Parciais | ~8 |
| ❌ Faltantes | ~184 |
| **Progresso** | **~9%** |

---

> *Atualizado a cada sessão de desenvolvimento. Quando completar uma feature, marcar com `[x]` e atualizar a data no topo.*
