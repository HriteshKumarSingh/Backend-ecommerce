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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
      state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
      city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
      pin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
      phone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    },
    paymentInfo: {
      paymentMethod: {
        type: String,
        required: true,
        // enum: ["credit_card", "debit_card", "paypal", "stripe", "cash_on_delivery"],
      },
      paymentStatus: {
        type: String,
        required: true,
        // enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paymentId: {
        type: String,
        required: true,
        trim: true,
      },
      paymentDate: {
        type: Date,
        default: Date.now,
      },
      paymentAmount: {
        type: Number,
        required: true,
      },
      transactionDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
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