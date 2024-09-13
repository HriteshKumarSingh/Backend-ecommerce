import JWT from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js"


const verifyJWT = asyncHandler(async(req , _ , next) => {
    try {
        const token = req.cookies.accessToken

        if(!token){
            throw new apiError(401, "unauthorized access token is missing or invalid")
        }

        const decodedToken = JWT.verify(token , process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if(!user){
            throw new apiError(401 , "invalid or expired access token, please log in again")
        }

        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, error.message || "unauthorized access token is missing or invalid")
    }
})


const adminAccess = (...userType) => {
    return (req , _ , next) => {
        const user = req.user.userType

        if(!userType.includes(user)){
            throw new apiError(403 , 'access denied, you do not have the required permissions to view this page')
        }

        next()
    }
}


export {verifyJWT , adminAccess}