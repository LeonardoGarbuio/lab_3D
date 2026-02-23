// src/components/ui/InventoryPanel.tsx
// Placeholder para o painel de inventário
// Mostrará vidrarias disponíveis para arrastar para a cena

export default function InventoryPanel() {
    const items = [
        { id: 'beaker', icon: '🧪', name: 'Béquer' },
        { id: 'test-tube', icon: '🧫', name: 'Tubo' },
        { id: 'flask', icon: '⚗️', name: 'Frasco' },
        { id: 'funnel', icon: '🔻', name: 'Funil' },
        { id: 'burner', icon: '🔥', name: 'Bico' },
        { id: 'tripod', icon: '🔺', name: 'Tripé' },
    ]

    return (
        <div className="inventory-panel">
            <h3>Equipamentos</h3>
            <div className="inventory-grid">
                {items.map((item) => (
                    <div key={item.id} className="inventory-item" title={item.name}>
                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
