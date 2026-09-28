import type { OrderGetPayload } from "../../../generated/prisma/models.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
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
        ...(query.search && {
          OR: [
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

  create = async (data: CreateOrderInput): Promise<OrderWithProducts> => {
    const productIds = data.items.map((item) => item.productId)

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds
            }
        }
    })

    const orderItems = data.items.map((item) => {
        const product = products.find((product) => product.id === item.productId)

        if (!product) {
            throw new AppError('Producto no encontrado', 404)
        }

        if (!product.active) {
          throw new AppError('Producto no disponible', 400)
        }

        return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
        }
    })

    const total = orderItems.reduce((sum, item) => {
        return sum + Number(item.unitPrice) * item.quantity
    }, 0)

    return prisma.order.create({
        data: {
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
        include: {
          items: {
            include: {
              product: true
        }
    }
}
    })
  };

  updateStatus = async (orderId: string, data: UpdateOrderStatusInput): Promise<OrderWithProducts> => {
    return prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status: data.status
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
}
