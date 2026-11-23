import { describe, expect, it } from 'vitest'
import { createOrderSchema, getOrdersSchema } from '../src/modules/orders/orders.schema.js'

describe('validaciones de API de pedidos', () => {
  it('rechaza envios sin direccion y cantidades invalidas', () => {
    const body = { customerName: 'Ana', customerPhone: '123456', orderType: 'DELIVERY', items: [{ productId: 'p', quantity: 1 }] }
    expect(createOrderSchema.safeParse({ body }).success).toBe(false)
    expect(createOrderSchema.safeParse({ body: { ...body, address: 'Calle 123', items: [{ productId: 'p', quantity: 0 }] } }).success).toBe(false)
    expect(createOrderSchema.safeParse({ body: { ...body, address: 'Calle 123' } }).success).toBe(true)
  })
  it('valida rangos de fechas y precios esperados', () => {
    expect(getOrdersSchema.safeParse({ query: { from: '2026-11-23T03:00:00.000Z', to: '2026-11-22T03:00:00.000Z' } }).success).toBe(false)
    expect(getOrdersSchema.safeParse({ query: { from: '2026-11-22T03:00:00.000Z', to: '2026-11-23T03:00:00.000Z' } }).success).toBe(true)
    expect(createOrderSchema.safeParse({ body: { customerName: 'Ana', customerPhone: '123456', orderType: 'PICKUP', items: [{ productId: 'p', quantity: 1, expectedUnitPrice: '10.123' }] } }).success).toBe(false)
  })
})
