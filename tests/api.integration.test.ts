import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Server } from 'node:http'
import { Prisma } from '../generated/prisma/client.js'
import bcrypt from 'bcryptjs'

const db = vi.hoisted(() => ({ adminUser: { findUnique: vi.fn(), updateMany: vi.fn() }, product: { findMany: vi.fn() }, category: { findMany: vi.fn() }, order: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() } }))
vi.mock('../src/config/env.js', () => ({ jwtSecret: 'test-only-secret', databaseUrl: 'postgresql://localhost/test', port: 3000 }))
vi.mock('../src/lib/prisma.js', () => ({ prisma: db }))
import app from '../src/app.js'
let server: Server
let base: string
beforeAll(async () => { await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', resolve) }); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No se pudo iniciar servidor de prueba'); base = `http://127.0.0.1:${address.port}` })
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) })
describe('API HTTP aislada', () => {
  it('responde al control de salud', async () => { expect((await fetch(`${base}/api/health`)).status).toBe(200) })
  it('exige autenticacion para consultar pedidos', async () => { expect((await fetch(`${base}/api/orders`)).status).toBe(401) })
  it('rechaza un pedido invalido sin acceder a la base', async () => {
    const result = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) })
    expect(result.status).toBe(400)
  })
  it('crea un pedido valido con el importe calculado por el servidor', async () => {
    db.product.findMany.mockResolvedValue([{ id: 'p', active: true, category: { active: true }, price: new Prisma.Decimal('10.25') }])
    db.order.create.mockImplementation(async ({ data }) => ({ id: 'test', total: data.total.toString() }))
    const result = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: 'Ana', customerPhone: '123456', orderType: 'PICKUP', items: [{ productId: 'p', quantity: 3, expectedUnitPrice: '10.25' }] }) })
    expect(result.status).toBe(201)
    expect(await result.json()).toMatchObject({ order: { total: '30.75' } })
  })
  it('invalida la sesion anterior al cambiar la contrasena', async () => {
    const admin = { id: 'admin-id', name: 'Admin', email: 'admin@example.com', active: true, tokenVersion: 0, passwordHash: await bcrypt.hash('Anterior123', 4) }
    db.adminUser.findUnique.mockImplementation(async () => ({ ...admin }))
    db.adminUser.updateMany.mockImplementation(async ({ data }) => { admin.passwordHash = data.passwordHash; admin.tokenVersion++; return { count: 1 } })
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'Anterior123' }) })
    expect(login.status).toBe(200)
    const { token } = await login.json() as { token: string }
    const result = await fetch(`${base}/api/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: 'Anterior123', newPassword: 'NuevaClave123' }) })
    expect(result.status).toBe(200)
    const oldSession = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    expect(oldSession.status).toBe(401)
    const newLogin = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'NuevaClave123' }) })
    expect(newLogin.status).toBe(200)
  })
  it('reintenta un pedido sin crear un duplicado', async () => {
    db.order.create.mockClear()
    let stored: Record<string, unknown> | null = null
    db.product.findMany.mockResolvedValue([{ id: 'p', active: true, category: { active: true }, price: new Prisma.Decimal('10.25') }])
    db.order.findUnique.mockImplementation(async () => stored)
    db.order.create.mockImplementation(async ({ data }) => { stored = { id: 'retry-test', requestKeyHash: data.requestKeyHash, requestPayloadHash: data.requestPayloadHash, total: data.total.toString(), items: [] }; return stored })
    const payload = { customerName: 'Ana', customerPhone: '123456', orderType: 'PICKUP', requestId: 'c966fd1f-2fbf-49f2-82ac-3888d05952a3', items: [{ productId: 'p', quantity: 1, expectedUnitPrice: '10.25' }] }
    const send = () => fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const first = await send(); const second = await send()
    expect(first.status).toBe(201); expect(second.status).toBe(201)
    expect(await second.json()).toMatchObject({ order: { id: 'retry-test' } })
    expect(db.order.create).toHaveBeenCalledTimes(1)
  })
})
