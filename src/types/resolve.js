import {z} from "zod"
import mongoose from "mongoose"

export const resolveMarketSchema  = z.object({
    marketId: z.string().refine(mongoose.isValidObjectId),
    resolution: z.enum(["yes", "no"])
})