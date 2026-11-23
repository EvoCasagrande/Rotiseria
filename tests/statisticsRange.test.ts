import { describe, expect, it } from 'vitest'
import { percentChange, statisticsRange } from '../client/src/statisticsRange'

describe('rangos y comparaciones de estadísticas', () => {
  it('compara hoy hasta la misma hora del día anterior', () => {
    const now = new Date(2026, 10, 23, 15, 30)
    const range = statisticsRange('1', '', '', now)
    expect(range.from).toEqual(new Date(2026, 10, 23))
    expect(range.previousFrom).toEqual(new Date(2026, 10, 22))
    expect(range.previousTo).toEqual(new Date(2026, 10, 22, 15, 30))
  })
  it('usa rangos personalizados inclusivos y un período anterior igual', () => {
    const range = statisticsRange('custom', '2026-11-10', '2026-11-12', new Date(2026, 10, 23, 15))
    expect(range.from).toEqual(new Date(2026, 10, 10))
    expect(range.to).toEqual(new Date(2026, 10, 13))
    expect(range.previousFrom).toEqual(new Date(2026, 10, 7))
    expect(range.previousTo).toEqual(new Date(2026, 10, 10))
  })
  it('rechaza rangos inválidos o futuros', () => {
    const now = new Date(2026, 10, 23, 15)
    expect(() => statisticsRange('custom', '2026-11-24', '2026-11-25', now)).toThrow()
    expect(() => statisticsRange('custom', '2026-11-20', '2026-11-19', now)).toThrow()
  })
  it('no inventa variaciones porcentuales con base cero', () => {
    expect(percentChange(10, 0)).toBe('Sin datos previos para comparar')
    expect(percentChange(0, 0)).toBe('Sin cambios')
    expect(percentChange(15, 10)).toContain('+50%')
    expect(percentChange(5, 10)).toContain('-50%')
  })
})
