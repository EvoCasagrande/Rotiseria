import z from 'zod'


const orderBodySchema = z.object({
    customerName: z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "El nombre no puede superar los 50 caracteres"),

    customerPhone: z
        .string()
        .trim()
        .min(6, "El telefono debe tener al menos 6 caracteres")
        .max(30, "El telefono no puede superar los 30 caracteres"),

    address: z
        .string()
        .trim()
        .optional(),
    

    notes: z
        .string()
        .trim()
        .max(200, "Las observaciones no pueden superar los 200 caracteres")
        .optional(),

    orderType: z.enum(['DELIVERY','PICKUP']),

    items: z
        .array(z.object({
            productId: z.string().min(1, "El producto es obligatorio"),
            quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
        }))
        .min(1, "El pedido debe tener al menos un producto"),
}).refine(
    (data) => data.orderType !== "DELIVERY" || !!data.address,
    {
        message: "La direccion es obligatoria para pedidos con envio",
        path: ["address"],
    }
)

const orderParamsSchema = z.object({
    id: z.string().min(1, "El id es obligatorio"),
});

export const getOrdersSchema = z.object({
    query: z.object({
        search: z
            .string()
            .trim()
            .optional(),

        status: z
            .enum(["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"])
            .optional(),
        
        orderType: z.enum(["DELIVERY", "PICKUP"]).optional(),
    }),
});

export const getByIdOrderSchema = z.object({
    params: orderParamsSchema,
});

export const createOrderSchema = z.object({
    body: orderBodySchema
})

export const updateOrderStatusSchema = z.object({
    params: orderParamsSchema,
    body: z.object({
        status: z.enum([
            "PENDING",
            "CONFIRMED",
            "PREPARING",
            "READY",
            "COMPLETED",
            "CANCELLED"
        ])
    })
});

export type OrderQueryInput = z.infer<typeof getOrdersSchema>['query']
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body']
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body']
