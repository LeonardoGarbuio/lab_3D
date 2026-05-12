# 🗺️ Plano de Refatoração MASTER: Laboratório 100% Procedural

## Fase 1: Arquitetura de Alta Performance (A Separação Cérebro/Músculo)
*Objetivo: Garantir que o laboratório corre a 60 FPS em qualquer computador escolar, isolando os cálculos matemáticos pesados da renderização gráfica 3D.*
- [x] **Criar o Cérebro (Web Worker):** Criar o ficheiro `src/workers/physics.worker.ts`. O objetivo do Worker é usar um núcleo de processamento separado, exclusivo para a física, libertando a *Main Thread* para desenhar os gráficos (React Three Fiber) sem interrupções.
- [x] **Estabelecer a Comunicação:** Implementar o sistema de troca de mensagens (`postMessage` e `onmessage`). O React envia as ações do utilizador (ex: "Aumentou o bico de Bunsen"), o Worker faz milhões de cálculos em background, e devolve apenas as coordenadas prontas para o ecrã.
- [x] **Refatorar o Motor de Fluidos:** Mover a lógica do `FluidEngine.ts` para dentro do Worker.
- [x] **Implementar Spatial Hashing (Fim do O(N²)):** Dividir o espaço do béquer numa grelha 3D. Em vez de uma partícula calcular a distância para as outras 999 no ecrã, ela só calcula as forças de atração/repulsão com os vizinhos do mesmo quadrado, permitindo simular milhares de átomos simultaneamente.
- [x] Criar a classe central `MolecularCalculator` no Worker, que conterá as regras base da química (Tabela Periódica, Eletronegatividade, Eletrões de Valência, Massa Molar).
- [x] Criar o sistema de "Estado Global do Recipiente" (Volume, Temperatura, Pressão e Quantidade de Matéria/Mols), que ditará as leis termodinâmicas no Worker.

## Fase 2: Motor Estequiométrico Termodinâmico (`ChemistryEngine.ts` e `ReactionSystem.ts`)
*Objetivo: Parar de procurar reações em JSON e passar a calcular a viabilidade física delas em tempo real no Worker.*
- [x] Implementar cálculo de Entalpia ($\Delta H$) e Energia Livre de Gibbs ($\Delta G$). O sistema só formará produtos se $\Delta G < 0$ ou se a Temperatura suprir a Energia de Ativação.
- [x] Implementar a Regra do Octeto e balanceamento automático de equações na colisão: quando os átomos colidem no 3D, o algoritmo tenta estabilizá-los criando ligações covalentes ou iónicas (Via `VSEPRCalculator` e `ReactionEvaluator`).
- [x] Interligar as reações à renderização: se o cálculo VSEPR dinâmico do Worker der certo, o `MoleculeViewer.tsx` desenha a nova estrutura molecular instantaneamente.

## Fase 3: Físico-Química e Estados da Matéria (`GasPhysics.ts` e `CrystallizationSystem.ts`)
*Objetivo: Leis dos gases e solubilidade geradas de forma dinâmica.*
- [x] **Gases:** Refatorar `GasPhysics.ts` para usar a Equação de Van der Waals. A pressão do balão ou recipiente fechado sobe automaticamente com base na temperatura e no número de mols ($PV=nRT$) gerados pela reação processada no Worker.
- [x] **Cristalização:** Remover eventos estáticos. Implementar curvas de Produto de Solubilidade ($K_{ps}$). Se o utilizador adicionar muito soluto ou a temperatura cair além do limite, o `CrystallizationSystem.ts` força os iões a unirem-se.

## Fase 4: Eletroquímica e Separação de Misturas (`ElectrolysisSystem.ts` e `DistillationSystem.ts`)
*Objetivo: Equipamentos a reagir a cálculos físicos puros e não a guiões.*
- [x] **Destilação:** O `DistillationSystem.ts` lerá os Pontos de Ebulição e aplicará a Lei de Raoult. A substância com menor ponto de ebulição evapora primeiro e condensa consoante o calor aplicado.
- [x] **Eletrólise:** O `ElectrolysisCell.tsx` usará a Equação de Nernst e os Potenciais Padrão de Redução ($E^0$). O Worker decide que ião reduz no cátodo e qual oxida no ânodo, gerando resultados (ex: gás H2) dinamicamente.

