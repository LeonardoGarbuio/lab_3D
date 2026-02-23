// src/components/ui/TemperatureGraph.tsx
// Gráfico de temperatura em tempo real
import { useState, useEffect, useRef } from 'react'
import './TemperatureGraph.css'

interface TemperatureGraphProps {
    isOpen: boolean
    onClose: () => void
    currentTemp: number
    objectName: string
}

interface DataPoint {
    time: number
    temp: number
}

export default function TemperatureGraph({ isOpen, onClose, currentTemp, objectName }: TemperatureGraphProps) {
    const [data, setData] = useState<DataPoint[]>([])
    const [startTime] = useState(Date.now())
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Adicionar ponto de dados
    useEffect(() => {
        if (!isOpen) return

        const interval = setInterval(() => {
            setData(prev => {
                const newData = [...prev, { time: (Date.now() - startTime) / 1000, temp: currentTemp }]
                // Manter últimos 60 segundos
                return newData.filter(d => d.time > newData[newData.length - 1].time - 60)
            })
        }, 500)

        return () => clearInterval(interval)
    }, [isOpen, currentTemp, startTime])

    // Desenhar gráfico
    useEffect(() => {
        if (!canvasRef.current || data.length < 2) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const padding = 40

        // Limpar
        ctx.clearRect(0, 0, width, height)

        // Background
        ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'
        ctx.fillRect(0, 0, width, height)

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1

        // Linhas horizontais (temperatura)
        for (let t = 0; t <= 100; t += 20) {
            const y = padding + (100 - t) * (height - 2 * padding) / 100
            ctx.beginPath()
            ctx.moveTo(padding, y)
            ctx.lineTo(width - padding, y)
            ctx.stroke()

            ctx.fillStyle = '#666'
            ctx.font = '10px sans-serif'
            ctx.fillText(`${t}°C`, 5, y + 4)
        }

        // Eixos
        ctx.strokeStyle = '#4ecdc4'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, padding)
        ctx.lineTo(padding, height - padding)
        ctx.lineTo(width - padding, height - padding)
        ctx.stroke()

        // Dados
        if (data.length > 1) {
            const maxTime = data[data.length - 1].time
            const minTime = Math.max(0, maxTime - 60)

            // Linha de temperatura
            ctx.strokeStyle = '#ff6b6b'
            ctx.lineWidth = 2
            ctx.beginPath()

            data.forEach((point, i) => {
                const x = padding + ((point.time - minTime) / 60) * (width - 2 * padding)
                const y = padding + (100 - point.temp) * (height - 2 * padding) / 100

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            })

            ctx.stroke()

            // Ponto atual
            const lastPoint = data[data.length - 1]
            const lastX = padding + ((lastPoint.time - minTime) / 60) * (width - 2 * padding)
            const lastY = padding + (100 - lastPoint.temp) * (height - 2 * padding) / 100

            ctx.fillStyle = '#ff6b6b'
            ctx.beginPath()
            ctx.arc(lastX, lastY, 6, 0, Math.PI * 2)
            ctx.fill()

            // Valor atual
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 14px sans-serif'
            ctx.fillText(`${currentTemp.toFixed(1)}°C`, lastX + 10, lastY)
        }

        // Título
        ctx.fillStyle = '#4ecdc4'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText(`Temperatura: ${objectName}`, padding, 20)

        // Marca de 100°C (ebulição)
        const boilY = padding + (100 - 100) * (height - 2 * padding) / 100
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(padding, boilY)
        ctx.lineTo(width - padding, boilY)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#ff6b6b'
        ctx.font = '10px sans-serif'
        ctx.fillText('Ebulição', width - padding - 40, boilY - 5)

    }, [data, currentTemp, objectName])

    if (!isOpen) return null

    return (
        <div className="graph-overlay" onClick={onClose}>
            <div className="graph-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                <h3>📈 Curva de Aquecimento</h3>
                <canvas ref={canvasRef} width={400} height={250} />
                <div className="graph-legend">
                    <span className="legend-item"><span className="dot temp"></span> Temperatura</span>
                    <span className="legend-item"><span className="dot boil"></span> Ponto de Ebulição (100°C)</span>
                </div>
            </div>
        </div>
    )
}
