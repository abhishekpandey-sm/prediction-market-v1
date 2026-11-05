import {Router} from "express"
import { createMarket, getBets, getMarket, placeBet } from "../controller/market"
import auth from "../middleware/auth"

const marketRouter = Router()


marketRouter.post()


marketRouter.get("/", getMarket)

app.use(auth)

marketRouter.post("/", createMarket)
marketRouter.post("/bet", placeBet)
marketRouter.get("/bets", getBets)

export default marketRouter