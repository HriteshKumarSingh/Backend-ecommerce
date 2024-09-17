import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Order } from "../models/order.model.js";
import { Address } from "../models/address.model.js";

// Generate order
const createOrder = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    quantity,
    image,
    product,
    itemCost,
    taxCost,
    shippingCost,
    totalCost,
  } = req.body;
  const user = req.user._id;

  if (
    !name ||
    !price ||
    !quantity ||
    !image ||
    !product ||
    !itemCost ||
    !taxCost ||
    !shippingCost ||
    !totalCost
  ) {
    throw new apiError(400, "please provide values for all required fields");
  }

  const address = await Address.findOne({ user });

  if (!address) {
    throw new apiError(404, "address not found for this user");
  }

  const placeOrder = await Order.create({
    orderInfo: [
      {
        name,
        price,
        quantity,
        image,
        product,
      },
    ],
    shippingInfo: {
      address: address.address,
      state: address.state,
      city: address.city,
      pin: address.pin,
      phone: address.phone,
    },
    paymentInfo: {},
    costInfo: {
      itemCost: itemCost,
      taxCost: taxCost,
      shippingCost: shippingCost,
      totalCost: totalCost,
    },
    user,
  });

  if (!placeOrder) {
    throw new apiError(
      500,
      "unable to process your order at this time, please try again later"
    );
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "your order has been successfully placed",
        placeOrder
      )
    );
});

// Delete order
const deleteOrder = asyncHandler(async (req, res) => {
  const orderId  = req.params.id;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new apiError(404, "order not found");
  }

  await Order.findByIdAndDelete(orderId);

  return res
    .status(200)
    .json(new apiResponse(200, "order deleted successfully"));
});


// show all order
const allOrder = asyncHandler(async(req , res) => {
  const user = req.user._id

  const order = await Order.find({user});

  if (!order) {
    throw new apiError(404, "no order found for this user");
  }

  return res
  .status(200)
  .json(new apiResponse(200, "all orders retrive successfully", order));
})

export { createOrder, deleteOrder, allOrder };