import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        address : {
            type : String,
            required : true,
            trim : true,
            lowercase : true
        },
        state : {
            type : String,
            required : true,
            trim : true,
            lowercase : true
        },
        city : {
            type : String,
            required : true,
            trim : true,
            lowercase : true
        },
        pin : {
            type : String,
            required : true,
            trim : true,
            lowercase : true
        },
        phone : {
            type : Number,
            required : true
        },
        user : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    },
    { timestamps : true }
)

export const Address = mongoose.model("Address" , addressSchema)