import type { PokemonEvolutionNode } from './types'

interface Props {
  evolutions: PokemonEvolutionNode[]
}

export default function PokemonEvolutionChain({ evolutions }: Props) {
  if (!evolutions.length) return <p>-</p>
  return (
    <div className="pd-evolution-list">
      {evolutions.map((evo, index) => (
        <div className="pd-evo-step" key={`${evo.id}-${index}`}>
          <div className="pd-evo-card">
            <img src={evo.image} alt={evo.name} />
            <span>{evo.name}</span>
          </div>
          {index < evolutions.length - 1 ? <span className="pd-evo-arrow">+</span> : null}
        </div>
      ))}
    </div>
  )
}
