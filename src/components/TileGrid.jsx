export default function TileGrid({ items, selected, onSelect, emptyText = 'Keine Einträge' }) {
  if (!items || items.length === 0) {
    return <p className="tile-empty">{emptyText}</p>
  }

  return (
    <div className="tile-grid">
      {items.map(item => (
        <button
          key={item.id}
          className={`tile${selected === item.id ? ' selected' : ''}`}
          style={{ '--tile-color': item.color }}
          onClick={() => onSelect(item.id === selected ? null : item.id)}
        >
          <span className="tile-color-dot" style={{ background: item.color }} />
          <span className="tile-name">{item.name}</span>
        </button>
      ))}
    </div>
  )
}
