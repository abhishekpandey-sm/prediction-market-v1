import {Router} from "express"
import auth from "../middleware/auth"
import resolveMarket from "../controller/resolve"

const resolveRouter = Router()

app.use(auth)

resolveRouter.post("/", resolveMarket)