import { useEffect, useState } from 'react'
import { getRatingColor } from '../components/RatingColor'
import * as ratingsApi from '../api/ratings'
import { useAuth } from '../hooks/useAuth'

const RANGES = [
  { label: '10', min: 10, max: 10, color: '#0ea5e9' },
  { label: '8–9.9', min: 8, max: 9.9, color: '#16a34a' },
  { label: '6–7.9', min: 6, max: 7.9, color: '#4ade80' },
  { label: '5–5.9', min: 5, max: 5.9, color: '#eab308' },
  { label: '4–4.9', min: 4, max: 4.9, color: '#ef4444' },
  { label: '0–3.9', min: 0, max: 3.9, color: '#7c3aed' },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<ratingsApi.Stats | null>(null)
  const [ratings, setRatings] = useState<ratingsApi.Rating[]>([])
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    Promise.all([ratingsApi.getStats(), ratingsApi.listRatings()])
      .then(([s, r]) => {
        setStats(s)
        setRatings(r)
      })
      .catch(() => {})
  }, [])

  const distribution = RANGES.map((range) => {
    const count = ratings.filter(
      (r) => r.rating >= range.min && r.rating <= range.max
    ).length
    const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
    return { ...range, count, pct }
  })

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
        >
          {initial}
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Esta semana', data: stats.weekly },
            { label: 'Este mês', data: stats.monthly },
            { label: 'Este ano', data: stats.yearly },
            { label: 'Geral', data: stats.overall },
          ].map(({ label, data }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-gray-500">{label}</p>
              {data.avg !== null ? (
                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: getRatingColor(data.avg) }}
                >
                  {data.avg.toFixed(1)}
                </p>
              ) : (
                <p className="mt-1 text-xl font-bold text-gray-600">—</p>
              )}
              <p className="text-[10px] text-gray-600">{data.count} dias avaliados</p>
            </div>
          ))}
        </div>
      )}

      {/* Distribution */}
      {ratings.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Distribuição de notas
          </p>
          <div className="flex flex-col gap-2">
            {distribution.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-12 text-right text-[11px] text-gray-400 flex-shrink-0">
                  {d.label}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-bg" style={{ height: 8 }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.pct}%`,
                      background: d.color,
                    }}
                  />
                </div>
                <span className="w-6 text-[11px] text-gray-600 flex-shrink-0">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-2 w-full rounded-xl border border-red-900/50 bg-red-900/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-900/30 transition disabled:opacity-50"
      >
        {loggingOut ? 'Saindo...' : 'Sair da conta'}
      </button>
    </div>
  )
}
