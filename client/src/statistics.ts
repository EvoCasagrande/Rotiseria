import type { Order } from './types'

export type StatisticsPeriod = '7' | '30' | 'all'

export function calculateStatistics(orders: Order[], period: StatisticsPeriod, now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (period !== 'all') start.setDate(start.getDate() - (Number(period) - 1))
  const selected = orders.filter((order) => {
    const date = new Date(order.createdAt)
    return !Number.isNaN(date.getTime()) && date <= now && (period === 'all' || date >= start)
  })
  const completed = selected.filter((order) => order.status === 'COMPLETED')
  const total = completed.reduce((sum, order) => sum + Number(order.total), 0)
  const productMap = new Map<string, { id: string; name: string; quantity: number; total: number }>()
  for (const order of completed) for (const item of order.items) {
    const current = productMap.get(item.product.id) ?? { id: item.product.id, name: item.product.name, quantity: 0, total: 0 }
    current.quantity += item.quantity
    current.total += Number(item.unitPrice) * item.quantity
    productMap.set(item.product.id, current)
  }
  const byDay = new Map<string, { date: string; count: number; total: number }>()
  for (const order of completed) {
    const d = new Date(order.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = byDay.get(key) ?? { date: key, count: 0, total: 0 }
    day.count += 1
    day.total += Number(order.total)
    byDay.set(key, day)
  }
  return {
    count: selected.length,
    completed: completed.length,
    cancelled: selected.filter((order) => order.status === 'CANCELLED').length,
    active: selected.filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED').length,
    delivery: selected.filter((order) => order.orderType === 'DELIVERY').length,
    pickup: selected.filter((order) => order.orderType === 'PICKUP').length,
    total,
    average: completed.length ? total / completed.length : 0,
    products: [...productMap.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)).slice(0, 10),
    days: [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)),
  }
}
