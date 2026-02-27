export function getRatingColor(rating: number): string {
  if (rating === 10) return '#0ea5e9'
  if (rating >= 8) return '#16a34a'
  if (rating >= 6) return '#4ade80'
  if (rating >= 5) return '#eab308'
  if (rating >= 4) return '#ef4444'
  return '#7c3aed'
}

export function getRatingLabel(rating: number): string {
  if (rating === 10) return 'Perfeito'
  if (rating >= 8) return 'Ótimo'
  if (rating >= 6) return 'Bom'
  if (rating >= 5) return 'Ok'
  if (rating >= 4) return 'Ruim'
  return 'Péssimo'
}
