import { useState, useEffect, useCallback } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null })

  const token = localStorage.getItem('plank_token')

  const run = useCallback(() => {
    setState({ data: null, loading: true, error: null })

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }

    fetch(url, { ...options, headers })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<T>
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ data: null, loading: false, error: message })
      })
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run()
  }, [run])

  return { ...state, refetch: run }
}
