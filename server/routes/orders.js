const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

// Generate unique order ID
function generateOrderId() {
    const prefix = "DL";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// POST /api/orders — Place a new order
router.post("/", async (req, res) => {
    try {
        const { items, customer, couponCode, paymentMethod } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: "Cart is empty." });
        }

        // Validate customer
        if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city || !customer.pincode) {
            return res.status(400).json({ success: false, error: "Please fill all customer details." });
        }

        // Validate and build order items from DB
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ success: false, error: `Product not found: ${item.productId}` });
            }
            if (!product.inStock) {
                return res.status(400).json({ success: false, error: `${product.name} is out of stock.` });
            }

            const qty = Math.max(1, Math.floor(item.quantity || 1));
            const lineTotal = product.price * qty;
            subtotal += lineTotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                size: product.size,
                volume: product.volume,
                price: product.price,
                quantity: qty
            });
        }

        // Apply coupon if provided
        let discount = 0;
        let appliedCoupon = "";
        const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                const notExpired = !coupon.expiresAt || new Date() <= coupon.expiresAt;
                const meetsQty = !coupon.minQuantity || totalItems >= coupon.minQuantity;
                const meetsAmt = !coupon.minAmount || subtotal >= coupon.minAmount;

                if (notExpired && meetsQty && meetsAmt) {
                    discount = Math.round(subtotal * (coupon.discountPercent / 100));
                    appliedCoupon = coupon.code;
                }
            }
        }

        const total = subtotal - discount;

        // Determine payment status
        let paymentStatus = "pending";
        if (paymentMethod === "card" || paymentMethod === "razorpay") {
            // Simulate successful payment
            paymentStatus = "paid";
        }

        const order = new Order({
            orderId: generateOrderId(),
            items: orderItems,
            customer,
            subtotal,
            discount,
            couponCode: appliedCoupon,
            total,
            paymentMethod: paymentMethod || "cod",
            paymentStatus,
            status: "placed"
        });

        await order.save();

        res.status(201).json({
            success: true,
            order: {
                orderId: order.orderId,
                items: order.items,
                customer: order.customer,
                subtotal: order.subtotal,
                discount: order.discount,
                couponCode: order.couponCode,
                total: order.total,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                status: order.status,
                createdAt: order.createdAt
            }
        });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/orders/:orderId — Get order by orderId
router.get("/:orderId", async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found." });
        }
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
