/**
 * Central API client for PAL360.
 * Automatically attaches the JWT token to every request.
 * Stores the token in both localStorage (for JS) and a cookie (for middleware).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Token storage ──────────────────────────────────────────────────────────────

const TOKEN_KEY = 'pal360_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  // Also set a cookie so Next.js middleware can read it
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
}

// ── Fetch wrapper ──────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  auth?: boolean  // set false to skip the Authorization header
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, headers = {}, ...rest } = options

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: reqHeaders,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ── Convenience: build WebSocket URL with token ────────────────────────────────

export function wsUrl(path: string): string {
  const token = getToken() ?? ''
  const base = API_URL.replace(/^http/, 'ws')
  return `${base}${path}?token=${encodeURIComponent(token)}`
}

export { API_URL }
