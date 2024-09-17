import "dotenv/config"
import cors from "cors"
import cookieParse from "cookie-parser"
import express from "express"
import userRouter from "./routers/user.routes.js"
import productRouter from "./routers/product.routes.js"
import orderRouter from "./routers/order.routes.js"
import addressRouter from "./routers/address.routes.js"


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


// Product router
app.use("/api/product/" , productRouter)


// Order router
app.use("/api/order/" , orderRouter)


// Address
app.use("/api/user/" , addressRouter)

export {app}