// src/components/canvas/Scene.tsx
// Laboratório Virtual 3D - Cena Principal
import { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
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
import InteractiveTestTube from './glassware/InteractiveTestTube'
import InteractiveFumeHood from './equipment/InteractiveFumeHood'

// SISTEMAS AVANÇADOS
import { CrystallizationDish } from '../equipment/CrystallizationDish'
import { ElectrolysisCell } from '../equipment/ElectrolysisCell'
import { DistillationApparatus } from '../equipment/DistillationApparatus'
import { GasBalloon } from '../effects/GasBalloon'
import HolographicProjector from './HolographicProjector'
import { Spectrometer } from '../equipment/Spectrometer'
import { Manometer } from '../equipment/Manometer'
import { Thermometer } from '../equipment/Thermometer'
import { OrganicReactionVessel } from '../equipment/OrganicReactionVessel'
import { QuantumZoom } from './effects/QuantumZoom'

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
              scale={1.0}
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
              scale={1.8}
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
              scale={1.5}
            />
          )
        }
        if ((obj.type as string) === 'cylinder') {
          return (
            <InteractiveGraduatedCylinder
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              temperature={obj.temperature}
              ph={obj.ph || 7}
              volume={obj.volume}
              maxVolume={100}
              scale={1.5}
            />
          )
        }
        if ((obj.type as string) === 'separating_funnel') {
          return (
            <SeparatingFunnel
              key={obj.id}
              id={obj.id}
              position={obj.position}
              components={[{ id: obj.formula || 'unknown', amount: obj.fillLevel, color: obj.color }]}
              scale={1.5}
            />
          )
        }
        if ((obj.type as string) === 'test-tube') {
          return (
            <InteractiveTestTube
              key={obj.id}
              id={obj.id}
              position={obj.position}
              formula={obj.formula}
              fillLevel={obj.fillLevel}
              color={obj.color}
              ph={obj.ph || 7}
              scale={0.5}
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
  
  const activeQuantumFormula = useLabStore((state) => state.activeQuantumFormula)
  const isQuantumZoomOpen = useLabStore((state) => state.isQuantumZoomOpen)

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

      {/* Projetor Holográfico da Fase 2 */}
      <HolographicProjector 
        position={[2, 0.8, -1.5]} 
        formulaToLoad={activeQuantumFormula} 
      />

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

        {/* OBJETOS INTERATIVOS DA CENA PADRÃO (renderizados na bancada central) */}
        <LabObjects />

        {/* BANCADA CENTRAL (Química Úmida) */}
        {/* ═══════════════════════════════════════════ */}

        {/* Rack de tubos de ensaio vazio (tubos dinâmicos ficam aqui dentro da msm coord) */}
        <TestTubeRack position={[1.6, 1.02, -0.5]} />

        {/* Bico de Bunsen e Tripe */}
        <BunsenBurner position={[-2.5, 1.02, -0.5]} isLit={false} />
        <InteractiveTripod
          id="tripod-1"
          position={[-2.5, 1.02, -0.5]}
          scale={1.0}
          isHeating={false}
        />

        {/* Suporte base da Bureta FUNCIONAL */}
        <group position={[-1.0, 1.4, -0.5]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 1.6, 16]} />
                <meshStandardMaterial color="#666666" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.35, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
                <meshStandardMaterial color="#444444" metalness={0.5} />
            </mesh>
        </group>
        <InteractiveBurette
          id="burette-1"
          position={[-1.0, 2.35, -0.5]}
          maxVolume={50}
          scale={1.5}
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
          isOn={true}
          sashHeight={0.5}
        />

        {/* Destilação */}
        <DistillationApparatus
          position={[-10.5, 1.02, -1.0]}
          mixtureId={distillationMixtureId as any}
          isHeating={distillationHeating}
          onClick={() => openDistillationPanel()}
        />

        {/* Reações Orgânicas - Fermentação */}
        <group position={[-10.5, 1.0, 0.5]}>
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
        <group position={[-10.5, 1.02, 2.0]}>
          <OrganicReactionVessel
            position={[0, 0, 0]}
            reactionId={'esterification' as any}
            isActive={organicIsActive && organicReactionId === 'esterification'}
            temperature={organicTemperature}
            stirring={organicStirring}
          />
        </group>

        {/* Equipamentos Dieléticos - Esquerda */}
        <DeviceReagentCabinet position={[-11.5, 0.02, 0.5]} rotation={[0, Math.PI / 2, 0]} />
        <DeviceNuclearReactor position={[-11.0, 1.02, 3.5]} />

        {/* ═══════════════════════════════════════════ */}
        {/* BANCADA DIREITA (Análise e Eletroquímica) */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tanque SPH */}
        <DeviceSPHTank position={[10.5, 1.02, -2.5]} rotation={[0, -Math.PI / 2, 0]} />

        {/* Eletrólise */}
        <ElectrolysisCell
          position={[10.5, 1.02, -1.5]}
          electrolyteId={electrolysisElectrolyteId as any}
          voltage={electrolysisVoltage}
          isRunning={electrolysisRunning}
          onClick={() => openElectrolysisPanel()}
        />

        {/* Cristalização — CONTROLADA PELO STORE */}
        <group position={[10.5, 1.05, -0.5]}>
          <CrystallizationDish
            position={[0, 0, 0]}
            substanceId={crystallizerSubstanceId as any}
            initialConcentration={400}
            initialTemperature={80}
            isHeating={crystallizerIsHeating}
            isCooling={crystallizerIsCooling}
          />
        </group>

        {/* Espectrômetro de Massa */}
        <group position={[10.5, 1.02, 0.5]}>
          <Spectrometer
            position={[0, 0, 0]}
            isActive={false}
          />
        </group>

        {/* Equipamentos Dieléticos - Direita */}
        <DeviceMicroscope position={[10.5, 1.02, 1.5]} rotation={[0, -Math.PI / 2, 0]} />
        <DeviceComputerTerminal position={[10.5, 1.02, 2.5]} rotation={[0, -Math.PI / 2, 0]} />
        <DeviceSolidState position={[10.0, 1.02, 3.5]} rotation={[0, -Math.PI / 2, 0]} />
        <DeviceProjector position={[11.5, 1.02, 3.5]} rotation={[0, -Math.PI / 2, 0]} />

      </LabRoom>

      {/* FASE 3: MERGULHO SUBATÔMICO */}
      {isQuantumZoomOpen && (
        <group position={[2, 0.8, -1.5]}>
          <QuantumZoom formula={activeQuantumFormula} />
        </group>
      )}

      {/* CONTROLES FPS */}
      <FPSControls />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// CAMERA WARP EFFECT (Fase 3 Transition)
// ═══════════════════════════════════════════════════════════════════════
function CameraTransition() {
  const isQuantumZoomOpen = useLabStore((state) => state.isQuantumZoomOpen)
  const { camera } = useThree()
  
  useFrame((_, delta) => {
    if (isQuantumZoomOpen) {
      // Zoom into the holographic projector position
      const targetPos = new THREE.Vector3(2, 0.8, -1.0)
      camera.position.lerp(targetPos, delta * 3)
      if ((camera as any).fov) {
        ;(camera as any).fov = THREE.MathUtils.lerp((camera as any).fov, 120, delta * 4)
        camera.updateProjectionMatrix()
      }
    } else {
      // Reset FOV smoothly when closing
      if ((camera as any).fov > 50) {
        ;(camera as any).fov = THREE.MathUtils.lerp((camera as any).fov, 50, delta * 4)
        camera.updateProjectionMatrix()
      }
    }
  })
  
  return null
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
        onCreated={({ gl: _gl }) => {
          console.log('🧪 Laboratório inicializado (perf otimizado)')
        }}
      >
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 8, 20]} />

        <PerspectiveCamera makeDefault position={[3, 2.5, 4]} fov={50} />

        <Suspense fallback={<LoadingFallback />}>
          <LabScene />
        </Suspense>

        <CameraTransition />
        <PerfDebugger />
      </Canvas>
    </div>
  )
}
