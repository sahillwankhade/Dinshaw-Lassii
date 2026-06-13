const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const Product = require("./models/Product");
const Coupon = require("./models/Coupon");

const productsRoute = require("./routes/products");
const ordersRoute = require("./routes/orders");
const couponsRoute = require("./routes/coupons");

const app = express();
const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017/dinshaw_lassi";

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Serve static frontend files from parent directory ──
app.use(express.static(path.join(__dirname, "..")));

// Also serve the animation frames
app.use("/frames", express.static(path.resolve(__dirname, "../../Downloads/ezgif-1d009f4810381493-jpg")));

// ── API Routes ──
app.use("/api/products", productsRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/coupons", couponsRoute);

// ── Fallback: serve index.html for any non-API route ──
app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "..", "index.html"));
    }
});

// ── Seed Data ──
async function seedData() {
    // Seed products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
        await Product.insertMany([
            {
                name: "Dinshaw's Malaidaar Lassi — Regular",
                size: "regular",
                volume: "200 ml",
                price: 30,
                description: "Sweet & Thick — Made from liquid milk. No preservatives.",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI-_jlaLDQY_ngT3Ssk9EWmG2UEySGQG_TA8l-SmtkcdK8YpoLg4wFQVtFy47SmonH0UqhB6QluHPER5DmFvZsIpeFbpCThkmzk1npkvbOCjWiv6U4nlvExfO2sVp0ZMoUj8EeBnGcdYhnk_pIXMeobqiKmX9UcfEl-b0CEUBFvWTyDLMvZBevZDsVwQg0wGzbRaQ_jXUnv-jY3YbKuSGyMsWWC3jtREoiH9c0CcVKuciVukHqkxXkNNae8dwYijwaoDuPjD_P8Fe2",
                inStock: true
            },
            {
                name: "Dinshaw's Malaidaar Lassi — Large",
                size: "large",
                volume: "400 ml",
                price: 60,
                description: "Sweet & Thick — Double the freshness. Made from liquid milk. No preservatives.",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI-_jlaLDQY_ngT3Ssk9EWmG2UEySGQG_TA8l-SmtkcdK8YpoLg4wFQVtFy47SmonH0UqhB6QluHPER5DmFvZsIpeFbpCThkmzk1npkvbOCjWiv6U4nlvExfO2sVp0ZMoUj8EeBnGcdYhnk_pIXMeobqiKmX9UcfEl-b0CEUBFvWTyDLMvZBevZDsVwQg0wGzbRaQ_jXUnv-jY3YbKuSGyMsWWC3jtREoiH9c0CcVKuciVukHqkxXkNNae8dwYijwaoDuPjD_P8Fe2",
                inStock: true
            }
        ]);
        console.log("✅ Seeded 2 products");
    }

    // Seed coupons if empty
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
        await Coupon.insertMany([
            {
                code: "BULK10",
                discountPercent: 10,
                minQuantity: 5,
                minAmount: 0,
                description: "10% off on orders with 5+ items",
                isActive: true
            },
            {
                code: "BULK20",
                discountPercent: 20,
                minQuantity: 10,
                minAmount: 0,
                description: "20% off on orders with 10+ items",
                isActive: true
            },
            {
                code: "MEGA30",
                discountPercent: 30,
                minQuantity: 20,
                minAmount: 0,
                description: "30% off on mega bulk orders (20+ items)",
                isActive: true
            },
            {
                code: "FIRST15",
                discountPercent: 15,
                minQuantity: 0,
                minAmount: 200,
                description: "15% off on orders above ₹200",
                isActive: true
            }
        ]);
        console.log("✅ Seeded 4 coupons");
    }
}

// ── Start Server ──
async function start() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB:", MONGO_URI);

        await seedData();

        app.listen(PORT, () => {
            console.log(`\n🚀 Dinshaw's Lassi Server running at http://localhost:${PORT}`);
            console.log(`📦 API available at http://localhost:${PORT}/api`);
            console.log(`\n   Products:  GET  /api/products`);
            console.log(`   Orders:    POST /api/orders`);
            console.log(`   Orders:    GET  /api/orders/:orderId`);
            console.log(`   Coupons:   POST /api/coupons/validate`);
            console.log(`   Coupons:   GET  /api/coupons\n`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err.message);
        process.exit(1);
    }
}

start();
