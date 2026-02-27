import { useEffect, useState } from 'react'
import { getRatingColor } from '../components/RatingColor'
import * as ratingsApi from '../api/ratings'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [ratings, setRatings] = useState<Map<string, number>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    ratingsApi.listRatings().then((list) => {
      const map = new Map(list.map((r) => [r.date, r.rating]))
      setRatings(map)
    }).catch(() => {})
  }, [])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const now2 = new Date()
    if (year > now2.getFullYear() || (year === now2.getFullYear() && month >= now2.getMonth())) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const days = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedRating = selected ? ratings.get(selected) : undefined

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h2 className="text-xl font-bold">Calendário</h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1 text-gray-400 hover:text-white transition"
        >
          ←
        </button>
        <span className="font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1 text-gray-400 hover:text-white transition"
        >
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-600 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />
            const ds = dateStr(day)
            const rating = ratings.get(ds)
            const isToday = ds === today
            const isFuture = ds > today
            const isSelected = ds === selected

            return (
              <button
                key={ds}
                onClick={() => !isFuture && setSelected(isSelected ? null : ds)}
                disabled={isFuture}
                className="aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition"
                style={{
                  background: isSelected
                    ? '#1e1e40'
                    : rating !== undefined
                    ? `${getRatingColor(rating)}22`
                    : 'transparent',
                  color: rating !== undefined
                    ? getRatingColor(rating)
                    : isFuture
                    ? '#2d2d4a'
                    : isToday
                    ? '#a78bfa'
                    : '#9ca3af',
                  border: isToday ? '1px solid #7c3aed' : '1px solid transparent',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-gray-500">
            {new Date(selected + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          {selectedRating !== undefined ? (
            <div className="mt-2 flex items-center gap-3">
              <span
                className="text-4xl font-bold"
                style={{ color: getRatingColor(selectedRating) }}
              >
                {selectedRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Sem nota para este dia</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Legenda</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['10', '#0ea5e9'],
            ['8–9.9', '#16a34a'],
            ['6–7.9', '#4ade80'],
            ['5–5.9', '#eab308'],
            ['4–4.9', '#ef4444'],
            ['0–3.9', '#7c3aed'],
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-[11px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
