import type { RequestHandler } from 'express'

// Limite local por proceso; para varias instancias usar un almacenamiento compartido.
export function rateLimit(maxRequests: number, windowMs: number): RequestHandler {
  const clients = new Map<string, { count: number; expires: number }>()
  return (req, res, next) => {
    const now = Date.now()
    if (clients.size >= 10000) {
      for (const [key, entry] of clients) if (entry.expires <= now) clients.delete(key)
    }
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    let entry = clients.get(key)
    if (!entry || entry.expires <= now) {
      if (clients.size >= 10000) {
        res.status(503).json({ status: 'error', message: 'Servicio temporalmente ocupado. Intenta mas tarde.' })
        return
      }
      entry = { count: 0, expires: now + windowMs }
      clients.set(key, entry)
    }
    entry.count += 1
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.expires - now) / 1000))
      res.status(429).json({ status: 'error', message: 'Demasiados intentos. Intenta mas tarde.' })
      return
    }
    next()
  }
}
