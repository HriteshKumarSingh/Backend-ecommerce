import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderInfo: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    shippingInfo: {
      address: {
        type : String,
        required : true
      },
      state: {
        type : String,
        required : true
      },
      city: {
        type : String,
        required : true
      },
      pin: {
        type : String,
        required : true
      },
      phone: {
        type : String,
        required : true
      },
    },
    paymentInfo: {
      paymentMethod: {
        type: String,
        // required: true,
        // enum: ["credit_card", "debit_card", "paypal", "stripe", "cash_on_delivery"],
      },
      paymentStatus: {
        type: String,
        // required: true,
        // enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paymentId: {
        type: String,
        // required: true,
        trim: true,
      },
      paymentDate: {
        type: Date,
        // default: Date.now,
      },
      paymentAmount: {
        type: Number,
        // required: true,
      },
      transactionDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    },
    costInfo: {
      itemCost: {
        type: Number,
        // required: true,
        default: 0,
      },
      taxCost: {
        type: Number,
        // required: true,
        default: 0,
      },
      shippingCost: {
        type: Number,
        // required: true,
        default: 0,
      },
      totalCost: {
        type: Number,
        // required: true,
        default: 0,
      },
    },
    deliveryInfo: {
      orderStatus: {
        type: String,
        default: "processing",
      },
      deliveredTime: {
        type: Date,
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
