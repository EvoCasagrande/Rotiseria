import { describe, expect, it } from 'vitest'
import { calculateStatistics } from '../client/src/statistics'
import type { Order } from '../client/src/types'

const makeOrder = (id: string, status: Order['status'], date: string, total: string, quantity = 1): Order => ({
  id, status, createdAt: date, total, customerName: 'Test', customerPhone: '123456', address: null, notes: null,
  orderType: 'PICKUP', items: [{ id, quantity, unitPrice: '100', product: { id: 'p', name: 'Pizza' } }],
})

describe('estadisticas de pedidos', () => {
  it('cuenta todos los estados pero suma solo completados y sus precios historicos', () => {
    const orders = [makeOrder('a', 'COMPLETED', '2026-11-23T12:00:00', '200', 2), makeOrder('b', 'CANCELLED', '2026-11-23T13:00:00', '900'), makeOrder('c', 'PENDING', '2026-11-23T14:00:00', '500')]
    const result = calculateStatistics(orders, '30', new Date('2026-11-23T20:00:00'))
    expect(result).toMatchObject({ count: 3, completed: 1, cancelled: 1, active: 1, total: 200, average: 200, pickup: 3 })
    expect(result.products).toEqual([{ id: 'p', name: 'Pizza', quantity: 2, total: 200 }])
  })
  it('limita el rango por dias locales e ignora fechas futuras', () => {
    const orders = [makeOrder('a', 'COMPLETED', '2026-11-17T00:00:00', '100'), makeOrder('b', 'COMPLETED', '2026-11-16T23:59:59', '100'), makeOrder('c', 'COMPLETED', '2026-11-24T00:00:00', '100')]
    expect(calculateStatistics(orders, '7', new Date('2026-11-23T20:00:00')).count).toBe(1)
    expect(calculateStatistics([], 'all').average).toBe(0)
  })
})
