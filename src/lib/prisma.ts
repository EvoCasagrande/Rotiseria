import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { databaseUrl } from "../config/env.js";

const adapter = new PrismaPg({
    connectionString: databaseUrl,
});

export const prisma = new PrismaClient({ adapter });
