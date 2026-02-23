// src/components/canvas/Scene.tsx
// Laboratório Virtual 3D - Cena Principal
import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

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
import Pipette from './glassware/Pipette'
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

  const handleBackgroundClick = () => {
    selectObject(null)
    cancelPouring()
  }

  return (
    <>
      {/* ILUMINAÇÃO */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight intensity={0.4} groundColor="#1a1a2e" />
      <pointLight position={[-3, 3, 2]} intensity={0.7} color="#fff5e6" />
      <pointLight position={[3, 2, -2]} intensity={0.3} color="#4ecdc4" />

      {/* AMBIENTE */}
      <LabRoom>
        {/* Click no fundo */}
        <mesh
          position={[0, 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleBackgroundClick}
          visible={false}
        >
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Bancada */}
        <LabBench position={[0, 0, 0]} />

        {/* OBJETOS INTERATIVOS */}
        <LabObjects />

        {/* Tubos de ensaio decorativos */}
        <TestTubeRack
          position={[1.6, 1.02, -0.3]}
          tubes={[
            { color: '#ff6b6b', level: 0.8 },
            { color: '#4ecdc4', level: 0.6 },
            { color: '#ffe66d', level: 0.9 },
            { color: '#ff69b4', level: 0.4 },
            { color: '#87CEEB', level: 0.7 },
          ]}
        />

        {/* Bico de Bunsen (esquerda) */}
        <BunsenBurner position={[-2.5, 1.02, 0.3]} isLit={true} />

        {/* ═══════════════════════════════════════════ */}
        {/* EQUIPAMENTOS INTERATIVOS */}
        {/* ═══════════════════════════════════════════ */}

        {/* Tripé com tela INTERATIVO - EXTREMA ESQUERDA */}
        <InteractiveTripod
          id="tripod-1"
          position={[-2.5, 1.02, 0.0]}
          scale={1.0}
          isHeating={false}
        />

        {/* Proveta graduada - ESQUERDA */}
        <InteractiveGraduatedCylinder
          id="graduated-cylinder-1"
          position={[-1.8, 1.45, 0.0]}
          formula={null}
          fillLevel={0.6}
          color="#4ecdc4"
          temperature={25}
          ph={7}
          volume={60}
          maxVolume={100}
          scale={0.7}
        />

        {/* Bureta INTERATIVA - no suporte central */}
        <InteractiveBurette
          id="burette-1"
          position={[-1.2, 1.75, 0.0]}
          formula="NaOH"
          fillLevel={0.75}
          color="#ff69b4"
          ph={14}
          maxVolume={50}
          scale={0.7}
        />

        {/* Pipeta - sobre a bancada esquerda */}
        <Pipette
          position={[-2.0, 1.35, 0.0]}
          scale={0.6}
          liquidColor="#87CEEB"
          liquidLevel={0.5}
          volume={10}
        />

        {/* Funil de separação - sobre a bancada */}
        <SeparatingFunnel
          position={[0.0, 1.45, -0.2]}
          scale={0.5}
          upperLiquidColor="#ffe066"
          lowerLiquidColor="#4ecdc4"
          upperLevel={0.3}
          lowerLevel={0.4}
        />

        {/* Capela de exaustão INTERATIVA - NO CHÃO ao lado direito */}
        <InteractiveFumeHood
          id="fumehood-1"
          position={[4.0, 0.02, 0]}
          scale={0.9}
          isOn={true}
          sashHeight={0.5}
        />

        {/* ═══════════════════════════════════════════ */}
        {/* SISTEMAS AVANÇADOS */}
        {/* ═══════════════════════════════════════════ */}

        {/* Cristalização - bancada esquerda traseira */}
        <CrystallizationDish
          position={[-2.0, 1.1, -0.8]}
          substanceId="NaCl"
          initialConcentration={400}
          initialTemperature={80}
          isHeating={false}
          isCooling={true}
        />

        {/* Eletrólise - lado direito da bancada */}
        <ElectrolysisCell
          position={[2.0, 1.2, 0]}
          scale={0.6}
          electrolyteId="sulfuricAcid"
          voltage={6}
          isRunning={true}
        />

        {/* Destilação - área traseira central */}
        <DistillationApparatus
          position={[0, 1.0, -1.5]}
          scale={0.5}
          mixtureId="ethanolWater"
          isHeating={true}
        />

        {/* Balão de Gás - flutuando próximo */}
        <GasBalloon
          id="balloon-1"
          position={[1.2, 1.8, 0.5]}
          gasFormula="He"
          mols={0.01}
          temperature={25}
          color="#ff6b6b"
          maxRadius={0.1}
        />

        {/* Espectrômetro - área de análise */}
        <Spectrometer
          position={[2.5, 1.0, -0.8]}
          isActive={true}
          sampleElement="Na"
          showSpectrum={true}
        />

        {/* Manômetro - medição de pressão */}
        <Manometer
          position={[-1.0, 1.4, 0.5]}
          size={0.2}
          pressure={1.5}
          maxPressure={5}
          unit="atm"
        />

        {/* Termômetro - sobre a bancada */}
        <Thermometer
          position={[0.8, 1.3, 0.4]}
          size={0.4}
          temperature={37}
          minTemp={-10}
          maxTemp={110}
        />

        {/* Reações Orgânicas - balão de reação */}
        <OrganicReactionVessel
          position={[-1.5, 1.0, -1.0]}
          reactionId="fermentation"
          isActive={true}
          temperature={30}
          stirring={true}
        />
      </LabRoom>

      {/* CONTROLES */}
      <OrbitControls
        makeDefault
        minDistance={2}
        maxDistance={12}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 1.2, 0]}
        enablePan={false}
      />
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

      {/* CANVAS 3D */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={() => console.log('🧪 Laboratório de Química inicializado!')}
      >
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 10, 25]} />

        <PerspectiveCamera makeDefault position={[3, 2.5, 4]} fov={50} />

        <Suspense fallback={<LoadingFallback />}>
          <LabScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
