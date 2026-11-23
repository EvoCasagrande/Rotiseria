export type Period = '1' | '7' | '30' | 'custom' | 'all'

export const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// Calendar arithmetic keeps local midnight and comparisons correct across DST changes.
export function statisticsRange(period: Period, from: string, to: string, now = new Date()) {
  if (period === 'all') return { from: undefined, to: now, previousFrom: undefined, previousTo: undefined }
  const today = localDate(now)
  if (period === 'custom' && (!from || !to || from > to || to > today)) throw new Error('Selecciona un rango valido hasta hoy.')
  const start = period === 'custom' ? new Date(`${from}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Number(period) - 1))
  const end = period === 'custom' && to !== today ? new Date(`${to}T00:00:00`) : new Date(now)
  if (period === 'custom' && to !== today) end.setDate(end.getDate() + 1)
  // Calendar dates rather than elapsed milliseconds avoid DST affecting the day count.
  const endDay = period === 'custom' ? to : today
  const dayNumber = (date: string) => { const [y, m, d] = date.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000 }
  const days = dayNumber(endDay) - dayNumber(localDate(start)) + 1
  const previousFrom = new Date(start); previousFrom.setDate(previousFrom.getDate() - days)
  const previousTo = new Date(end); previousTo.setDate(previousTo.getDate() - days)
  return { from: start, to: end, previousFrom, previousTo }
}

export function percentChange(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'Sin cambios' : 'Sin datos previos para comparar'
  const value = ((current - previous) / previous) * 100
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value)}% frente al periodo anterior`
}
