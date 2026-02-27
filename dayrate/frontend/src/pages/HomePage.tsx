import { useEffect, useState } from 'react'
import { getRatingColor, getRatingLabel } from '../components/RatingColor'
import RatingInput from '../components/RatingInput'
import * as ratingsApi from '../api/ratings'
import { useAuth } from '../hooks/useAuth'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function pastDates(n: number): string[] {
  const dates: string[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function HomePage() {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<ratingsApi.Rating[]>([])
  const [stats, setStats] = useState<ratingsApi.Stats | null>(null)
  const [pastDateInput, setPastDateInput] = useState('')
  const [loading, setLoading] = useState(true)

  const today = todayStr()
  const todayRating = ratings.find((r) => r.date === today)

  useEffect(() => {
    Promise.all([ratingsApi.listRatings(), ratingsApi.getStats()])
      .then(([r, s]) => {
        setRatings(r)
        setStats(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveToday(rating: number) {
    const saved = await ratingsApi.saveRating(today, rating)
    setRatings((prev) => [saved, ...prev])
    const s = await ratingsApi.getStats()
    setStats(s)
  }

  async function handleSavePast(date: string, rating: number) {
    const saved = await ratingsApi.saveRating(date, rating)
    setRatings((prev) => {
      const next = prev.filter((r) => r.date !== date)
      return [saved, ...next].sort((a, b) => b.date.localeCompare(a.date))
    })
    const s = await ratingsApi.getStats()
    setStats(s)
  }

  const last7 = ratings.slice(0, 7)
  const pastUnrated = pastDates(30).filter((d) => !ratings.find((r) => r.date === d))

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h2 className="text-xl font-bold text-white">
          Olá, {user?.name.split(' ')[0]} 👋
        </h2>
      </div>

      {/* Today's rating */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {todayRating ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Nota de hoje</p>
            <span
              className="text-7xl font-bold"
              style={{ color: getRatingColor(todayRating.rating) }}
            >
              {todayRating.rating.toFixed(1)}
            </span>
            <span className="text-sm font-medium" style={{ color: getRatingColor(todayRating.rating) }}>
              {getRatingLabel(todayRating.rating)}
            </span>
          </div>
        ) : (
          <RatingInput onSubmit={handleSaveToday} />
        )}
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
              <p className="text-[10px] text-gray-600">{data.count} dias</p>
            </div>
          ))}
        </div>
      )}

      {/* Last 7 days */}
      {last7.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Últimos 7 dias
          </p>
          <div className="flex flex-col gap-2">
            {last7.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{formatDate(r.date)}</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: getRatingColor(r.rating) }}
                >
                  {r.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate past days */}
      {!loading && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dias anteriores sem nota
          </p>
          {pastUnrated.length === 0 ? (
            <p className="text-sm text-gray-600">Tudo em dia! 🎉</p>
          ) : (
            <div className="flex flex-col gap-3">
              <select
                value={pastDateInput}
                onChange={(e) => setPastDateInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
              >
                <option value="">Selecionar dia...</option>
                {pastUnrated.slice(0, 30).map((d) => (
                  <option key={d} value={d}>
                    {formatDate(d)}
                  </option>
                ))}
              </select>
              {pastDateInput && (
                <RatingInput
                  key={pastDateInput}
                  label={`Nota para ${formatDate(pastDateInput)}`}
                  onSubmit={(r) => handleSavePast(pastDateInput, r).then(() => setPastDateInput(''))}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
