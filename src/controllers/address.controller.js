import {asyncHandler} from "../utils/asyncHandler.js"
import {apiResponse} from "../utils/apiResponse.js"
import {apiError} from "../utils/apiError.js"
import { Address } from "../models/address.model.js"

// Add user address
const addAddress = asyncHandler(async(req , res) => {
    const {address, state, city, pin, phone} = req.body
    const user = req.user._id

    const existUserAddress = await Address.findOne({user})

    if (existUserAddress) {
        throw new apiError(400, "an address already exists for this user");
    }

    if(!address || !state || !city || !pin || !phone){
        throw new apiError(400, "please provide values for all required fields");
    }

    const createAddress = await Address.create(
        {
            address,
            state,
            city,
            pin,
            phone,
            user
        }
    )

    if (!createAddress) {
        throw new apiError(500, "failed to create address, please try again later");
    }

    return res
    .status(201)
    .json(new apiResponse(201, "address added successfully", createAddress))
})


// Update user address
const updateAddress = asyncHandler(async(req , res) => {
    const {address, state, city, pin, phone} = req.body
    const userId = req.user._id

    const findAddress = await Address.findOne({user : userId})

    if(!findAddress){
        throw new apiError(404, "no address found for this user")
    }
    
    const addressId = findAddress._id

    if(!address && !state && !city && !pin && !phone){
        throw new apiError(400, "at least one field is required to update");
    }

    const updateFields = {}

    if(address) updateFields.address = address.trim()
    if(state) updateFields.state = state.trim()
    if(city) updateFields.city = city.trim()
    if(pin) updateFields.pin = pin
    if(phone) updateFields.phone = phone

    const updatedAddress = await Address.findByIdAndUpdate(
        addressId,
        {
            $set : updateFields
        },
        {
            new : true
        }
    )

    if (!updatedAddress) {
        throw new apiError(500, "failed to update address, please try again later");
    }

    return res
    .status(200)
    .json(new apiResponse(200, "address added successfully", updatedAddress))
})


// Show user address
const currentUserAddress = asyncHandler(async(req , res) => {
    const userId = req.user._id
    const address = await Address.findOne({user : userId})

    if(!address){
        throw new apiError(404, "no address found for this user")
    }

    return res
    .status(200)
    .json(new apiResponse(200, "user address retrived successfully", address))
})


// Delete address
const deleteAddress = asyncHandler(async(req , res) => {
    const user = req.user._id
    const address = await Address.findOne({user : user})

    if(!address){
        throw new apiError(404, "no address found for this user")
    }

    const deletedAddress = await Address.findByIdAndDelete(address._id)

    if(!deletedAddress){
        throw new apiError(500, "unable to delete user address, please try again later")
    }

    return res
    .status(200)
    .json(new apiResponse(200, "user address deleted successfully"))
})

export { addAddress, updateAddress, currentUserAddress, deleteAddress}