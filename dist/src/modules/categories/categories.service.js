import { prisma } from "../../lib/prisma.js";
export class CategoriesService {
    getAll = (query) => {
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
    };
    getById = (categoryId) => {
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
        });
    };
    create = (data) => {
        return prisma.category.create({ data });
    };
    update = (data, categoryId) => {
        return prisma.category.update({
            where: {
                id: categoryId
            },
            data
        });
    };
    deactivate = (categoryId) => {
        return prisma.category.update({
            data: {
                active: false
            },
            where: {
                id: categoryId
            }
        });
    };
}
//# sourceMappingURL=categories.service.js.map