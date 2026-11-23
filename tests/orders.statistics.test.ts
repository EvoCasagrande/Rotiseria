import { describe, expect, it, vi } from 'vitest'
import { Prisma } from '../generated/prisma/client.js'
vi.mock('../src/lib/prisma.js', () => ({ prisma: { order: { findMany: vi.fn() } } }))
import { summarizeOrders } from '../src/modules/orders/orders.statistics.js'

describe('estadisticas del servidor', () => {
  it('agrega precios historicos solo de completados y agrupa en la zona elegida', () => {
    const order = { status: 'COMPLETED', orderType: 'PICKUP', total: new Prisma.Decimal('20.50'), createdAt: new Date('2026-11-23T01:00:00Z'), items: [{ productId: 'p', quantity: 2, unitPrice: new Prisma.Decimal('10.25'), product: { name: 'Pizza' } }] }
    const cancelled = { ...order, status: 'CANCELLED', orderType: 'DELIVERY' }
    const stats = summarizeOrders([order, cancelled], 'America/Argentina/Buenos_Aires')
    expect(stats).toMatchObject({ count: 2, completed: 1, cancelled: 1, total: '20.5', average: '20.5', pickup: 1, delivery: 1 })
    expect(stats.days).toEqual([{ date: '2026-11-22', count: 1, total: '20.5' }])
    expect(stats.products).toEqual([{ id: 'p', name: 'Pizza', quantity: 2, total: '20.5' }])
  })
  it('devuelve ceros para periodos vacios', () => {
    expect(summarizeOrders([], 'UTC')).toMatchObject({ total: '0', average: '0', products: [], days: [] })
  })
})
