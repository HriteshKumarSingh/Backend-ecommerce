import { Router } from "express";
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";
import { adminDeleteReview, allProducts, allReview, createProduct, deleteProduct, deleteReview, productReview, searchProduct, singleProduct, updateProduct } from "../controllers/product.controller.js";


const router = Router()

router.route("/create").post(verifyJWT, adminAccess("admin"), upload.array('images',4), createProduct)
router.route("/all").get(verifyJWT, adminAccess("admin"), allProducts)
router.route("/update/:id").patch(verifyJWT, adminAccess("admin"), upload.array('images',4), updateProduct)
router.route("/delete/:id").delete(verifyJWT, adminAccess("admin"), deleteProduct)
router.route("/reviews/:id").get(verifyJWT, adminAccess("admin"), allReview)
router.route("/reviews/delete/:productId/:userId").delete(verifyJWT, adminAccess("admin"), adminDeleteReview)


router.route("/:id").get(verifyJWT, singleProduct)
router.route("/products").get(verifyJWT, searchProduct)
router.route("/review").post(verifyJWT, productReview)
router.route("/delete/review/:id").delete(verifyJWT, deleteReview)



export default router