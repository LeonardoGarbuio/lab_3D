// src/components/ui/LabHUD.tsx
// Interface COMPLETA do laboratório com TODAS as funcionalidades
import { useLabStore } from '../../stores/useLabStore'
import { COMMON_SUBSTANCES } from '../../systems/ChemistryEngine'
import { getPhaseAtTemperature, getPhaseNamePt, getPhaseColor } from '../../data/elements'
import PeriodicTable from './PeriodicTable'
import ReagentPanel from './ReagentPanel'
import ExperimentPanel from './ExperimentPanel'
import ExperimentGuide from './ExperimentGuide'
import Notebook from './Notebook'
import QuantumMicroscope from './QuantumMicroscope'
import AtomicModels from './AtomicModels'
import ElectronConfig from './ElectronConfig'
import PeriodicProperties from './PeriodicProperties'
import NuclearPhysics from './NuclearPhysics'
import IntermolecularSimulator from './IntermolecularSimulator'
import SolidStateSimulator from './SolidStateSimulator'
import { useSoundEffects } from '../../hooks/useSoundEffects'
import ElectrolysisPanel from './ElectrolysisPanel'
import DistillationPanel from './DistillationPanel'
import SpectrometerPanel from './SpectrometerPanel'
import CrystallizerPanel from './CrystallizerPanel'
import OrganicPanel from './OrganicPanel'
import './LabHUD.css'

