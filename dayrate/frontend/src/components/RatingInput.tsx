import { useState } from 'react'
import { getRatingColor } from './RatingColor'

interface Props {
  onSubmit: (rating: number) => Promise<void>
  label?: string
}

export default function RatingInput({ onSubmit, label = 'Como foi seu dia?' }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const numVal = parseFloat(value)
  const isValid = value !== '' && !isNaN(numVal) && numVal >= 0 && numVal <= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setError('')
    setLoading(true)
    try {
      await onSubmit(Math.round(numVal * 10) / 10)
      setValue('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar nota')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.0 – 10.0"
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-2xl font-bold text-white placeholder-gray-600 outline-none focus:border-violet-500"
          style={isValid ? { color: getRatingColor(numVal) } : {}}
        />
        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex-shrink-0 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
        >
          {loading ? '...' : 'Salvar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  )
}
