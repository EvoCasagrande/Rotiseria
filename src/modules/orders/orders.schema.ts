import z from 'zod'


const orderBodySchema = z.object({
    requestId: z.uuid().optional(),
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
            quantity: z.number().int().positive("La cantidad debe ser mayor a 0").max(999, 'La cantidad maxima por producto es 999'),
            expectedUnitPrice: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/).optional(),
        }))
        .min(1, "El pedido debe tener al menos un producto").max(100, 'El pedido tiene demasiados productos'),
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
        from: z.iso.datetime({ offset: true }).optional(),
        to: z.iso.datetime({ offset: true }).optional(),
    }).refine((query) => !query.from || !query.to || new Date(query.from) < new Date(query.to), { message: 'El rango de fechas no es valido', path: ['to'] }),
});

export const getByIdOrderSchema = z.object({
    params: orderParamsSchema,
});

export const getStatisticsSchema = z.object({
    query: z.object({
        from: z.iso.datetime({ offset: true }).optional(),
        to: z.iso.datetime({ offset: true }).optional(),
        timeZone: z.string().max(100).refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false } }, 'Zona horaria invalida').default('UTC'),
    }).refine((query) => !query.from || !query.to || new Date(query.from) < new Date(query.to), { message: 'El rango de fechas no es valido', path: ['to'] }),
})

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
