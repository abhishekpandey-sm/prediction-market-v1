import {z} from "zod"

const signupSchema = z.object({
    username: z.string().min(3, "Username must be atleast 3 characters long"),
    password: z.string().min(6, "Password must be atleast 6 charaters long")
})


const signinSchema = z.object({
    username: z.string().min(3, "Username must be atleast 3 characters long"),
    password: z.string().min(6, "Password must be atleast 6 characters long")
})

const onrampSchema = z.object({
    amount: z.number().int().positive()
})


export { signupSchema, signinSchema, onrampSchema}