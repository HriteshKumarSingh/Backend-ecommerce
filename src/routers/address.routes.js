import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addAddress, updateAddress, currentUserAddress, deleteAddress } from "../controllers/address.controller.js";

const router = Router()


router.route("/address/create").post(verifyJWT, addAddress);
router.route("/address/update").patch(verifyJWT, updateAddress);
router.route("/address").get(verifyJWT, currentUserAddress);
router.route("/address/delete").delete(verifyJWT, deleteAddress);


export default router