export default function LabHUD() {
    const store = useLabStore()
    const { playSound } = useSoundEffects()

    const {
        selectedId, pouringFromId, lastReaction, analysisTarget, objects, reactionLog,
        currentExperiment, completedExperiments, experimentScore, isSoundEnabled, isFPSLocked,
        cancelPouring, resetLab, startAnalysis, stopAnalysis, breakObject,
        openPeriodicTable, openReagentPanel, openExperimentPanel, openNotebook,
        startHeating, stopHeating, startFreezing, shakeObject, coolDown, emptyObject,
        completeExperiment, quitExperiment, toggleSound,
    } = store

    const selectedObject = objects.find(o => o.id === selectedId)

    const getSubstanceInfo = () => {
        if (!selectedObject?.formula) return null
        if (selectedObject.element) return { name: selectedObject.element.namePt, formula: selectedObject.element.symbol, molarMass: selectedObject.element.atomicMass }
        const known = COMMON_SUBSTANCES[selectedObject.formula]
        if (known) return { name: known.name, formula: known.formula, molarMass: known.molarMass, ph: known.ph }
        return { name: selectedObject.customName || selectedObject.formula, formula: selectedObject.formula, molarMass: null }
    }

    const substance = getSubstanceInfo()
    const analysisObject = objects.find(o => o.id === analysisTarget)
    const analysisElement = analysisObject?.element

    const handleBreak = () => {
        if (selectedId) {
            if (isSoundEnabled) playSound('break')
            breakObject(selectedId)
        }
    }

    return (
        <>
            <div className="lab-hud">
                {/* HEADER */}
                <div className="hud-panel hud-title">
                    <h1>🧪 Lab Virtual</h1>
                    <div className="score-bar">
                        <span>🏆 {experimentScore} pts</span>
                        <span>✅ {completedExperiments.length} experimentos</span>
                    </div>
                </div>

                {/* CONTROLES GERAIS */}
                <div className="hud-panel hud-menu">
                    <div className="controls-row">
                        <button className={`icon-btn ${isSoundEnabled ? 'active' : ''}`} onClick={toggleSound} title="Som">
                            {isSoundEnabled ? '🔊' : '🔇'}
                        </button>
                        <button className="icon-btn" onClick={resetLab} title="Reiniciar">🔄</button>
                    </div>
                </div>

                {/* OBJETO SELECIONADO */}
                {selectedObject && (
                    <div className="hud-panel hud-selected">
                        <h3>
                            Béquer {selectedObject.id.split('-')[1]}
                            {selectedObject.isHeating && <span className="temp-badge">🔥 {selectedObject.temperature}°C</span>}
                        </h3>

                        {selectedObject.isBroken ? (
                            <p className="broken-msg">💔 Quebrado</p>
                        ) : (
                            <div className="selected-info">
                                {substance ? (
                                    <>
                                        <div className="substance-row">
                                            <div className="substance-preview" style={{ backgroundColor: selectedObject.color }} />
                                            <div>
                                                <span className="substance-name">{substance.name}</span>
                                                <span className="substance-formula">{substance.formula}</span>
                                            </div>
                                        </div>
                                        <div className="mols-info">
                                            <span>⚛️ {selectedObject.mols.toFixed(2)} mol</span>
                                            {substance.molarMass && <span>📏 {(selectedObject.mols * substance.molarMass).toFixed(1)} g</span>}
                                            <span>🌡️ {selectedObject.temperature}°C</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-container">
                                        <span className="empty-label">🫙 Vazio</span>
                                        <p className="empty-hint">Use o menu para adicionar</p>
                                    </div>
                                )}

                                <div className="fill-bar">
                                    <div className="fill-level" style={{ width: `${selectedObject.fillLevel * 100}%`, backgroundColor: selectedObject.color }} />
                                </div>

                                <div className="object-actions">
                                    {substance && (
                                        <>
                                            <button onClick={() => startAnalysis(selectedId!)} title="Analisar">🔬</button>
                                            <button onClick={() => { if (isSoundEnabled) playSound('heat'); selectedObject.isHeating ? stopHeating(selectedId!) : startHeating(selectedId!) }} className={selectedObject.isHeating ? 'active hot' : ''} title="Aquecer">🔥</button>
                                            <button onClick={() => startFreezing(selectedId!)} className={selectedObject.temperature < 25 ? 'active cold' : ''} title="Congelar">🧊</button>
                                            <button onClick={() => { if (isSoundEnabled) playSound('bubbles'); shakeObject(selectedId!) }} title="Agitar">🌀</button>
                                            <button onClick={() => coolDown(selectedId!)} title="Temp. Ambiente (25°C)">🌡️</button>
                                            <button onClick={() => emptyObject(selectedId!)} title="Esvaziar">🗑️</button>
                                        </>
                                    )}
                                    <button onClick={handleBreak} className="danger" title="Quebrar">💥</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* POURING */}
                {pouringFromId && (
                    <div className="hud-panel hud-pouring">
                        <h3>🫗 Despejar</h3>
                        <p>Clique em outro béquer</p>
                        <button onClick={cancelPouring}>Cancelar</button>
                    </div>
                )}

                {/* FEEDBACK */}
                {lastReaction && (
                    <div className="hud-panel hud-reaction">
                        <p>{lastReaction}</p>
                    </div>
                )}

                {/* ANÁLISE */}
                {analysisObject && (
                    <div className="hud-panel hud-analysis">
                        <h3>🔬 Análise</h3>
                        <button className="close-btn" onClick={stopAnalysis}>✕</button>
                        <div className="analysis-content">
                            <div className="analysis-header">
                                <div className="substance-color" style={{ backgroundColor: analysisObject.color }} />
                                <div><h4>{analysisObject.customName || analysisObject.formula}</h4></div>
                            </div>
                            <table className="analysis-table"><tbody>
                                {/* Informações do elemento puro */}
                                {analysisElement && (() => {
                                    const currentPhase = getPhaseAtTemperature(
                                        analysisElement.meltingPoint,
                                        analysisElement.boilingPoint,
                                        analysisObject.temperature
                                    )
                                    const phaseChanged = currentPhase !== analysisElement.phase
                                    return (
                                        <>
                                            <tr><td>Nº Atômico</td><td>{analysisElement.atomicNumber}</td></tr>
                                            <tr><td>Massa Atômica</td><td>{analysisElement.atomicMass.toFixed(3)} u</td></tr>
                                            <tr><td>Categoria</td><td>{analysisElement.category}</td></tr>
                                            {analysisElement.electronegativity && <tr><td>Eletronegatividade</td><td>{analysisElement.electronegativity}</td></tr>}
                                            {analysisElement.meltingPoint !== null && <tr className={analysisObject.temperature >= analysisElement.meltingPoint ? 'reached' : ''}><td>🧊 P. Fusão</td><td>{analysisElement.meltingPoint}°C</td></tr>}
                                            {analysisElement.boilingPoint !== null && <tr className={analysisObject.temperature >= analysisElement.boilingPoint ? 'reached' : ''}><td>💨 P. Ebulição</td><td>{analysisElement.boilingPoint}°C</td></tr>}
                                            <tr className="phase-row">
                                                <td>Estado Atual</td>
                                                <td style={{ color: getPhaseColor(currentPhase), fontWeight: 'bold' }}>
                                                    {getPhaseNamePt(currentPhase)}
                                                    {phaseChanged && <span className="phase-changed"> (mudou!)</span>}
                                                </td>
                                            </tr>
                                            <tr><td>Estado Original</td><td style={{ opacity: 0.6 }}>{getPhaseNamePt(analysisElement.phase)} (25°C)</td></tr>
                                        </>
                                    )
                                })()}
                                {/* Informações de substâncias compostas */}
                                {!analysisElement && analysisObject.formula && (() => {
                                    const sub = COMMON_SUBSTANCES[analysisObject.formula]
                                    if (sub) {
                                        return (
                                            <>
                                                <tr><td>Fórmula</td><td className="formula-cell">{sub.formula}</td></tr>
                                                <tr><td>Massa Molar</td><td>{sub.molarMass.toFixed(2)} g/mol</td></tr>
                                                <tr><td>Categoria</td><td>{sub.category}</td></tr>
                                                {sub.ph !== undefined && <tr><td>pH</td><td className={sub.ph < 7 ? 'acid' : sub.ph > 7 ? 'base' : 'neutral'}>{sub.ph.toFixed(1)} ({sub.ph < 7 ? 'Ácido' : sub.ph > 7 ? 'Básico' : 'Neutro'})</td></tr>}
                                                {sub.density && <tr><td>Densidade</td><td>{sub.density} g/mL</td></tr>}
                                                <tr><td>Fase</td><td>{sub.phase === 'solid' ? 'Sólido' : sub.phase === 'liquid' ? 'Líquido' : sub.phase === 'gas' ? 'Gás' : 'Aquoso'}</td></tr>
                                            </>
                                        )
                                    }
                                    return null
                                })()}
                                {/* Informações gerais sempre visíveis */}
                                <tr><td>Quantidade</td><td>{analysisObject.mols.toFixed(3)} mol</td></tr>
                                {substance?.molarMass && <tr><td>Massa Total</td><td>{(analysisObject.mols * substance.molarMass).toFixed(2)} g</td></tr>}
                                <tr><td>Nível</td><td>{(analysisObject.fillLevel * 100).toFixed(0)}%</td></tr>
                                <tr><td>Temperatura</td><td className={analysisObject.temperature > 50 ? 'hot' : ''}>{analysisObject.temperature}°C</td></tr>
                            </tbody></table>
                        </div>
                    </div>
                )}

                {/* LOG */}
                {reactionLog.length > 0 && (
                    <div className="hud-panel hud-log">
                        <h3>📜 Reações</h3>
                        <div className="log-entries">
                            {reactionLog.slice(-3).reverse().map(log => (
                                <div key={log.id} className="log-entry"><span className="log-equation">{log.equation}</span></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* INSTRUÇÕES */}
                <div className="hud-panel hud-instructions mini">
                    <p>🖱️ Clique = Selecionar | 🔄 Duplo clique = Despejar</p>
                </div>
            </div>

            {/* GUIA DE EXPERIMENTO ATIVO */}
            {currentExperiment && (
                <ExperimentGuide
                    experiment={currentExperiment}
                    onComplete={completeExperiment}
                    onQuit={quitExperiment}
                />
            )}
            {/* OVERLAY DE FPS E MIRA */}
            {!isFPSLocked && !store.isPeriodicTableOpen && !store.isReagentPanelOpen && !store.isExperimentPanelOpen && !store.isNotebookOpen && !store.isQuantumMicroscopeOpen && !store.isAtomicModelsOpen && !store.isElectronConfigOpen && !store.isPeriodicPropertiesOpen && !store.isNuclearPhysicsOpen && !store.isIntermolecularOpen && !store.isSolidStateOpen && !store.isElectrolysisPanelOpen && !store.isDistillationPanelOpen && !store.isSpectrometerPanelOpen && !store.isCrystallizerPanelOpen && !store.isOrganicPanelOpen && (
                <div className="fps-overlay" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, pointerEvents: 'none'
                }}>
                    <h2 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Clique na tela para jogar</h2>
                    <p style={{ color: '#aaa' }}>Use W A S D para andar. Esc para liberar o mouse.</p>
                </div>
            )}
            
            {isFPSLocked && (
                <div className="crosshair" style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 10, pointerEvents: 'none'
                }}></div>
            )}

            {/* MODAIS */}
            <PeriodicTable />
            <ReagentPanel isOpen={store.isReagentPanelOpen} onClose={store.closeReagentPanel} />
            <ExperimentPanel isOpen={store.isExperimentPanelOpen} onClose={store.closeExperimentPanel} onStartExperiment={store.startExperiment} />
            <Notebook isOpen={store.isNotebookOpen} onClose={store.closeNotebook} />
            <QuantumMicroscope isOpen={store.isQuantumMicroscopeOpen} onClose={store.closeQuantumMicroscope} initialFormula={store.activeQuantumFormula || 'H2O'} />
            <AtomicModels isOpen={store.isAtomicModelsOpen} onClose={store.closeAtomicModels} />
            <ElectronConfig isOpen={store.isElectronConfigOpen} onClose={store.closeElectronConfig} />
            <PeriodicProperties isOpen={store.isPeriodicPropertiesOpen} onClose={store.closePeriodicProperties} />
            <NuclearPhysics isOpen={store.isNuclearPhysicsOpen} onClose={store.closeNuclearPhysics} />
            <IntermolecularSimulator isOpen={store.isIntermolecularOpen} onClose={store.closeIntermolecular} />
            <SolidStateSimulator isOpen={store.isSolidStateOpen} onClose={store.closeSolidState} />
            <ElectrolysisPanel />
            <DistillationPanel />
            <SpectrometerPanel />
            <CrystallizerPanel />
            <OrganicPanel />
        </>
    )
}
