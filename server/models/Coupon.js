const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code:            { type: String, required: true, unique: true, uppercase: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    minQuantity:     { type: Number, default: 0 },  // Minimum total items in cart
    minAmount:       { type: Number, default: 0 },   // Minimum cart subtotal ₹
    description:     { type: String, default: "" },
    isActive:        { type: Boolean, default: true },
    expiresAt:       { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
