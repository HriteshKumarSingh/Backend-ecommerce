import "dotenv/config"
import cors from "cors"
import cookieParse from "cookie-parser"
import express, { json } from "express"
import userRouter from "./routers/user.router.js"


const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParse())


// User router
app.use("/api/user/" , userRouter)


export {app}