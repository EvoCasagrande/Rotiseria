import type { ProductGetPayload, ProductModel as Product } from "../../../generated/prisma/models.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/AppError.js"
import type { ProductsQueryInput, CreateProductInput, UpdateProductInput } from "./products.schema.js"

type ProductWithCategory = ProductGetPayload<{
    include: {
        category: true
    }
}>

export class ProductsService {
    getAll = async(query: ProductsQueryInput): Promise<ProductWithCategory[]> => {
        return prisma.product.findMany({
            where: {
                name: {
                    contains: query.search,
                    mode: 'insensitive'
                },
                active: query.active,
                categoryId: query.categoryId,
                ...(query.active === true && {
                    category: {
                        active: true
                    }
                })
            },
            include: {
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        })
    }

    getById = async(productId: string): Promise<ProductWithCategory | null>  => {
        return prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                category: true
            }
        })
    }

    create = async(data: CreateProductInput): Promise<ProductWithCategory> => {
        const category = await prisma.category.findUnique({
            where: {
                id: data.categoryId
            }
        })

        if (!category) {
            throw new AppError('Categoria no encontrada', 404)
        }

        return prisma.product.create({
            data,
            include: {
                category: true
            }
        })
    }

    update = async(data: UpdateProductInput, productId: string): Promise<ProductWithCategory> => {
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: {
                    id: data.categoryId
                }
            })

            if (!category) {
                throw new AppError('Categoria no encontrada', 404)
            }
        }

        return prisma.product.update({
            where: {
                id: productId
            },
            data,
            include: {
                category: true
            }
        })
    }

    deactivate = async(productId: string): Promise<Product> => {
        return prisma.product.update({
            where: {
                id: productId
            },
            data: {
                active: false
            }
        })
    }
}
