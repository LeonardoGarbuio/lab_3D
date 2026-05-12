// src/components/canvas/FPSControls.tsx
// ═══════════════════════════════════════════════════════════════════════
// 🎮 CONTROLE FPS — LIMPO, SEM HACKS
//
// Lição aprendida: NÃO mexer no sistema de eventos do R3F!
// O jogador interage com objetos ENQUANTO anda (olha + clica).
// Desligar raycaster ou events quebra a interação.
// A performance vem de: reduzir useFrame callbacks e draw calls.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useLabStore } from '../../stores/useLabStore'

const PHYSICS_TIMESTEP = 1 / 60
const MAX_SUBSTEPS = 3

export function FPSControls() {
    const { camera } = useThree()
    const controlsRef = useRef<any>(null)
    const moveState = useRef({ forward: false, backward: false, left: false, right: false, run: false })
    const speed = useRef(4.0)
    const velocity = useRef(new THREE.Vector3())
    const direction = useRef(new THREE.Vector3())
    const timeAccumulator = useRef(0)

    const isAnyModalOpen = useLabStore(state =>
        state.isPeriodicTableOpen ||
        state.isReagentPanelOpen ||
        state.isExperimentPanelOpen ||
        state.isNotebookOpen ||
        state.isQuantumMicroscopeOpen ||
        state.isAtomicModelsOpen ||
        state.isElectronConfigOpen ||
        state.isPeriodicPropertiesOpen ||
        state.isNuclearPhysicsOpen ||
        state.isIntermolecularOpen ||
        state.isSolidStateOpen ||
        state.isElectrolysisPanelOpen ||
        state.isDistillationPanelOpen
    )

    useEffect(() => {
        if (isAnyModalOpen && controlsRef.current && controlsRef.current.isLocked) {
            controlsRef.current.unlock()
        }
    }, [isAnyModalOpen])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyW': moveState.current.forward = true; break
                case 'KeyA': moveState.current.left = true; break
                case 'KeyS': moveState.current.backward = true; break
                case 'KeyD': moveState.current.right = true; break
                case 'ShiftLeft': moveState.current.run = true; break
            }
        }
        const onKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyW': moveState.current.forward = false; break
                case 'KeyA': moveState.current.left = false; break
                case 'KeyS': moveState.current.backward = false; break
                case 'KeyD': moveState.current.right = false; break
                case 'ShiftLeft': moveState.current.run = false; break
            }
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
        camera.position.set(0, 1.6, 5)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('keyup', onKeyUp)
        }
    }, [camera])

    useFrame((state, delta) => {
        if (!controlsRef.current?.isLocked) return

        // Fix: O R3F guarda a última posição do rato antes do lock. 
        // Precisamos forçar o raycaster (pointer) para o centro da tela (mira)
        state.pointer.set(0, 0)

        // Fixed timestep physics (sem tocar em events/raycaster)
        const clampedDelta = Math.min(delta, 0.25)
        timeAccumulator.current += clampedDelta
        
        let steps = 0
        while (timeAccumulator.current >= PHYSICS_TIMESTEP && steps < MAX_SUBSTEPS) {
            physicsStep(PHYSICS_TIMESTEP)
            timeAccumulator.current -= PHYSICS_TIMESTEP
            steps++
        }
        if (timeAccumulator.current > PHYSICS_TIMESTEP * 2) {
            timeAccumulator.current = 0
        }
    })

    function physicsStep(dt: number) {
        velocity.current.x -= velocity.current.x * 10.0 * dt
        velocity.current.z -= velocity.current.z * 10.0 * dt
        direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward)
        direction.current.x = Number(moveState.current.right) - Number(moveState.current.left)
        direction.current.normalize()
        const currentSpeed = moveState.current.run ? speed.current * 1.8 : speed.current
        if (moveState.current.forward || moveState.current.backward) velocity.current.z -= direction.current.z * 40.0 * dt
        if (moveState.current.left || moveState.current.right) velocity.current.x -= direction.current.x * 40.0 * dt
        const maxVel = 15
        velocity.current.x = Math.max(-maxVel, Math.min(maxVel, velocity.current.x))
        velocity.current.z = Math.max(-maxVel, Math.min(maxVel, velocity.current.z))
        controlsRef.current.moveRight(-velocity.current.x * dt * currentSpeed)
        controlsRef.current.moveForward(-velocity.current.z * dt * currentSpeed)
        if (camera.position.x < -14) { camera.position.x = -14; velocity.current.x = 0 }
        if (camera.position.x > 14)  { camera.position.x = 14;  velocity.current.x = 0 }
        if (camera.position.z < -9)  { camera.position.z = -9;  velocity.current.z = 0 }
        if (camera.position.z > 9)   { camera.position.z = 9;   velocity.current.z = 0 }
        camera.position.y = 1.6
    }

    return (
        <PointerLockControls 
            ref={controlsRef}
            selector="#root"
            onLock={() => useLabStore.getState().setFPSLocked(true)}
            onUnlock={() => useLabStore.getState().setFPSLocked(false)}
        />
    )
}
