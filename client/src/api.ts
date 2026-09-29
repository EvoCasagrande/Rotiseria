import type { ApiError } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export function apiPath(path: string) {
  return `${API_BASE_URL}${path}`
}

export async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiError
    return data.message ?? 'Ocurrio un error inesperado'
  } catch {
    return 'Ocurrio un error inesperado'
  }
}