## Fase 5: Análise Instrumental Dinâmica (`TitrationSystem.ts` e `SpectroscopySystem.ts`)
*Objetivo: Gráficos e cores gerados por equações matemáticas reais.*
- [x] **Titulação:** O `TitrationSystem.ts` usará as constantes de dissociação ($pK_a$ e $pK_b$). A cada gota, o Worker resolve a equação de Henderson-Hasselbalch, atualizando o pH e a cor do indicador.
- [x] **Espectroscopia:** O `Spectrometer.tsx` aplicará a Lei de Beer-Lambert ($A = \epsilon \cdot b \cdot c$). A absorbância no ecrã dependerá estritamente da concentração calculada no momento.

## Fase 6: Motor de Química Orgânica (`OrganicReactionsSystem.ts`)
*Objetivo: Lidar com a complexidade estrutural do carbono proceduralmente.*
- [x] Criar um motor de grafos (nós e arestas) para mapear moléculas orgânicas dentro do Worker.
- [x] Implementar regras de reconhecimento de Grupos Funcionais (álcoois, cetonas, ácidos carboxílicos).
- [x] Criar reações baseadas em afinidade funcional em vez de fórmulas fixas (Ex: detetou álcool + ácido + calor $\rightarrow$ gera éster + água).

## Fase 7: Segurança Baseada na Termodinâmica (`SafetySystem.ts` e `HazardEffects.ts`)
*Objetivo: Acidentes de laboratório causados pelas leis da física e não por "listas negras".*
- [x] O `SafetySystem.ts` passará a monitorizar variáveis reais de Pressão e Entalpia emitidas pelo Worker.
- [x] **Explosões:** Uma reação exotérmica violenta aumenta bruscamente a pressão ($PV=nRT$). Se o frasco estiver selado, a pressão calculada rompe a resistência do vidro, acionando o `ExplosionEffect.tsx`.
- [x] **Fogo:** Moléculas de carbono em contacto com fontes de ignição e oxigénio suficiente no ambiente iniciarão o algoritmo de combustão procedural.



🧪 Como testar a Fase 5 (Análise Instrumental Dinâmica)
Titulação: Pega numa Bureta e enche-a com um titulante (ex: Base/NaOH). Pega num Erlenmeyer, coloca o analito (ex: Ácido/HCl) e não te esqueças de adicionar um Indicador (ex: Fenolftaleína). Abre a torneira da bureta e deixa cair as gotas. Vais ver o pH a ser calculado em tempo real (equação de Henderson-Hasselbalch) e a cor a mudar perfeitamente no ponto de viragem!
Espectroscopia: Usa o Espectrómetro (ou o Microscópio Quântico com análise de luz). Coloca lá uma amostra. O gráfico gerado no ecrã obedece agora estritamente à Lei de Beer-Lambert ($A = \epsilon \cdot b \cdot c$), ou seja, se diluíres a amostra (adicionando mais água), a altura do gráfico de absorbância vai descer dinamicamente.
🧬 Como testar a Fase 6 (Química Orgânica por Grafos SMILES)
Esterificação Mágica: Pega num béquer. Junta-lhe Etanol (álcool) e Ácido Acético (ácido carboxílico). Junta também um pouco de Ácido Sulfúrico (serve de catalisador).
Liga o Bico de Bunsen e aquece a mistura a mais de 60°C.
A magia do Grafo: Em vez de procurar nomes estáticos, o motor em background vai desenhar o grafo CCO e CC(=O)O, detetar os grupos Álcool e Ácido, e automaticamente desencadear a reação de Esterificação de Fischer, formando Acetato de Etila e libertando o efeito visual de "Cheiro/Aroma"!
💥 Como testar a Fase 7 (Segurança Termodinâmica)
Explosão por Pressão ($PV=nRT$): Coloca uma mistura que gere gases (ex: bicarbonato + vinagre) dentro de um recipiente. Se houver (ou quando adicionares) um botão/opção para Selar (fechar a tampa), tampa-o! À medida que o gás é gerado (ou se aqueceres o frasco selado no Bunsen), a pressão matemática vai começar a subir exponencialmente até ultrapassar a burst pressure do vidro. O frasco vai estourar num acidente processado na hora pela física mecânica!
Fogo Procedural (Combustão): Pega em Etanol puro num frasco. Coloca-o no Bico de Bunsen e aquece-o de forma bruta (acima dos 300°C-400°C). Como ele é uma estrutura de carbono e tem oxigénio na sala, o sistema vai acionar o evaluateCombustionRisk e a substância vai entrar em ignição expontânea, pegando fogo com labaredas azuis (cor típica da queima de álcool)!

arrumar