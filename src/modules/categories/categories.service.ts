import { prisma } from "../../lib/prisma.js";
import type { CreateCategoryInput, CategoriesQueryInput, UpdateCategoryInput } from "./categories.schema.js";
import type { CategoryModel as Category, CategoryGetPayload } from "../../../generated/prisma/models.js";

type CategoryWithProducts = CategoryGetPayload<{
    include: {
        products: true
    },
}>

type CategoryWithProductsCount = CategoryGetPayload<{
    include: {
        _count: {
            select: {
                products: true
            }
        }
    },
}>

export class CategoriesService {
    getAll = (query: CategoriesQueryInput): Promise<CategoryWithProductsCount[]> => {
        return prisma.category.findMany({
            where: {
                name: {
                    contains: query.search,
                    mode: 'insensitive'
                },
                active: query.active
            },

            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    getById = (categoryId: string): Promise<CategoryWithProducts | null> => {
        return prisma.category.findUnique({
            where: {
                id: categoryId
            },
            include: {
                products: {
                    orderBy: {
                        name: 'asc'
                    }
                }
            }
        })
    }

    create = (data: CreateCategoryInput): Promise<Category> => {
        return prisma.category.create({data})
    }

    update = (data: UpdateCategoryInput, categoryId: string): Promise<Category> => {
        return prisma.category.update({
            where: {
                id: categoryId
            },
            data
        })
    }

    deactivate = (categoryId: string):Promise<Category> => {
        return prisma.category.update({
            data: {
                active: false
            },
            where: {
                id: categoryId
            }
        })
    }
}