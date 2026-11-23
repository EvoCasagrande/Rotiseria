import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../generated/prisma/client.js'

const db = vi.hoisted(() => ({ product: { findMany: vi.fn() }, order: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn() } }))
vi.mock('../src/lib/prisma.js', () => ({ prisma: db }))
vi.mock('../src/config/env.js', () => ({ jwtSecret: 'test-only-secret' }))
import { OrdersService } from '../src/modules/orders/orders.service.js'

const data = { customerName: 'Ana', customerPhone: '123456', orderType: 'PICKUP' as const, items: [{ productId: 'pizza', quantity: 3, expectedUnitPrice: '10.25' }] }
const product = { id: 'pizza', active: true, category: { active: true }, price: new Prisma.Decimal('10.25') }
const service = new OrdersService()
beforeEach(() => { vi.resetAllMocks(); db.product.findMany.mockResolvedValue([product]); db.order.create.mockResolvedValue({ id: 'created' }) })

describe('validacion de pedidos', () => {
  it('calcula el total exacto desde el precio del producto', async () => {
    await service.create(data)
    expect(db.order.create.mock.calls[0][0].data.total.toString()).toBe('30.75')
  })
  it('rechaza categorias inactivas y no crea el pedido', async () => {
    db.product.findMany.mockResolvedValue([{ ...product, category: { active: false } }])
    await expect(service.create(data)).rejects.toMatchObject({ statusCode: 400 })
    expect(db.order.create).not.toHaveBeenCalled()
  })
  it('rechaza precios desactualizados', async () => {
    db.product.findMany.mockResolvedValue([{ ...product, price: new Prisma.Decimal('11.00') }])
    await expect(service.create(data)).rejects.toMatchObject({ statusCode: 409 })
    expect(db.order.create).not.toHaveBeenCalled()
  })
  it('impide reabrir un pedido finalizado', async () => {
    db.order.findUnique.mockResolvedValue({ status: 'COMPLETED' })
    await expect(service.updateStatus('order', { status: 'PREPARING' })).rejects.toMatchObject({ statusCode: 409 })
    expect(db.order.updateMany).not.toHaveBeenCalled()
  })
  it('detecta cambios concurrentes de estado', async () => {
    db.order.findUnique.mockResolvedValue({ status: 'PENDING' })
    db.order.updateMany.mockResolvedValue({ count: 0 })
    await expect(service.updateStatus('order', { status: 'CONFIRMED' })).rejects.toMatchObject({ statusCode: 409 })
  })
  it('reutiliza el resultado de un intento anterior sin crear otro pedido', async () => {
    const request = { ...data, requestId: 'c966fd1f-2fbf-49f2-82ac-3888d05952a3' }
    db.order.findUnique.mockResolvedValueOnce(null)
    await service.create(request)
    const createdData = db.order.create.mock.calls[0][0].data
    db.order.findUnique.mockResolvedValueOnce({ id: 'created', requestKeyHash: createdData.requestKeyHash, requestPayloadHash: createdData.requestPayloadHash, items: [] })
    const result = await service.create(request)
    expect(result).toMatchObject({ id: 'created' })
    expect(result).not.toHaveProperty('requestKeyHash')
    expect(db.order.create).toHaveBeenCalledTimes(1)
  })
  it('no acepta el mismo identificador con datos diferentes', async () => {
    db.order.findUnique.mockResolvedValue({ requestPayloadHash: 'otro', items: [] })
    await expect(service.create({ ...data, requestId: 'c966fd1f-2fbf-49f2-82ac-3888d05952a3' })).rejects.toMatchObject({ statusCode: 409 })
    expect(db.order.create).not.toHaveBeenCalled()
  })
})
