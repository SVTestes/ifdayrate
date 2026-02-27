const API_URL = import.meta.env.VITE_API_URL || ''

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && !skipAuth) {
    // Try to refresh
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retry = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: 'Request failed' }))
        throw new ApiError(retry.status, err.error || 'Request failed')
      }
      return retry.json()
    } else {
      throw new ApiError(401, 'Session expired')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(res.status, err.error || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const data = await res.json()
    setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
