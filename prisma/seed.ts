import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"
import { databaseUrl } from "../src/config/env.js"

const adapter = new PrismaPg({
    connectionString: databaseUrl,
})

const prisma = new PrismaClient({ adapter })

async function main() {
    const passwordHash = await bcrypt.hash("Admin123", 10)

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

    console.log("Admin creado correctamente")
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })