// src/components/ui/PHGraph.tsx
// Gráfico de pH em tempo real para titulação

import { useEffect, useRef, useState } from 'react'
import './PHGraph.css'

interface PHGraphProps {
    dataPoints: Array<{ volume: number; ph: number }>
    currentPH: number
    equivalenceVolume?: number
    isActive: boolean
    title?: string
}

export function PHGraph({
    dataPoints,
    currentPH,
    equivalenceVolume,
    isActive,
    title = 'Curva de Titulação'
}: PHGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [dimensions, _setDimensions] = useState({ width: 300, height: 200 })

    // Desenhar gráfico
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { width, height } = dimensions
        const padding = 40
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2

        // Limpar canvas
        ctx.fillStyle = 'rgba(15, 15, 25, 0.95)'
        ctx.fillRect(0, 0, width, height)

        // Desenhar grade
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1

        // Linhas horizontais (pH)
        for (let i = 0; i <= 14; i += 2) {
            const y = padding + graphHeight - (i / 14) * graphHeight
            ctx.beginPath()
            ctx.moveTo(padding, y)
            ctx.lineTo(width - padding, y)
            ctx.stroke()

            // Labels de pH
            ctx.fillStyle = '#888'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText(i.toString(), padding - 5, y + 3)
        }

        // Linha de pH 7 (neutro) destacada
        const neutralY = padding + graphHeight - (7 / 14) * graphHeight
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(padding, neutralY)
        ctx.lineTo(width - padding, neutralY)
        ctx.stroke()
        ctx.setLineDash([])

        // Eixo Y label
        ctx.save()
        ctx.translate(12, height / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = '#4ecdc4'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('pH', 0, 0)
        ctx.restore()

        // Eixo X label
        ctx.fillStyle = '#4ecdc4'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Volume (mL)', width / 2, height - 5)

        // Desenhar dados
        if (dataPoints.length > 1) {
            const maxVolume = Math.max(...dataPoints.map(p => p.volume), 10)

            // Linha do gráfico
            ctx.beginPath()
            ctx.strokeStyle = '#4ecdc4'
            ctx.lineWidth = 2

            dataPoints.forEach((point, i) => {
                const x = padding + (point.volume / maxVolume) * graphWidth
                const y = padding + graphHeight - (point.ph / 14) * graphHeight

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            })
            ctx.stroke()

            // Gradiente sob a curva
            const lastPoint = dataPoints[dataPoints.length - 1]
            const lastX = padding + (lastPoint.volume / maxVolume) * graphWidth

            const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
            gradient.addColorStop(0, 'rgba(78, 205, 196, 0.3)')
            gradient.addColorStop(1, 'rgba(78, 205, 196, 0)')

            ctx.beginPath()
            ctx.moveTo(padding, padding + graphHeight)
            dataPoints.forEach((point) => {
                const x = padding + (point.volume / maxVolume) * graphWidth
                const y = padding + graphHeight - (point.ph / 14) * graphHeight
                ctx.lineTo(x, y)
            })
            ctx.lineTo(lastX, padding + graphHeight)
            ctx.closePath()
            ctx.fillStyle = gradient
            ctx.fill()

            // Ponto atual
            const currentX = lastX
            const currentY = padding + graphHeight - (currentPH / 14) * graphHeight

            ctx.beginPath()
            ctx.arc(currentX, currentY, 6, 0, Math.PI * 2)
            ctx.fillStyle = getPHColor(currentPH)
            ctx.fill()
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()
        }

        // Linha do ponto de equivalência
        if (equivalenceVolume) {
            const maxVolume = Math.max(...dataPoints.map(p => p.volume), equivalenceVolume * 1.5)
            const eqX = padding + (equivalenceVolume / maxVolume) * graphWidth

            ctx.strokeStyle = '#ff6b6b'
            ctx.lineWidth = 2
            ctx.setLineDash([3, 3])
            ctx.beginPath()
            ctx.moveTo(eqX, padding)
            ctx.lineTo(eqX, height - padding)
            ctx.stroke()
            ctx.setLineDash([])

            // Label
            ctx.fillStyle = '#ff6b6b'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Eq.', eqX, padding - 5)
        }

    }, [dataPoints, currentPH, equivalenceVolume, dimensions])

    return (
        <div className={`ph-graph ${isActive ? 'active' : ''}`}>
            <div className="graph-header">
                <span className="graph-title">{title}</span>
                <span className="current-ph" style={{ color: getPHColor(currentPH) }}>
                    pH: {currentPH.toFixed(2)}
                </span>
            </div>

            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="graph-canvas"
            />

            <div className="ph-scale">
                <span className="acid">Ácido</span>
                <div className="scale-bar" />
                <span className="base">Base</span>
            </div>
        </div>
    )
}

function getPHColor(ph: number): string {
    if (ph < 3) return '#ff0000'
    if (ph < 5) return '#ff6600'
    if (ph < 6) return '#ffcc00'
    if (ph < 8) return '#00cc00'
    if (ph < 10) return '#00ccff'
    if (ph < 12) return '#0066ff'
    return '#6600ff'
}

export default PHGraph
