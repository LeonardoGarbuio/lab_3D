// src/data/experiments.ts
// Biblioteca de experimentos guiados

export interface ExperimentStep {
    id: number
    instruction: string
    action: 'add-element' | 'add-reagent' | 'mix' | 'heat' | 'shake' | 'observe'
    target?: string // Símbolo do elemento ou fórmula
    validation?: (state: any) => boolean
    hint?: string
}

export interface Experiment {
    id: string
    title: string
    category: 'química' | 'física' | 'biologia'
    difficulty: 'fácil' | 'médio' | 'difícil'
    duration: string
    description: string
    objective: string
    materials: string[]
    steps: ExperimentStep[]
    expectedResult: string
    explanation: string
    icon: string
}

export const EXPERIMENTS: Experiment[] = [
    {
        id: 'water-synthesis',
        title: 'Síntese da Água',
        category: 'química',
        difficulty: 'fácil',
        duration: '5 min',
        description: 'Combine gás hidrogênio e gás oxigênio para formar água.',
        objective: 'Entender a formação de compostos moleculares e reações exotérmicas.',
        icon: '💧',
        materials: ['Gás Hidrogênio (H₂)', 'Gás Oxigênio (O₂)', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Selecione um béquer vazio', action: 'observe' },
            { id: 2, instruction: 'Adicione Gás Hidrogênio (H₂) ao béquer', action: 'add-reagent', target: 'H2', hint: 'Abra o painel de Reagentes e selecione H₂' },
            { id: 3, instruction: 'Selecione outro béquer vazio', action: 'observe' },
            { id: 4, instruction: 'Adicione Gás Oxigênio (O₂) ao segundo béquer', action: 'add-reagent', target: 'O2', hint: 'Abra o painel de Reagentes e selecione O₂' },
            { id: 5, instruction: 'Certifique-se de que a temperatura está pelo menos 25°C (temperatura ambiente)', action: 'observe', hint: 'A reação funciona à temperatura ambiente' },
            { id: 6, instruction: 'Despeje o H₂ no O₂', action: 'mix', hint: 'Duplo clique no béquer com H₂, depois clique no béquer com O₂' },
            { id: 7, instruction: 'Observe a formação de água (H₂O)!', action: 'observe' },
        ],
        expectedResult: 'Formação de água (H₂O) com bolhas e liberação de energia.',
        explanation: '2H₂ + O₂ → 2H₂O. Esta é uma reação de síntese exotérmica. Na proporção ideal, são necessários 2 mols de hidrogênio para cada 1 mol de oxigênio. Em laboratório real, precisaria de uma faísca elétrica para iniciar, mas aqui a reação ocorre espontaneamente para facilitar o aprendizado.',
    },
    {
        id: 'acid-base-neutralization',
        title: 'Neutralização Ácido-Base',
        category: 'química',
        difficulty: 'fácil',
        duration: '5 min',
        description: 'Reação entre ácido clorídrico e hidróxido de sódio.',
        objective: 'Demonstrar a neutralização e formação de sal + água.',
        icon: '⚗️',
        materials: ['HCl (Ácido Clorídrico)', 'NaOH (Hidróxido de Sódio)', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione HCl a um béquer (via Reagentes)', action: 'add-reagent', target: 'HCl' },
            { id: 2, instruction: 'Adicione NaOH a outro béquer', action: 'add-reagent', target: 'NaOH' },
            { id: 3, instruction: 'Despeje o HCl no NaOH', action: 'mix' },
            { id: 4, instruction: 'Observe a reação exotérmica!', action: 'observe' },
        ],
        expectedResult: 'Formação de NaCl (sal) + H2O com liberação de calor.',
        explanation: 'HCl + NaOH → NaCl + H₂O. Os íons H⁺ do ácido se combinam com os íons OH⁻ da base formando água, enquanto Na⁺ e Cl⁻ formam o sal.',
    },
    {
        id: 'baking-soda-vinegar',
        title: 'Vulcão de Bicarbonato',
        category: 'química',
        difficulty: 'fácil',
        duration: '3 min',
        description: 'A clássica reação de bicarbonato com vinagre.',
        objective: 'Observar a produção de gás CO2.',
        icon: '🌋',
        materials: ['Bicarbonato de Sódio (NaHCO3)', 'Vinagre (CH3COOH)', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione Bicarbonato (NaHCO3) a um béquer', action: 'add-reagent', target: 'NaHCO3' },
            { id: 2, instruction: 'Adicione Vinagre (CH3COOH) a outro béquer', action: 'add-reagent', target: 'CH3COOH' },
            { id: 3, instruction: 'Despeje o vinagre no bicarbonato', action: 'mix' },
            { id: 4, instruction: 'Observe as bolhas de CO2!', action: 'observe' },
        ],
        expectedResult: 'Efervescência intensa com produção de bolhas de CO2.',
        explanation: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑. O gás carbônico produzido causa a efervescência característica.',
    },
    {
        id: 'boiling-water',
        title: 'Ponto de Ebulição',
        category: 'física',
        difficulty: 'fácil',
        duration: '5 min',
        description: 'Observe a água fervendo a 100°C.',
        objective: 'Entender mudança de estado e ponto de ebulição.',
        icon: '🫧',
        materials: ['Água (H2O)', 'Fonte de calor'],
        steps: [
            { id: 1, instruction: 'Adicione Água (H2O) a um béquer', action: 'add-reagent', target: 'H2O' },
            { id: 2, instruction: 'Clique no botão 🔥 para aquecer', action: 'heat' },
            { id: 3, instruction: 'Observe a temperatura subindo', action: 'observe' },
            { id: 4, instruction: 'Quando chegar a 100°C, observe a fervura!', action: 'observe' },
        ],
        expectedResult: 'Água ferve a 100°C com bolhas intensas.',
        explanation: 'A 100°C (ao nível do mar), a pressão de vapor da água iguala a pressão atmosférica, causando a ebulição. As moléculas de água passam do estado líquido para gasoso.',
    },
    {
        id: 'precipitation',
        title: 'Formação de Precipitado',
        category: 'química',
        difficulty: 'médio',
        duration: '5 min',
        description: 'Formação de cloreto de prata (AgCl) - precipitado branco.',
        objective: 'Observar uma reação de precipitação.',
        icon: '⬇️',
        materials: ['Nitrato de Prata (AgNO3)', 'Cloreto de Sódio (NaCl)', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione AgNO3 a um béquer', action: 'add-reagent', target: 'AgNO3' },
            { id: 2, instruction: 'Adicione NaCl a outro béquer', action: 'add-reagent', target: 'NaCl' },
            { id: 3, instruction: 'Misture as soluções', action: 'mix' },
            { id: 4, instruction: 'Observe o precipitado branco se formando!', action: 'observe' },
        ],
        expectedResult: 'Formação de precipitado branco de AgCl.',
        explanation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃. O cloreto de prata é insolúvel em água e precipita como sólido branco.',
    },
    {
        id: 'indicator-test',
        title: 'Teste com Indicador',
        category: 'química',
        difficulty: 'médio',
        duration: '5 min',
        description: 'Use fenolftaleína para detectar bases.',
        objective: 'Entender o funcionamento de indicadores de pH.',
        icon: '🎨',
        materials: ['NaOH (Base)', 'Fenolftaleína', '1 Béquer'],
        steps: [
            { id: 1, instruction: 'Adicione NaOH a um béquer', action: 'add-reagent', target: 'NaOH' },
            { id: 2, instruction: 'Adicione Fenolftaleína', action: 'add-reagent', target: 'phenolphthalein' },
            { id: 3, instruction: 'Observe a mudança de cor!', action: 'observe' },
        ],
        expectedResult: 'Solução fica rosa/magenta.',
        explanation: 'A fenolftaleína é incolor em meio ácido/neutro e rosa em meio básico (pH > 8). Ela muda de estrutura molecular em diferentes pH.',
    },
    {
        id: 'titration',
        title: 'Titulação Ácido-Base',
        category: 'química',
        difficulty: 'médio',
        duration: '10 min',
        description: 'Determine a concentração de um ácido usando uma base de concentração conhecida.',
        objective: 'Aprender a técnica de titulação e identificar o ponto de equivalência.',
        icon: '📊',
        materials: ['HCl (Ácido Clorídrico)', 'NaOH (Hidróxido de Sódio)', 'Fenolftaleína', 'Bureta', 'Béquer'],
        steps: [
            { id: 1, instruction: 'Adicione HCl a um béquer', action: 'add-reagent', target: 'HCl' },
            { id: 2, instruction: 'Adicione Fenolftaleína ao béquer', action: 'add-reagent', target: 'phenolphthalein' },
            { id: 3, instruction: 'Adicione NaOH a outro béquer', action: 'add-reagent', target: 'NaOH' },
            { id: 4, instruction: 'Despeje lentamente NaOH no HCl', action: 'mix' },
            { id: 5, instruction: 'Observe a mudança de cor ao atingir o ponto de equivalência!', action: 'observe' },
        ],
        expectedResult: 'Solução muda de incolor para rosa no ponto de equivalência.',
        explanation: 'No ponto de equivalência, a quantidade de base adicionada neutraliza exatamente o ácido. A fenolftaleína indica essa mudança ao ficar rosa em pH > 8.',
    },
    {
        id: 'golden-rain',
        title: 'Chuva de Ouro',
        category: 'química',
        difficulty: 'médio',
        duration: '5 min',
        description: 'Formação espetacular de cristais amarelos de iodeto de chumbo.',
        objective: 'Observar uma reação de precipitação com produto colorido.',
        icon: '✨',
        materials: ['Nitrato de Chumbo Pb(NO3)2', 'Iodeto de Potássio KI', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione Pb(NO3)2 a um béquer', action: 'add-reagent', target: 'Pb(NO3)2' },
            { id: 2, instruction: 'Adicione KI a outro béquer', action: 'add-reagent', target: 'KI' },
            { id: 3, instruction: 'Aquecça ambas as soluções levemente', action: 'heat', hint: 'Clique no botão 🔥' },
            { id: 4, instruction: 'Misture as soluções quentes', action: 'mix' },
            { id: 5, instruction: 'Observe os cristais dourados se formando!', action: 'observe' },
        ],
        expectedResult: 'Formação de cristais amarelos brilhantes de PbI2.',
        explanation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃. O iodeto de chumbo é pouco solúvel em água fria mas solúvel em água quente, cristalizando ao esfriar.',
    },
    {
        id: 'breathalyzer',
        title: 'Teste do Bafômetro',
        category: 'química',
        difficulty: 'médio',
        duration: '5 min',
        description: 'Simule o teste do bafômetro com dicromato de potássio.',
        objective: 'Entender reações de oxidação-redução.',
        icon: '🍺',
        materials: ['Dicromato de Potássio K2Cr2O7', 'Etanol C2H5OH', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione K2Cr2O7 a um béquer (solução laranja)', action: 'add-reagent', target: 'K2Cr2O7' },
            { id: 2, instruction: 'Adicione Etanol a outro béquer', action: 'add-reagent', target: 'C2H5OH' },
            { id: 3, instruction: 'Misture o etanol no dicromato', action: 'mix' },
            { id: 4, instruction: 'Observe a mudança de cor laranja → verde!', action: 'observe' },
        ],
        expectedResult: 'Solução muda de laranja para verde.',
        explanation: 'O dicromato (Cr⁶⁺, laranja) é reduzido a cromo III (Cr³⁺, verde) enquanto oxida o etanol. Este é o princípio dos antigos bafômetros químicos.',
    },
    {
        id: 'displacement-copper',
        title: 'Deslocamento de Cobre',
        category: 'química',
        difficulty: 'fácil',
        duration: '5 min',
        description: 'Zinco desloca cobre da solução de sulfato de cobre.',
        objective: 'Entender a série de reatividade dos metais.',
        icon: '🔩',
        materials: ['Sulfato de Cobre CuSO4', 'Zinco Zn', '1 Béquer'],
        steps: [
            { id: 1, instruction: 'Adicione CuSO4 a um béquer (solução azul)', action: 'add-reagent', target: 'CuSO4' },
            { id: 2, instruction: 'Adicione Zinco ao béquer', action: 'add-element', target: 'Zn' },
            { id: 3, instruction: 'Observe a deposição de cobre metálico!', action: 'observe' },
        ],
        expectedResult: 'Cobre metálico se deposita enquanto a solução perde cor.',
        explanation: 'Zn + CuSO₄ → ZnSO₄ + Cu. O zinco é mais reativo que o cobre e o desloca da solução, depositando cobre metálico avermelhado.',
    },
    {
        id: 'peroxide-decomposition',
        title: 'Decomposição Catalítica',
        category: 'química',
        difficulty: 'fácil',
        duration: '3 min',
        description: 'Decomposição rápida do peróxido de hidrogênio.',
        objective: 'Entender o papel dos catalisadores em reações químicas.',
        icon: '💨',
        materials: ['Peróxido de Hidrogênio H2O2', 'Dióxido de Manganês MnO2', '1 Béquer'],
        steps: [
            { id: 1, instruction: 'Adicione H2O2 a um béquer', action: 'add-reagent', target: 'H2O2' },
            { id: 2, instruction: 'Adicione MnO2 ao béquer', action: 'add-reagent', target: 'MnO2' },
            { id: 3, instruction: 'Observe a liberação vigorosa de oxigênio!', action: 'observe' },
        ],
        expectedResult: 'Efervescência intensa com liberação de oxigênio.',
        explanation: '2H₂O₂ → 2H₂O + O₂↑. O MnO₂ atua como catalisador, acelerando a decomposição do peróxido sem ser consumido na reação.',
    },
    {
        id: 'blood-red',
        title: 'Vermelho Sangue',
        category: 'química',
        difficulty: 'médio',
        duration: '3 min',
        description: 'Formação do complexo tiocianato de ferro III.',
        objective: 'Aprender sobre reações de complexação.',
        icon: '🩸',
        materials: ['Cloreto de Ferro III FeCl3', 'Tiocianato de Potássio KSCN', '2 Béqueres'],
        steps: [
            { id: 1, instruction: 'Adicione FeCl3 a um béquer (solução amarela)', action: 'add-reagent', target: 'FeCl3' },
            { id: 2, instruction: 'Adicione KSCN a outro béquer', action: 'add-reagent', target: 'KSCN' },
            { id: 3, instruction: 'Misture as soluções', action: 'mix' },
            { id: 4, instruction: 'Observe a formação da cor vermelho-sangue!', action: 'observe' },
        ],
        expectedResult: 'Formação instantânea de cor vermelho intenso.',
        explanation: 'Fe³⁺ + 3SCN⁻ → Fe(SCN)₃. O tiocianato de ferro III forma um complexo de cor vermelha intensa, usado como teste qualitativo para íons Fe³⁺.',
    },
    {
        id: 'uranium-enrichment',
        title: 'Enriquecimento de Urânio',
        category: 'física',
        difficulty: 'difícil',
        duration: '10 min',
        description: 'Simulação teórica do processo de enriquecimento e extração de U-235.',
        objective: 'Compreender purificação isotópica abstrata.',
        icon: '☢️',
        materials: ['Hexafluoreto de Urânio (UF6)', 'Gás Hidrogênio (H2)'],
        steps: [
            { id: 1, instruction: 'Adicione Hexafluoreto de Urânio (UF6) a um béquer vazio', action: 'add-reagent', target: 'UF6' },
            { id: 2, instruction: 'Adicione Gás Hidrogênio (H2) a outro béquer', action: 'add-reagent', target: 'H2' },
            { id: 3, instruction: 'Misture o Gás Hidrogênio no recipiente de UF6 para iniciar a reação termodinâmica', action: 'mix' },
            { id: 4, instruction: 'Observe o brilho verde intenso resultante da purificação!', action: 'observe' },
        ],
        expectedResult: 'Formação de uma massa sólida brilhante de Urânio-235 puro.',
        explanation: 'O UF6 (gás) reage termodinamicamente numa aproximação reduzida para separar os fluoretos do metal puro. Na vida real, o enriquecimento usa centrífugas ultrarrápidas, não reagentes diretos.',
    },
    {
        id: 'kryptonite-synthesis',
        title: 'Síntese de Kriptonita',
        category: 'química',
        difficulty: 'médio',
        duration: '5 min',
        description: 'Reação sci-fi extra-terrestre usando materiais da Terra.',
        objective: 'Descobrir o segredo para enfraquecer o Superman.',
        icon: '💎',
        materials: ['Carbonato de Cálcio (CaCO3)', 'Sulfato de Cobre (CuSO4)'],
        steps: [
            { id: 1, instruction: 'Adicione Calcário (CaCO3) a um béquer', action: 'add-reagent', target: 'CaCO3' },
            { id: 2, instruction: 'Adicione Sulfato de Cobre azul (CuSO4) a outro béquer', action: 'add-reagent', target: 'CuSO4' },
            { id: 3, instruction: 'Despeje o Sulfato de Cobre por cima do Calcário', action: 'mix' },
            { id: 4, instruction: 'Observe a fusão mineral que gera um cristal radioativo alienígena!', action: 'observe' },
        ],
        expectedResult: 'Formação de um sal verde brilhante e altamente radioativo.',
        explanation: 'Esta é uma reação inteiramente FICCIONAL. Calcário e sulfato de cobre gerariam sulfato de cálcio, mas sob as condições mágicas deste laboratório eles fundem sua essência no famoso mineral da cultura pop.',
    },
]

export function getExperimentById(id: string): Experiment | undefined {
    return EXPERIMENTS.find(e => e.id === id)
}

export function getExperimentsByCategory(category: string): Experiment[] {
    return EXPERIMENTS.filter(e => e.category === category)
}

export function getExperimentsByDifficulty(difficulty: string): Experiment[] {
    return EXPERIMENTS.filter(e => e.difficulty === difficulty)
}

