import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import type { OrderQueryInput } from './orders.schema.js'

type StatisticsOrder = {
  status: string
  orderType: string
  total: Prisma.Decimal
  createdAt: Date
  items: { productId: string; quantity: number; unitPrice: Prisma.Decimal; product: { name: string } }[]
}

export function summarizeOrders(orders: StatisticsOrder[], timeZone: string) {
  const completed = orders.filter((order) => order.status === 'COMPLETED')
  const total = completed.reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0))
  const products = new Map<string, { id: string; name: string; quantity: number; total: Prisma.Decimal }>()
  const days = new Map<string, { date: string; count: number; total: Prisma.Decimal }>()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  for (const order of completed) {
    for (const item of order.items) {
      const current = products.get(item.productId) ?? { id: item.productId, name: item.product.name, quantity: 0, total: new Prisma.Decimal(0) }
      current.quantity += item.quantity
      current.total = current.total.plus(item.unitPrice.mul(item.quantity))
      products.set(item.productId, current)
    }
    const parts = formatter.formatToParts(order.createdAt)
    const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
    const date = `${value('year')}-${value('month')}-${value('day')}`
    const day = days.get(date) ?? { date, count: 0, total: new Prisma.Decimal(0) }
    day.count++
    day.total = day.total.plus(order.total)
    days.set(date, day)
  }
  return {
    count: orders.length,
    completed: completed.length,
    cancelled: orders.filter((order) => order.status === 'CANCELLED').length,
    active: orders.filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED').length,
    delivery: orders.filter((order) => order.orderType === 'DELIVERY').length,
    pickup: orders.filter((order) => order.orderType === 'PICKUP').length,
    total: total.toString(),
    average: completed.length ? total.div(completed.length).toDecimalPlaces(2).toString() : '0',
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)).slice(0, 10).map((product) => ({ ...product, total: product.total.toString() })),
    days: [...days.values()].sort((a, b) => b.date.localeCompare(a.date)).map((day) => ({ ...day, total: day.total.toString() })),
  }
}

export async function getStatistics(query: OrderQueryInput, timeZone: string) {
  const orders = await prisma.order.findMany({
    where: { ...((query.from || query.to) && { createdAt: { ...(query.from && { gte: new Date(query.from) }), ...(query.to && { lt: new Date(query.to) }) } }) },
    select: { status: true, orderType: true, total: true, createdAt: true, items: { select: { productId: true, quantity: true, unitPrice: true, product: { select: { name: true } } } } },
  })
  return summarizeOrders(orders, timeZone)
}
