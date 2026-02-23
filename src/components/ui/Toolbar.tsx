// src/components/ui/Toolbar.tsx
// Placeholder para a barra de ferramentas 2D
// Será implementado com botões para: Select, Move, Rotate, Pour, Heat

export default function Toolbar() {
    return (
        <div className="toolbar">
            <button className="toolbar-button active" title="Selecionar">
                🖱️
            </button>
            <button className="toolbar-button" title="Mover">
                ✋
            </button>
            <button className="toolbar-button" title="Rotacionar">
                🔄
            </button>
            <button className="toolbar-button" title="Despejar">
                💧
            </button>
            <button className="toolbar-button" title="Aquecer">
                🔥
            </button>
        </div>
    )
}
