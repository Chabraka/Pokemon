import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  className?: string
}

export default function PokemonInfoCard({ title, children, className }: Props) {
  return (
    <section className={`pd-card ${className ?? ''}`.trim()}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}
