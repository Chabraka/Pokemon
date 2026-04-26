import type { PokemonStat } from './types'

interface Props {
  stats: PokemonStat[]
}

function statRange(base: number, level: number, isHp: boolean): [number, number] {
  if (isHp) {
    const min = Math.floor(((2 * base) * level) / 100) + level + 10
    const max = Math.floor(((2 * base + 31 + 63) * level) / 100) + level + 10
    return [min, max]
  }
  const coreMin = Math.floor(((2 * base) * level) / 100) + 5
  const coreMax = Math.floor(((2 * base + 31 + 63) * level) / 100) + 5
  return [Math.floor(coreMin * 0.9), Math.floor(coreMax * 1.1)]
}

function colorForStat(statKey: PokemonStat['key']): string {
  const map: Record<PokemonStat['key'], string> = {
    hp: '#22c55e',
    attack: '#f97316',
    defense: '#eab308',
    'special-attack': '#3b82f6',
    'special-defense': '#a855f7',
    speed: '#ec4899',
  }
  return map[statKey]
}

export default function PokemonStats({ stats }: Props) {
  const total = stats.reduce((sum, stat) => sum + stat.value, 0)
  return (
    <div className="pd-stats-table">
      {stats.map((stat) => {
        const [min50, max50] = statRange(stat.value, 50, stat.key === 'hp')
        const [min100, max100] = statRange(stat.value, 100, stat.key === 'hp')
        return (
          <div key={stat.key} className="pd-stat-row">
            <span className="pd-stat-name">{stat.label}</span>
            <span className="pd-stat-bar">
              <span
                className="pd-stat-fill"
                style={{ width: `${Math.min(100, (stat.value / 180) * 100)}%`, backgroundColor: colorForStat(stat.key) }}
              />
            </span>
            <strong className="pd-stat-value">{stat.value}</strong>
            <span className="pd-stat-range">Niv.50: {min50}-{max50}</span>
            <span className="pd-stat-range">Niv.100: {min100}-{max100}</span>
          </div>
        )
      })}
      <div className="pd-stat-row pd-stat-row--total">
        <span className="pd-stat-name">Total</span>
        <span />
        <strong className="pd-stat-value">{total}</strong>
        <span />
        <span />
      </div>
    </div>
  )
}
