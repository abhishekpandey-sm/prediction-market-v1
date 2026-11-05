import mongoose from "mongoose"
import {z} from "zod"

const createMarketSchema = z.object({
    title: z.string().min(3),
    initialWager: z.number().int().positive(),
    side: z.enum(["yse", "no"]),
    expiry: z.coerce.date() 
})

const placeBetSchema = z.object({
    marketId: z.string().refine(mongoose.isValidObjectId, "Invalid market Id"),
    amount: z.number().int().positive()
})

export {createMarketSchema, placeBetSchema}