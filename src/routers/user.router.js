import Router from "express"
import { allUser, changePassword, currentUser, deleteUser, deleteUserAccount, forget, login, logout, otpVerify, refreshAccessToken, signup, updatePassword, updateUserAccount, updateUserType, userDetails } from "../controllers/user.controller.js"
import { adminAccess, verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/signup").post(signup)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT, logout)
router.route("/forget").post(forget)
router.route("/otp").post(otpVerify)
router.route("/change-password").patch(changePassword)
router.route("/current").get(verifyJWT, currentUser)
router.route("/delete").delete(verifyJWT, deleteUserAccount)
router.route("/update").put(verifyJWT, updateUserAccount)
router.route("/update/password").patch(verifyJWT, updatePassword)
router.route("/validate").get(verifyJWT, refreshAccessToken)
router.route("/all").get(verifyJWT, adminAccess("admin"), allUser)
router.route("/delete/:id").delete(verifyJWT, adminAccess("admin"), deleteUser)
router.route("/details/:id").get(verifyJWT, adminAccess("admin"), userDetails)
router.route("/access/:id").patch(verifyJWT, adminAccess("admin"), updateUserType)


export default router