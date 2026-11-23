import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { rateLimit } from '../src/middlewares/rateLimit.js'

afterEach(() => vi.useRealTimers())
describe('limite de solicitudes', () => {
  it('bloquea luego del limite y permite otra vez al vencer la ventana', () => {
    vi.useFakeTimers(); vi.setSystemTime(1000)
    const middleware = rateLimit(2, 10000)
    const req = { ip: 'test-ip' } as Request
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
    const next = vi.fn() as NextFunction
    middleware(req, res, next); middleware(req, res, next); middleware(req, res, next)
    expect(next).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 10)
    vi.setSystemTime(11001); middleware(req, res, next)
    expect(next).toHaveBeenCalledTimes(3)
  })
})
