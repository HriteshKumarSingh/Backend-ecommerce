import { Router } from "express";
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"
import { createOrder } from "../controllers/order.controller.js";

const router = Router()


router.route("/create").post(verifyJWT, createOrder)


export default router