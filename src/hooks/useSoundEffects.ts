// src/hooks/useSoundEffects.ts
// Sistema de efeitos sonoros do laboratório
import { useRef, useCallback } from 'react'

// Classe para criar sons programaticamente usando Web Audio API
class SoundGenerator {
    private audioContext: AudioContext | null = null

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return this.audioContext
    }

    // Som de bolhas/efervescência
    playBubbles(_duration: number = 500) {
        const ctx = this.getContext()
        const now = ctx.currentTime

        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(200 + Math.random() * 400, now)
            osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 200, now + 0.1)

            gain.gain.setValueAtTime(0.05, now + i * 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + i * 0.1)
            osc.stop(now + i * 0.1 + 0.2)
        }
    }

    // Som de despejo/pouring
    playPour(duration: number = 800) {
        const ctx = this.getContext()
        const now = ctx.currentTime

        // Ruído branco filtrado
        const bufferSize = ctx.sampleRate * (duration / 1000)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        const noise = ctx.createBufferSource()
        noise.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(800, now)
        filter.Q.value = 2

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000)

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        noise.start(now)
        noise.stop(now + duration / 1000)
    }

    // Som de quebra de vidro
    playGlassBreak() {
        const ctx = this.getContext()
        const now = ctx.currentTime

        // Vários oscilladores para simular estilhaços
        for (let i = 0; i < 8; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'square'
            osc.frequency.setValueAtTime(2000 + Math.random() * 3000, now)
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3)

            gain.gain.setValueAtTime(0.1, now + i * 0.02)
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.1)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + i * 0.02)
            osc.stop(now + 0.4)
        }
    }

    // Som de aquecimento/fogo
    playHeating() {
        const ctx = this.getContext()
        const now = ctx.currentTime

        // Ruído de fogo
        const bufferSize = ctx.sampleRate * 0.5
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i / 100)
        }

        const noise = ctx.createBufferSource()
        noise.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 500

        const gain = ctx.createGain()
        gain.gain.value = 0.08

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        noise.start(now)
    }

    // Som de reação química
    playReaction() {
        const ctx = this.getContext()
        const now = ctx.currentTime

        // Swoosh + bolhas
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(100, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.5)

        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.5)

        // Adiciona bolhas
        setTimeout(() => this.playBubbles(300), 200)
    }

    // Som de clique/seleção
    playClick() {
        const ctx = this.getContext()
        const now = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.value = 800

        gain.gain.setValueAtTime(0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.05)
    }

    // Som de sucesso
    playSuccess() {
        const ctx = this.getContext()
        const now = ctx.currentTime

        const notes = [523.25, 659.25, 783.99] // C5, E5, G5

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.value = freq

            gain.gain.setValueAtTime(0.08, now + i * 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + i * 0.1)
            osc.stop(now + i * 0.1 + 0.3)
        })
    }
}

const soundGenerator = new SoundGenerator()

export function useSoundEffects() {
    const enabled = useRef(true)

    const playSound = useCallback((type: 'bubbles' | 'pour' | 'break' | 'heat' | 'reaction' | 'click' | 'success') => {
        if (!enabled.current) return

        try {
            switch (type) {
                case 'bubbles': soundGenerator.playBubbles(); break
                case 'pour': soundGenerator.playPour(); break
                case 'break': soundGenerator.playGlassBreak(); break
                case 'heat': soundGenerator.playHeating(); break
                case 'reaction': soundGenerator.playReaction(); break
                case 'click': soundGenerator.playClick(); break
                case 'success': soundGenerator.playSuccess(); break
            }
        } catch (e) {
            console.warn('Sound playback failed:', e)
        }
    }, [])

    const toggleSound = useCallback(() => {
        enabled.current = !enabled.current
        return enabled.current
    }, [])

    return { playSound, toggleSound, isSoundEnabled: () => enabled.current }
}
