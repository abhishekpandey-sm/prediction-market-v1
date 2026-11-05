import express from "express"
import connectToDB from "./db"
import authRouter from "./routes/auth"
import marketRouter from "./routes/market"

const app = express()

app.use(express.json())

app.use("/api/v1/auth", authRouter)
app.use("api/v1/market", marketRouter)


async function startServer(){
    try{
        app.listen(process.env.PORT, () => {
            console.log("Server listning on port: ", process.env.PORT)
        })

        await connectToDB()
    } catch(err){
        console.error("Error: ", err.message)
        process.exit(1)
    }
}

startServer()
