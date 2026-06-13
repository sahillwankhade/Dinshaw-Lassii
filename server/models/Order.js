const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId:   { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name:        String,
    size:        String,
    volume:      String,
    price:       Number,
    quantity:    { type: Number, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId:       { type: String, unique: true, required: true },
    items:         [orderItemSchema],
    customer: {
        name:    { type: String, required: true },
        phone:   { type: String, required: true },
        email:   { type: String, default: "" },
        address: { type: String, required: true },
        city:    { type: String, required: true },
        pincode: { type: String, required: true }
    },
    subtotal:      { type: Number, required: true },
    discount:      { type: Number, default: 0 },
    couponCode:    { type: String, default: "" },
    total:         { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "card", "razorpay"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status:        { type: String, enum: ["placed", "confirmed", "preparing", "dispatched", "delivered", "cancelled"], default: "placed" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
