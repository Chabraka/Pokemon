import type { PokemonTypeRef } from './types'

interface Props {
  types: PokemonTypeRef[]
  emptyLabel?: string
}

export default function PokemonTypeBadges({ types, emptyLabel = '-' }: Props) {
  if (!types.length) return <span>{emptyLabel}</span>
  return (
    <div className="pd-type-list">
      {types.map((type) => (
        <span key={type.key} className="pd-type-badge" data-type={type.key}>
          {type.label}
        </span>
      ))}
    </div>
  )
}
