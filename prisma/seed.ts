import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"
import { databaseUrl } from "../src/config/env.js"

const adapter = new PrismaPg({
    connectionString: databaseUrl,
})

const prisma = new PrismaClient({ adapter })

const demoCategories = [
    {
        name: "Pizzas",
        products: [
            {
                name: "Pizza muzzarella",
                description: "Salsa de tomate, muzzarella y oregano.",
                price: 8500,
            },
            {
                name: "Pizza napolitana",
                description: "Muzzarella, tomate fresco, ajo y oregano.",
                price: 9800,
            },
        ],
    },
    {
        name: "Empanadas",
        products: [
            {
                name: "Empanada de carne",
                description: "Carne cortada a cuchillo, cebolla y especias.",
                price: 1200,
            },
            {
                name: "Empanada de jamon y queso",
                description: "Jamon cocido y muzzarella.",
                price: 1200,
            },
        ],
    },
    {
        name: "Milanesas",
        products: [
            {
                name: "Milanesa con papas",
                description: "Milanesa de carne con guarnicion de papas fritas.",
                price: 7600,
            },
            {
                name: "Milanesa napolitana",
                description: "Milanesa con salsa, jamon, muzzarella y papas fritas.",
                price: 9200,
            },
        ],
    },
    {
        name: "Bebidas",
        products: [
            {
                name: "Gaseosa 1.5L",
                description: "Linea Coca-Cola o similar, segun disponibilidad.",
                price: 2800,
            },
            {
                name: "Agua mineral 500ml",
                description: "Botella individual.",
                price: 1200,
            },
        ],
    },
]

const shouldResetDemoData = process.env.ALLOW_DESTRUCTIVE_SEED === "true"

async function resetDemoData() {
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
}

async function seedMenu() {
    for (const demoCategory of demoCategories) {
        const category = await prisma.category.upsert({
            where: {
                name: demoCategory.name,
            },
            update: {
                active: true,
            },
            create: {
                name: demoCategory.name,
                active: true,
            },
        })

        for (const demoProduct of demoCategory.products) {
            const existingProduct = await prisma.product.findFirst({
                where: {
                    name: demoProduct.name,
                    categoryId: category.id,
                },
            })

            if (existingProduct) {
                await prisma.product.update({
                    where: {
                        id: existingProduct.id,
                    },
                    data: {
                        description: demoProduct.description,
                        price: demoProduct.price,
                        active: true,
                    },
                })

                continue
            }

            await prisma.product.create({
                data: {
                    ...demoProduct,
                    active: true,
                    categoryId: category.id,
                },
            })
        }
    }
}

async function main() {
    if (shouldResetDemoData) {
        await resetDemoData()
        console.log("Pedidos, productos y categorias eliminados correctamente")
    }

    const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123"
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    await prisma.adminUser.upsert({
        where: {
            email: "admin@rotiseria.com"
        },
        update: {},
        create: {
            name: "Admin",
            email: "admin@rotiseria.com",
            passwordHash,
        }
    })

    await seedMenu()

    console.log("Admin verificado correctamente")
    console.log("Menu demo cargado correctamente")
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
