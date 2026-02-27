import { useEffect, useState } from 'react'
import { getRatingColor } from '../components/RatingColor'
import * as groupsApi from '../api/groups'

export default function GroupsPage() {
  const [groups, setGroups] = useState<groupsApi.Group[]>([])
  const [selected, setSelected] = useState<groupsApi.GroupDetail | null>(null)
  const [mode, setMode] = useState<'list' | 'create' | 'join' | 'detail'>('list')
  const [newName, setNewName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    groupsApi.listGroups().then(setGroups).catch(() => {})
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    setLoading(true)
    try {
      const g = await groupsApi.createGroup(newName.trim())
      setGroups((prev) => [{ ...g, memberCount: 1 }, ...prev])
      setNewName('')
      setMode('list')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setError('')
    setLoading(true)
    try {
      await groupsApi.joinGroup(inviteCode.trim())
      const updated = await groupsApi.listGroups()
      setGroups(updated)
      setInviteCode('')
      setMode('list')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  async function openDetail(id: string) {
    setLoading(true)
    try {
      const detail = await groupsApi.getGroupDetail(id)
      setSelected(detail)
      setMode('detail')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (mode === 'detail' && selected) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('list')} className="text-violet-400 hover:text-violet-300">
            ← Voltar
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-lg font-bold">{selected.name}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-bg p-3">
              <p className="text-[10px] text-gray-500 uppercase">Média hoje</p>
              {selected.todayGroupAvg !== null ? (
                <p className="text-2xl font-bold" style={{ color: getRatingColor(selected.todayGroupAvg) }}>
                  {selected.todayGroupAvg.toFixed(1)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-600">—</p>
              )}
            </div>
            <div className="rounded-xl bg-bg p-3">
              <p className="text-[10px] text-gray-500 uppercase">Média geral</p>
              {selected.overallGroupAvg !== null ? (
                <p className="text-2xl font-bold" style={{ color: getRatingColor(selected.overallGroupAvg) }}>
                  {selected.overallGroupAvg.toFixed(1)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-600">—</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-bg px-3 py-2">
            <div>
              <p className="text-[10px] text-gray-500">Código de convite</p>
              <p className="font-mono text-xs text-gray-400">{selected.inviteCode}</p>
            </div>
            <button
              onClick={() => copyCode(selected.inviteCode)}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Membros ({selected.members.length})
          </p>
          <div className="flex flex-col gap-3">
            {selected.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: '#1e1e40' }}
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.overallAvg !== null && (
                      <p className="text-[10px] text-gray-500">
                        Média: <span style={{ color: getRatingColor(m.overallAvg) }}>{m.overallAvg.toFixed(1)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {m.todayRating !== null ? (
                    <span
                      className="text-lg font-bold"
                      style={{ color: getRatingColor(m.todayRating) }}
                    >
                      {m.todayRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">—</span>
                  )}
                  <p className="text-[9px] text-gray-600">hoje</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Grupos</h2>
        {mode === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('join'); setError('') }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('create'); setError('') }}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
            >
              + Criar
            </button>
          </div>
        )}
        {mode !== 'list' && (
          <button onClick={() => { setMode('list'); setError('') }} className="text-xs text-gray-500">
            Cancelar
          </button>
        )}
      </div>

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Criar novo grupo</p>
          <input
            type="text"
            placeholder="Nome do grupo"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar grupo'}
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Entrar com código de convite</p>
          <input
            type="text"
            placeholder="Cole o código aqui"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 font-mono"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no grupo'}
          </button>
        </form>
      )}

      {groups.length === 0 && mode === 'list' && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-gray-500 text-sm">Você não está em nenhum grupo</p>
          <p className="text-xs text-gray-600 mt-1">Crie um ou entre com um código de convite</p>
        </div>
      )}

      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => openDetail(g.id)}
          className="w-full rounded-2xl border border-border bg-card p-4 text-left hover:border-violet-800 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{g.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.memberCount} membro{g.memberCount !== 1 ? 's' : ''}</p>
            </div>
            <span className="text-gray-500">›</span>
          </div>
        </button>
      ))}
    </div>
  )
}
