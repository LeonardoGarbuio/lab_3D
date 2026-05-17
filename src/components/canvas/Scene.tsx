// src/components/canvas/Scene.tsx
// Laboratório Virtual 3D - Cena Principal
import { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { FPSControls } from './FPSControls'

// Ambiente
import LabRoom from './environment/LabRoom'
import LabBench from './environment/LabBench'

// Vidrarias interativas
import InteractiveBeaker from './glassware/InteractiveBeaker'
import TestTubeRack from './glassware/TestTubeRack'
import { BunsenBurner } from './glassware/BunsenBurner'

// EQUIPAMENTOS INTERATIVOS
import InteractiveTripod from './equipment/InteractiveTripod'
import InteractiveGraduatedCylinder from './glassware/InteractiveGraduatedCylinder'
import InteractiveBurette from './glassware/InteractiveBurette'
import InteractivePipette from './glassware/InteractivePipette'
import InteractiveErlenmeyer from './glassware/InteractiveErlenmeyer'
import InteractiveRoundBottomFlask from './glassware/InteractiveRoundBottomFlask'
import SeparatingFunnel from './glassware/SeparatingFunnel'
import InteractiveFumeHood from './equipment/InteractiveFumeHood'

// SISTEMAS AVANÇADOS
import { CrystallizationDish } from '../equipment/CrystallizationDish'
import { ElectrolysisCell } from '../equipment/ElectrolysisCell'
import { DistillationApparatus } from '../equipment/DistillationApparatus'
import { GasBalloon } from '../effects/GasBalloon'
import { Spectrometer } from '../equipment/Spectrometer'
import { Manometer } from '../equipment/Manometer'
import { Thermometer } from '../equipment/Thermometer'
import { OrganicReactionVessel } from '../equipment/OrganicReactionVessel'

// EQUIPAMENTOS DIELÉTICOS (Menu 3D)
import { 
  DeviceMicroscope, DeviceNotebook, DeviceReagentCabinet, DeviceExperimentClipboard,
  DeviceComputerTerminal, DeviceProjector, DeviceSolidState, DeviceSPHTank,
  DeviceNuclearReactor, DevicePeriodicTablePoster, DevicePropertiesPoster
} from './equipment/InteractiveDevices'

// Estado
import { useLabStore } from '../../stores/useLabStore'

// UI
import LabHUD from '../ui/LabHUD'


// ═══════════════════════════════════════════════════════════════════════
// WEBGL CHECK
// ═══════════════════════════════════════════════════════════════════════
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DEBUGGER (Técnica AAA: Telemetria de Performance)
// ═══════════════════════════════════════════════════════════════════════
function PerfDebugger() {
  const frameCount = useRef(0)
  const lastLog = useRef(performance.now())
  const mouseMoves = useRef(0)

  useEffect(() => {
    const handleMouseMove = () => mouseMoves.current++
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((_, delta) => {
    frameCount.current++
    const now = performance.now()
    if (now - lastLog.current >= 2000) {
      const fps = Math.round(frameCount.current / ((now - lastLog.current) / 1000))
      const moves = mouseMoves.current
      
      // @ts-ignore
      const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A'
      console.log(`[PERF] FPS: ${fps} | MouseMoves/s: ${Math.round(moves / ((now - lastLog.current) / 1000))} | Heap: ${mem}MB | Delta: ${delta.toFixed(4)}`)
      
      frameCount.current = 0
      mouseMoves.current = 0
      lastLog.current = now
    }
  })
  return null
}

// ═══════════════════════════════════════════════════════════════════════
// LAB OBJECTS
// ═══════════════════════════════════════════════════════════════════════
function LabObjects() {
  const objects = useLabStore((state) => state.objects)

  return (
    <>
      {objects.map((obj) => {
        if (obj.type === 'beaker') {
          return (
            <InteractiveBeaker
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              isBroken={obj.isBroken}
              isHeating={obj.isHeating}
              isShaking={obj.isShaking}
              temperature={obj.temperature}
              activeEffect={obj.activeEffect}
              effectColor={obj.effectColor}
              effectIntensity={obj.effectIntensity}
              scale={0.4}
            />
          )
        }
        if ((obj.type as string) === 'erlenmeyer') {
          return (
            <InteractiveErlenmeyer
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              ph={obj.ph || 7}
              scale={0.6}
            />
          )
        }
        if ((obj.type as string) === 'pipette') {
          return (
            <InteractivePipette
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              ph={obj.ph || 7}
              volume={10}
              scale={0.8}
            />
          )
        }
        if ((obj.type as string) === 'roundflask') {
          return (
            <InteractiveRoundBottomFlask
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              ph={obj.ph || 7}
              scale={0.7}
            />
          )
        }
        return null
      })}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// SCENE CONTENT
// ═══════════════════════════════════════════════════════════════════════
function LabScene() {
  const selectObject = useLabStore((state) => state.selectObject)
  const cancelPouring = useLabStore((state) => state.cancelPouring)

  // Electrolysis from global store
  const electrolysisRunning = useLabStore((state) => state.electrolysisRunning)
  const electrolysisVoltage = useLabStore((state) => state.electrolysisVoltage)
  const electrolysisElectrolyteId = useLabStore((state) => state.electrolysisElectrolyteId)
  const openElectrolysisPanel = useLabStore((state) => state.openElectrolysisPanel)

  // Distillation from global store
  const distillationHeating = useLabStore((state) => state.distillationHeating)
  const distillationMixtureId = useLabStore((state) => state.distillationMixtureId)
  const openDistillationPanel = useLabStore((state) => state.openDistillationPanel)

  // Crystallizer from global store
  const crystallizerSubstanceId = useLabStore((state) => state.crystallizerSubstanceId)
  const crystallizerIsHeating = useLabStore((state) => state.crystallizerIsHeating)
  const crystallizerIsCooling = useLabStore((state) => state.crystallizerIsCooling)

  // Organic from global store
  const organicReactionId = useLabStore((state) => state.organicReactionId)
  const organicIsActive = useLabStore((state) => state.organicIsActive)
  const organicTemperature = useLabStore((state) => state.organicTemperature)
  const organicStirring = useLabStore((state) => state.organicStirring)

  const handleBackgroundClick = () => {
    selectObject(null)
    cancelPouring()
  }

  return (
    <>
      {/* ILUMINAÇÃO — otimizada */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
      />
      <hemisphereLight intensity={0.5} groundColor="#1a1a2e" />

      {/* AMBIENTE */}
      <LabRoom>
        {/* Click no fundo — raycast ativado apenas neste mesh */}
        <mesh
          position={[0, 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleBackgroundClick}
          visible={false}
        >
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* BANCADAS */}
        {/* Bancada Central - Para utensílios gerais, pipetas, provetas e operações interativas com LabObjects */}
        <LabBench position={[0, 0, 0]} />
        
        {/* Bancada Esquerda - Área de Síntese Orgânica e Equipamentos Analíticos com Gases */}
        <LabBench position={[-11, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

        {/* Bancada Direita */}
        <LabBench position={[11, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

        {/* Bancada Frontal (mais espaço para vidraria) */}
        <LabBench position={[0, 0, 4]} />

        {/* OBJETOS INTERATIVOS DA CENA PADRÃO (renderizados na bancada central) */}
        <LabObjects />

        {/* ═══════════════════════════════════════════ */}
        {/* BANCADA CENTRAL (Química Úmida) */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tubos de ensaio (decorativos) */}
        <TestTubeRack
          position={[2.5, 1.02, -0.3]}
          tubes={[
            { color: '#ff6b6b', level: 0.8 },
            { color: '#4ecdc4', level: 0.6 },
            { color: '#ffe66d', level: 0.9 },
            { color: '#ff69b4', level: 0.4 },
            { color: '#87CEEB', level: 0.7 },
          ]}
        />

        {/* Bico de Bunsen e Tripe */}
        <BunsenBurner position={[-1.8, 1.02, -0.2]} isLit={false} />
        <InteractiveTripod
          id="tripod-1"
          position={[-1.8, 1.02, -0.2]}
          scale={1.0}
          isHeating={false}
        />

        {/* Proveta graduada */}
        <InteractiveGraduatedCylinder
          id="graduated-cylinder-1"
          position={[1.8, 1.45, -0.3]}
          formula={null}
          fillLevel={0}
          color="#4ecdc4"
          temperature={25}
          ph={7}
          volume={0}
          maxVolume={100}
          scale={0.7}
        />

        {/* Bureta FUNCIONAL — sobre o erlenmeyer */}
        <InteractiveBurette
          id="burette-1"
          position={[-0.2, 1.75, -0.2]}
          targetId="erlenmeyer-1"
          maxVolume={50}
          scale={0.7}
        />

        {/* Funil de separacao */}
        <SeparatingFunnel
          position={[1.2, 1.45, -0.3]}
          scale={0.5}
          upperLiquidColor="#ffe066"
          lowerLiquidColor="#4ecdc4"
          upperLevel={0}
          lowerLevel={0}
        />

        {/* Termometro */}
        <Thermometer
          position={[-1.2, 1.3, -0.3]}
          size={0.4}
          temperature={25}
          minTemp={-10}
          maxTemp={110}
        />

        {/* Manometro */}
        <Manometer
          position={[0.5, 1.35, -0.3]}
          size={0.4}
          pressure={1.0}
          maxPressure={5}
          unit="atm"
        />

        {/* Prancheta e Caderno */}
        <DeviceExperimentClipboard position={[-2.5, 1.02, 0.5]} scale={0.7} />
        <DeviceNotebook position={[3.0, 1.02, 0.5]} rotation={[0, -0.2, 0]} scale={0.8} />

        {/* PAREDES (Posters) */}
        <DevicePeriodicTablePoster position={[0, 3.5, -8.9]} />
        <DevicePropertiesPoster position={[-5, 3.5, -8.9]} />

        {/* ═══════════════════════════════════════════ */}
        {/* BANCADA ESQUERDA (Síntese Avançada e Purificação) */}
        {/* ═══════════════════════════════════════════ */}

        {/* Capela de exaustão */}
        <InteractiveFumeHood
          id="fumehood-1"
          position={[-11.0, 0.02, -2.5]}
          scale={0.9}
          isOn={true}
          sashHeight={0.5}
        />

        {/* Destilação */}
        <DistillationApparatus
          position={[-10.5, 1.02, -1.0]}
          scale={0.6}
          mixtureId={distillationMixtureId as any}
          isHeating={distillationHeating}
          onClick={() => openDistillationPanel()}
        />

        {/* Reações Orgânicas - Fermentação */}
        <group position={[-10.5, 1.0, 0.5]} scale={0.8}>
          <OrganicReactionVessel
            position={[0, 0, 0]}
            reactionId={'fermentation' as any}
            isActive={organicIsActive && organicReactionId === 'fermentation'}
            temperature={organicTemperature}
            stirring={organicStirring}
          />
        </group>

        {/* Balão de Gás */}
        <GasBalloon
          id="balloon-1"
          position={[-10.0, 1.8, -2.0]}
          gasFormula="He"
          mols={0.01}
          temperature={25}
          color="#ff6b6b"
          maxRadius={0.1}
        />

        {/* Reator Organico - Esterificacao */}
        <group position={[-10.5, 1.02, 2.0]} scale={0.8}>
          <OrganicReactionVessel
            position={[0, 0, 0]}
            reactionId={'esterification' as any}
            isActive={organicIsActive && organicReactionId === 'esterification'}
            temperature={organicTemperature}
            stirring={organicStirring}
          />
        </group>

        {/* Equipamentos Dieléticos - Esquerda */}
        <DeviceReagentCabinet position={[-11.5, 0.02, 0.5]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
        <DeviceNuclearReactor position={[-11.0, 1.02, 3.5]} scale={0.8} />

        {/* ═══════════════════════════════════════════ */}
        {/* BANCADA DIREITA (Análise e Eletroquímica) */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tanque SPH */}
        <DeviceSPHTank position={[10.5, 1.02, -2.5]} rotation={[0, -Math.PI / 2, 0]} scale={0.6} />

        {/* Eletrólise */}
        <ElectrolysisCell
          position={[10.5, 1.02, -1.5]}
          scale={0.7}
          electrolyteId={electrolysisElectrolyteId as any}
          voltage={electrolysisVoltage}
          isRunning={electrolysisRunning}
          onClick={() => openElectrolysisPanel()}
        />

        {/* Cristalização — CONTROLADA PELO STORE */}
        <CrystallizationDish
          position={[10.5, 1.05, -0.5]}
          substanceId={crystallizerSubstanceId as any}
          initialConcentration={400}
          initialTemperature={80}
          isHeating={crystallizerIsHeating}
          isCooling={crystallizerIsCooling}
        />

        {/* Espectrômetro de Massa */}
        <group position={[10.5, 1.02, 0.5]} scale={0.7}>
          <Spectrometer
            position={[0, 0, 0]}
            isActive={false}
          />
        </group>

        {/* Equipamentos Dieléticos - Direita */}
        <DeviceMicroscope position={[10.5, 1.02, 1.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
        <DeviceComputerTerminal position={[10.5, 1.02, 2.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
        <DeviceSolidState position={[10.0, 1.02, 3.2]} rotation={[0, -Math.PI / 2, 0]} scale={0.8} />
        <DeviceProjector position={[11.0, 1.02, 3.2]} rotation={[0, -Math.PI / 2, 0]} scale={0.8} />

      </LabRoom>

      {/* CONTROLES FPS */}
      <FPSControls />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════════════════════
function LoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <torusGeometry args={[0.3, 0.1, 16, 32]} />
      <meshBasicMaterial color="#4ecdc4" wireframe />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════════════════
export default function Scene() {
  const [webglSupported, setWebglSupported] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWebglSupported(isWebGLSupported())
  }, [])

  if (!mounted) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner" />
          <h2>🧪 Carregando Laboratório...</h2>
          <p>Preparando ambiente de simulação</p>
        </div>
      </div>
    )
  }

  if (!webglSupported) {
    return (
      <div className="error-screen">
        <h1>⚠️ WebGL Não Suportado</h1>
        <p>Use Chrome, Firefox ou Edge para visualizar o laboratório 3D.</p>
      </div>
    )
  }

  return (
    <div className="lab-container">
      {/* HUD */}
      <LabHUD />

      {/* CANVAS 3D — Kill-switch de eventos é feito dentro do FPSControls */}
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          console.log('🧪 Laboratório inicializado (perf otimizado)')
        }}
      >
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 8, 20]} />

        <PerspectiveCamera makeDefault position={[3, 2.5, 4]} fov={50} />

        <Suspense fallback={<LoadingFallback />}>
          <LabScene />
        </Suspense>

        <PerfDebugger />
      </Canvas>
    </div>
  )
}
