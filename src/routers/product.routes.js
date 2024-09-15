import { Router } from "express";
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";
import { allProducts, createProduct, deleteProduct, searchProduct, singleProduct, updateProduct } from "../controllers/product.controller.js";


const router = Router()

router.route("/create").post(verifyJWT, adminAccess("admin"), upload.array('images',4), createProduct)
router.route("/all").get(verifyJWT, adminAccess("admin"), allProducts)
router.route("/update/:id").patch(verifyJWT, adminAccess("admin"), updateProduct)
router.route("/delete/:id").delete(verifyJWT, adminAccess("admin"), deleteProduct)
router.route("/:id").get(verifyJWT, singleProduct)
router.route("/products").get(verifyJWT, searchProduct)



export default router