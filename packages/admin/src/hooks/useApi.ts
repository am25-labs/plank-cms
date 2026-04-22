import { useState } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null })

  async function request(url: string, method: Method, body?: unknown): Promise<T> {
    setState({ data: null, loading: true, error: null })

    const token = localStorage.getItem('plank_token')

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        let message: string
        try {
          const json = JSON.parse(text) as {
            message?: string
            errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
          }
          if (json.message) {
            message = json.message
          } else if (json.errors) {
            const fieldMsgs = Object.values(json.errors.fieldErrors ?? {}).flat()
            const formMsgs = json.errors.formErrors ?? []
            const all = [...formMsgs, ...fieldMsgs]
            message = all.length ? all.join(' · ') : 'Something went wrong.'
          } else {
            message = 'Something went wrong.'
          }
        } catch {
          message = 'Something went wrong.'
        }
        throw new Error(message)
      }

      const data = res.status === 204 ? (null as T) : ((await res.json()) as T)
      setState({ data, loading: false, error: null })
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }

  return { ...state, request }
}
