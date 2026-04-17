import { Client } from "@upstash/qstash"
import { env } from "~/env"
import { db } from "~/server/db" // your Prisma client

export const qstash = new Client({
    token: env.QSTASH_TOKEN,
})

