import { Router } from "express"
import { onramp, profile, signin, signup, transaction } from "../controller/auth"
import auth from "../middleware/auth"

const authRouter = Router()

authRouter.post("/signup", signup)
authRouter.post("/signin", signin)

authRouter.use(auth)

authRouter.post("/onramp", onramp)
authRouter.get("/profile", profile)
authRouter.get("/transaction", transaction)

export default authRouter