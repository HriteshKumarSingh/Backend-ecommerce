import { Router } from "express";
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"
import { allOrder, createOrder, deleteOrder } from "../controllers/order.controller.js";

const router = Router()


router.route("/create").post(verifyJWT, createOrder)
router.route("/delete/:id").delete(verifyJWT, deleteOrder)
router.route("/").get(verifyJWT, allOrder)


export default router