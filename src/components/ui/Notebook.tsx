// src/components/ui/Notebook.tsx
// Caderno de anotações do laboratório
import { useState } from 'react'
import './Notebook.css'

interface NotebookEntry {
    id: string
    timestamp: Date
    type: 'observation' | 'result' | 'note'
    content: string
}

interface NotebookProps {
    isOpen: boolean
    onClose: () => void
}

export default function Notebook({ isOpen, onClose }: NotebookProps) {
    const [entries, setEntries] = useState<NotebookEntry[]>([
        { id: '1', timestamp: new Date(), type: 'note', content: 'Início do experimento' }
    ])
    const [newNote, setNewNote] = useState('')
    const [noteType, setNoteType] = useState<'observation' | 'result' | 'note'>('note')

    const addEntry = () => {
        if (!newNote.trim()) return

        const entry: NotebookEntry = {
            id: Date.now().toString(),
            timestamp: new Date(),
            type: noteType,
            content: newNote.trim()
        }

        setEntries([entry, ...entries])
        setNewNote('')
    }

    const deleteEntry = (id: string) => {
        setEntries(entries.filter(e => e.id !== id))
    }

    const exportNotes = () => {
        const content = entries
            .map(e => `[${e.timestamp.toLocaleTimeString()}] (${e.type}) ${e.content}`)
            .join('\n')

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'laboratorio-anotacoes.txt'
        a.click()
    }

    if (!isOpen) return null

    return (
        <div className="notebook-overlay" onClick={onClose}>
            <div className="notebook-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2>📓 Caderno de Anotações</h2>

                {/* Novo registro */}
                <div className="new-entry">
                    <div className="type-selector">
                        <button
                            className={noteType === 'observation' ? 'active' : ''}
                            onClick={() => setNoteType('observation')}
                        >
                            👁️ Observação
                        </button>
                        <button
                            className={noteType === 'result' ? 'active' : ''}
                            onClick={() => setNoteType('result')}
                        >
                            📊 Resultado
                        </button>
                        <button
                            className={noteType === 'note' ? 'active' : ''}
                            onClick={() => setNoteType('note')}
                        >
                            📝 Nota
                        </button>
                    </div>

                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Digite sua anotação..."
                        rows={3}
                    />

                    <button className="add-btn" onClick={addEntry}>
                        ➕ Adicionar
                    </button>
                </div>

                {/* Lista de anotações */}
                <div className="entries-list">
                    {entries.length === 0 ? (
                        <p className="empty-msg">Nenhuma anotação ainda</p>
                    ) : (
                        entries.map(entry => (
                            <div key={entry.id} className={`entry ${entry.type}`}>
                                <div className="entry-header">
                                    <span className="entry-type">
                                        {entry.type === 'observation' && '👁️'}
                                        {entry.type === 'result' && '📊'}
                                        {entry.type === 'note' && '📝'}
                                    </span>
                                    <span className="entry-time">
                                        {entry.timestamp.toLocaleTimeString()}
                                    </span>
                                    <button className="delete-btn" onClick={() => deleteEntry(entry.id)}>
                                        🗑️
                                    </button>
                                </div>
                                <p className="entry-content">{entry.content}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Exportar */}
                {entries.length > 0 && (
                    <button className="export-btn" onClick={exportNotes}>
                        💾 Exportar Anotações
                    </button>
                )}
            </div>
        </div>
    )
}
