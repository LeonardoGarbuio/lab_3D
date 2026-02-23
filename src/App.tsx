// src/App.tsx
// Aplicação principal do Laboratório Virtual
import { useState, useEffect } from 'react'
import Scene from './components/canvas/Scene'
import LandingPage from './components/ui/LandingPage'
import Tutorial from './components/ui/Tutorial'
import './App.css'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    // Verificar se é a primeira visita
    const visited = localStorage.getItem('lab-visited')
    if (visited) {
      setIsFirstVisit(false)
    }
  }, [])

  const handleStart = () => {
    setShowLanding(false)

    // Mostrar tutorial na primeira visita
    if (isFirstVisit) {
      setTimeout(() => {
        setShowTutorial(true)
        localStorage.setItem('lab-visited', 'true')
      }, 500)
    }
  }

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    setIsFirstVisit(false)
  }

  // Permitir reabrir o tutorial
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (!showLanding) {
          setShowTutorial(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLanding])

  return (
    <div className="app">
      {showLanding ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <>
          <Scene />
          <Tutorial isOpen={showTutorial} onClose={handleCloseTutorial} />

          {/* Dica do tutorial */}
          {!showTutorial && (
            <div className="tutorial-hint">
              Pressione <kbd>H</kbd> para abrir o tutorial
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
