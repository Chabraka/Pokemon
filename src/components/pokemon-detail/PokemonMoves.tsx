import { useState } from 'react'

interface Props {
  moves: string[]
}

export default function PokemonMoves({ moves }: Props) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? moves : moves.slice(0, 16)
  return (
    <div>
      <div className="pd-move-list">
        {shown.map((move) => (
          <span key={move} className="pd-move-chip">
            {move}
          </span>
        ))}
      </div>
      {moves.length > 16 ? (
        <button className="pd-link-btn" type="button" onClick={() => setExpanded((x) => !x)}>
          {expanded ? 'Voir moins de capacites' : `Voir toutes les capacites (${moves.length})`}
        </button>
      ) : null}
    </div>
  )
}
