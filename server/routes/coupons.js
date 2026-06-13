const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// POST /api/coupons/validate — Validate a coupon code against cart
router.post("/validate", async (req, res) => {
    try {
        const { code, totalItems, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: "Coupon code is required." });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ success: false, error: "Invalid coupon code." });
        }

        // Check expiry
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return res.status(400).json({ success: false, error: "This coupon has expired." });
        }

        // Check minimum quantity
        if (coupon.minQuantity > 0 && totalItems < coupon.minQuantity) {
            return res.status(400).json({
                success: false,
                error: `This coupon requires at least ${coupon.minQuantity} items in cart. You have ${totalItems}.`
            });
        }

        // Check minimum amount
        if (coupon.minAmount > 0 && subtotal < coupon.minAmount) {
            return res.status(400).json({
                success: false,
                error: `This coupon requires a minimum order of ₹${coupon.minAmount}. Your subtotal is ₹${subtotal}.`
            });
        }

        const discount = Math.round(subtotal * (coupon.discountPercent / 100));

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountPercent: coupon.discountPercent,
                discount,
                description: coupon.description
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/coupons — List all active coupons (for display)
router.get("/", async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true }).select("code discountPercent minQuantity minAmount description");
        res.json({ success: true, coupons });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
