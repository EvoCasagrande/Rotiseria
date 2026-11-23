import type { OrderGetPayload } from "../../../generated/prisma/models.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { createHash, createHmac } from 'node:crypto';
import type { CreateOrderInput, OrderQueryInput, UpdateOrderStatusInput } from "./orders.schema.js";

type OrderWithProducts = OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
}>

export class OrdersService {
  getAll = async (query: OrderQueryInput): Promise<OrderWithProducts[]> => {
    return prisma.order.findMany({
      where: {    
        status: query.status,
        orderType: query.orderType,
        ...((query.from || query.to) && { createdAt: { ...(query.from && { gte: new Date(query.from) }), ...(query.to && { lt: new Date(query.to) }) } }),
        ...(query.search && {
          OR: [
            { id: { contains: query.search, mode: 'insensitive' as const } },
            {
              customerName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
              }
            },
            {
              customerPhone: {
                  contains: query.search,
                  mode: 'insensitive' as const,
              }
            }
          ]
        })
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  };

  getById = async (orderId: string): Promise<OrderWithProducts | null> => {
    return prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  };

  create = async (data: CreateOrderInput): Promise<Omit<OrderWithProducts, 'requestKeyHash' | 'requestPayloadHash'>> => {
    const { requestId, ...orderData } = data
    const requestKeyHash = requestId ? createHash('sha256').update(requestId).digest('hex') : undefined
    const requestPayloadHash = requestId ? createHmac('sha256', requestId).update(JSON.stringify(orderData)).digest('hex') : undefined
    const include = { items: { include: { product: true as const } } }
    const stripHashes = ({ requestKeyHash: _key, requestPayloadHash: _payload, ...order }: OrderWithProducts) => order
    const existingOrder = async () => {
      if (!requestKeyHash) return null
      const order = await prisma.order.findUnique({ where: { requestKeyHash }, include })
      if (order && order.requestPayloadHash !== requestPayloadHash) throw new AppError('El identificador del pedido ya fue utilizado con otros datos', 409)
      return order ? stripHashes(order) : null
    }
    const existing = await existingOrder()
    if (existing) return existing
    const productIds = data.items.map((item) => item.productId)

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds
            }
        },
        include: { category: true },
    })

    const orderItems = data.items.map((item) => {
        const product = products.find((product) => product.id === item.productId)

        if (!product) {
            throw new AppError('Producto no encontrado', 404)
        }

        if (!product.active || !product.category.active) {
          throw new AppError('Producto no disponible', 400)
        }

        if (item.expectedUnitPrice !== undefined && !product.price.equals(new Prisma.Decimal(item.expectedUnitPrice))) {
          throw new AppError('El precio de un producto cambio. Revisa tu pedido antes de confirmar.', 409)
        }

        return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
        }
    })

    const total = orderItems.reduce((sum, item) => sum.plus(item.unitPrice.mul(item.quantity)), new Prisma.Decimal(0))
    if (total.greaterThan('99999999.99')) throw new AppError('El importe del pedido supera el limite permitido', 400)

    try {
      const created = await prisma.order.create({
        data: {
            requestKeyHash,
            requestPayloadHash,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            orderType: data.orderType,
            address: data.address,
            notes: data.notes,
            total,
            items: {
                create: orderItems
            }
        },
        include,
      })
      return stripHashes(created)
    } catch (error) {
      if (requestKeyHash && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await existingOrder()
        if (existing) return existing
      }
      throw error
    }
  };

  updateStatus = async (orderId: string, data: UpdateOrderStatusInput): Promise<OrderWithProducts> => {
    const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
    if (!current) throw new AppError('Pedido no encontrado', 404)
    if ((current.status === 'COMPLETED' || current.status === 'CANCELLED') && current.status !== data.status) {
      throw new AppError('Un pedido finalizado o cancelado no puede cambiar de estado', 409)
    }
    const updated = await prisma.order.updateMany({
      where: { id: orderId, status: current.status },
      data: { status: data.status },
    })
    if (!updated.count) throw new AppError('El pedido cambio en otra sesion. Actualiza la lista.', 409)
    return prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
  };
}
