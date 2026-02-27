import { apiFetch } from './client'

export interface Rating {
  id: string
  date: string
  rating: number
}

export interface Stats {
  weekly: { avg: number | null; count: number }
  monthly: { avg: number | null; count: number }
  yearly: { avg: number | null; count: number }
  overall: { avg: number | null; count: number }
}

export function saveRating(date: string, rating: number) {
  return apiFetch<Rating>('/api/ratings', {
    method: 'POST',
    body: JSON.stringify({ date, rating }),
  })
}

export function listRatings() {
  return apiFetch<Rating[]>('/api/ratings')
}

export function getStats() {
  return apiFetch<Stats>('/api/ratings/stats')
}
