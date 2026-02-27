import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) { setError('Nome é obrigatório'); setLoading(false); return }
        await register(name, email, password)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-app">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            DayRate
          </h1>
          <p className="mt-1 text-sm text-gray-500">Avalie seu dia, todo dia</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition"
              style={{
                background: mode === m ? '#1e1e40' : 'transparent',
                color: mode === m ? '#fff' : '#6b7280',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
          />

          {error && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
