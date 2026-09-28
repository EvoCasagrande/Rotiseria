import z from 'zod'

const productBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "El nombre no puede superar los 50 caracteres"),

    description: z
        .string()
        .trim()
        .min(2, "La descripcion debe tener al menos 2 caracteres")
        .max(500, "La descripcion no puede superar los 500 caracteres")
        .optional(),

    price: z
        .number()
        .positive("El precio debe ser mayor a 0"),
    
    categoryId: z
        .string()
        .min(1, "La categoria es obligatoria")
})

const productParamsSchema = z.object({
    id: z.string().min(1, "El id es obligatorio"),
});

export const getProductsSchema = z.object({
    query: z.object({
        active: z
            .enum(["true", "false"])
            .transform((value) => value === 'true')
            .optional(),

        search: z
            .string()
            .trim()
            .optional(),

        categoryId: z
            .string()
            .trim()
            .optional()
    }),
});

export const getByIdProductSchema = z.object({
    params: productParamsSchema,
});

export const createProductSchema = z.object({
    body: productBodySchema
})

export const updateProductSchema = z.object({
    params: productParamsSchema,
    body: productBodySchema
        .partial()
        .refine((obj) => Object.values(obj).some((val) => val !== undefined),
        { message: 'Debes modificar al menos un campo' }
    )
});

export const deactivateProductSchema = z.object({
    params: productParamsSchema,
});

export type ProductsQueryInput = z.infer<typeof getProductsSchema>['query']
export type CreateProductInput = z.infer<typeof createProductSchema>['body']
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body']
