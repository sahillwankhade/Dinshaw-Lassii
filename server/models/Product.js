const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    size:        { type: String, enum: ["regular", "large"], required: true },
    volume:      { type: String, required: true },
    price:       { type: Number, required: true },
    description: { type: String, default: "" },
    image:       { type: String, default: "" },
    inStock:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
