import z from 'zod'

const categoryBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "El nombre no puede superar los 50 caracteres"),
})

const categoryParamsSchema = z.object({
    id: z.string().min(1, "El id es obligatorio"),
});

export const getCategoriesSchema = z.object({
    query: z.object({
        active: z
        .enum(["true", "false"])
        .transform((value) => value === 'true')
        .optional(),

        search: z
        .string()
        .trim()
        .optional(),
    }),
});

export const getByIdCategorySchema = z.object({
    params: categoryParamsSchema,
});

export const createCategorySchema = z.object({
    body: categoryBodySchema
})

export const updateCategorySchema = z.object({
    params: categoryParamsSchema,
    body: categoryBodySchema
});

export const deactivateCategorySchema = z.object({
    params: categoryParamsSchema,
});

export type CategoriesQueryInput = z.infer<typeof getCategoriesSchema>['query']
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body']
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body']
