import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Order } from "../models/order.model.js";

// Generate order
const createOrder = asyncHandler(async(req , res) => {
    const {shippingInfo, orderItem, paymentInfo, priceInfo, orderInfo} = req.body
    const user = req.user._id

    if (!shippingInfo || !orderItem || !paymentInfo || !priceInfo || !orderInfo) {
        throw new apiError(400, "please provide values for all required fields");
    }

    const placeOrder = await Order.create(
        {
            shippingInfo,
            orderItem,
            paymentInfo,
            priceInfo,
            orderInfo,
            user
        }
    )

    if(!placeOrder){
        throw new apiError(500, "unable to process your order at this time, please try again later")
    }

    return res
    .status(200)
    .json(new apiResponse(200, "your order has been successfully placed"))
})


export {createOrder}