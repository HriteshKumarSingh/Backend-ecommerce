import { app } from "./app.js"
import {connectDB} from "./db/index.js"


connectDB().then(() => {
    app.on("error" , (error) => {
        console.error("An error occouring while listening app to the database :: ", error)
    })  

    app.listen(process.env.PORT || 4000 , () => {
        console.log(`App is successfully connected to the database and listening on :: http://localhost:${process.env.PORT || 4000}`)
    })
}).catch((error) => {
    console.error("An error occouring while connecting to the database :: ",error)
})