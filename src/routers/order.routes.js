import { Router } from "express";
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"
import { allOrder, createOrder, deleteOrder, updateOrder } from "../controllers/order.controller.js";

const router = Router()


router.route("/create").post(verifyJWT, createOrder)
router.route("/delete/:id").delete(verifyJWT, deleteOrder)
router.route("/allorder").get(verifyJWT, allOrder)
router.route("/update/:id").patch(verifyJWT, adminAccess("admin"), updateOrder)


export default router