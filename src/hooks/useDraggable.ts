// src/hooks/useDraggable.ts
// Hook para tornar objetos 3D arrastáveis
import { useRef, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface DraggableOptions {
    onDragStart?: () => void
    onDragEnd?: (position: THREE.Vector3) => void
    onDrag?: (position: THREE.Vector3) => void
    lockY?: boolean // Manter altura fixa
    yOffset?: number // Altura mínima
}

export function useDraggable(options: DraggableOptions = {}) {
    const { lockY = true, yOffset = 1.1, onDragStart, onDragEnd, onDrag } = options

    const [isDragging, setIsDragging] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const groupRef = useRef<THREE.Group>(null)
    const { camera, gl, raycaster } = useThree()

    // Plano invisível para raycasting durante drag
    const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -yOffset))
    const intersection = useRef(new THREE.Vector3())

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setIsDragging(true)
        gl.domElement.style.cursor = 'grabbing'
        onDragStart?.()

            // Capturar ponteiro
            ; (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }, [gl, onDragStart])

    const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setIsDragging(false)
        gl.domElement.style.cursor = isHovered ? 'grab' : 'default'

        if (groupRef.current) {
            onDragEnd?.(groupRef.current.position.clone())
        }

        // Liberar ponteiro
        ; (e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }, [gl, isHovered, onDragEnd])

    const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
        if (!isDragging || !groupRef.current) return
        e.stopPropagation()

        // Atualizar raycaster com posição do mouse
        const rect = gl.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        )

        raycaster.setFromCamera(mouse, camera)

        // Encontrar interseção com plano horizontal
        if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
            const newPos = intersection.current.clone()

            // Limitar área de movimento (sobre a bancada)
            newPos.x = THREE.MathUtils.clamp(newPos.x, -1.8, 1.2)
            newPos.z = THREE.MathUtils.clamp(newPos.z, -0.5, 0.5)

            if (lockY) {
                newPos.y = yOffset
            }

            groupRef.current.position.copy(newPos)
            onDrag?.(newPos)
        }
    }, [isDragging, camera, gl, raycaster, lockY, yOffset, onDrag])

    const handlePointerEnter = useCallback(() => {
        setIsHovered(true)
        if (!isDragging) {
            gl.domElement.style.cursor = 'grab'
        }
    }, [gl, isDragging])

    const handlePointerLeave = useCallback(() => {
        setIsHovered(false)
        if (!isDragging) {
            gl.domElement.style.cursor = 'default'
        }
    }, [gl, isDragging])

    return {
        groupRef,
        isDragging,
        isHovered,
        bind: {
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onPointerMove: handlePointerMove,
            onPointerEnter: handlePointerEnter,
            onPointerLeave: handlePointerLeave,
        }
    }
}
