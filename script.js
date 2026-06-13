(() => {
    "use strict";

    // ── Configuration ──
    const TOTAL_FRAMES = 240;
    const isOldServer = window.location.port === "8080";
    const IMAGE_PATH = isOldServer ? "../Downloads/ezgif-1d009f4810381493-jpg/ezgif-frame-" : "/frames/ezgif-frame-";

    // ── DOM Elements ──
    const canvas = document.getElementById("animCanvas");
    const ctx = canvas.getContext("2d");
    const loader = document.getElementById("loader");
    const loaderPercent = document.getElementById("loaderPercent");
    const scrollIndicator = document.getElementById("scrollIndicator");
    const progressBar = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const scrollSection = document.getElementById("scrollSection");
    const mainNav = document.getElementById("mainNav");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const cartoonEl = document.getElementById("cartoonCharacter");
    const leftPupil = document.querySelector(".left-pupil");
    const rightPupil = document.querySelector(".right-pupil");
    const toastContainer = document.getElementById("toastContainer");

    // ── State ──
    const images = new Array(TOTAL_FRAMES);
    let loadedCount = 0;
    let currentFrame = 0;
    let isLoaded = false;
    let rafId = null;

    // ══════════════════════════════════════════
    //   TOAST NOTIFICATIONS
    // ══════════════════════════════════════════
    function showToast(message, icon = "✅") {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Auto-remove after 3s
        setTimeout(() => {
            toast.classList.add("toast-out");
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ══════════════════════════════════════════
    //   SMOOTH SCROLL HELPER
    // ══════════════════════════════════════════
    function smoothScrollTo(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // ══════════════════════════════════════════
    //   IMAGE PRELOADING
    // ══════════════════════════════════════════
    function padNumber(n) {
        return String(n).padStart(3, "0");
    }

    function getImagePath(index) {
        return `${IMAGE_PATH}${padNumber(index + 1)}.jpg`;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (isLoaded) drawFrame(currentFrame);
    }

    function drawFrame(index) {
        const img = images[index];
        if (!img || !img.complete) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    function preloadImages() {
        return new Promise((resolve) => {
            const BATCH_SIZE = 14;
            let nextIndex = 0;

            function loadNext() {
                while (nextIndex < TOTAL_FRAMES && nextIndex - loadedCount < BATCH_SIZE) {
                    const idx = nextIndex;
                    const img = new Image();
                    img.src = getImagePath(idx);
                    img.onload = () => {
                        images[idx] = img;
                        loadedCount++;
                        loaderPercent.textContent = `${Math.round((loadedCount / TOTAL_FRAMES) * 100)}%`;
                        if (loadedCount === TOTAL_FRAMES) resolve();
                        else loadNext();
                    };
                    img.onerror = () => {
                        loadedCount++;
                        loaderPercent.textContent = `${Math.round((loadedCount / TOTAL_FRAMES) * 100)}%`;
                        if (loadedCount === TOTAL_FRAMES) resolve();
                        else loadNext();
                    };
                    nextIndex++;
                }
            }
            loadNext();
        });
    }

    // ══════════════════════════════════════════
    //   SCROLL HANDLER
    // ══════════════════════════════════════════
    function onScroll() {
        if (!isLoaded) return;

        const sectionTop = scrollSection.offsetTop;
        const sectionHeight = scrollSection.scrollHeight - window.innerHeight;
        const scrollY = window.scrollY - sectionTop;
        const progress = Math.max(0, Math.min(1, scrollY / sectionHeight));

        // Frame animation
        const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));
        progressFill.style.width = `${progress * 100}%`;

        if (frameIndex !== currentFrame) {
            currentFrame = frameIndex;
            drawFrame(currentFrame);
        }

        // Canvas fade-out: gradually fade as we approach the end of the scroll section
        // Start fading at 90% progress, fully hidden at 100%
        const fadeStart = 0.88;
        if (progress >= fadeStart) {
            const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
            canvas.style.opacity = String(Math.max(0, 1 - fadeProgress));
        } else {
            canvas.style.opacity = "1";
        }

        // Once fully past the section, ensure canvas is hidden
        const pastCanvas = window.scrollY > sectionTop + sectionHeight;
        if (pastCanvas) {
            canvas.style.opacity = "0";
            canvas.style.pointerEvents = "none";
        } else {
            canvas.style.pointerEvents = "auto";
        }

        // Scroll indicator
        if (progress > 0.01) {
            scrollIndicator.classList.remove("visible");
            scrollIndicator.classList.add("fade-out");
            progressBar.classList.add("visible");
        } else {
            scrollIndicator.classList.add("visible");
            scrollIndicator.classList.remove("fade-out");
            progressBar.classList.remove("visible");
        }

        // Nav style: transparent during animation, solid after
        if (pastCanvas || progress > 0.92) {
            mainNav.classList.remove("nav-transparent");
            mainNav.classList.add("nav-solid");
        } else {
            mainNav.classList.remove("nav-solid");
            mainNav.classList.add("nav-transparent");
        }
    }

    function throttledScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            onScroll();
            rafId = null;
        });
    }

    // ══════════════════════════════════════════
    //   MOBILE MENU
    // ══════════════════════════════════════════
    hamburgerBtn.addEventListener("click", () => {
        hamburgerBtn.classList.toggle("open");
        mobileMenu.classList.toggle("open");
    });

    // Close mobile menu on link click
    document.querySelectorAll(".mobile-menu-links a").forEach(link => {
        link.addEventListener("click", () => {
            hamburgerBtn.classList.remove("open");
            mobileMenu.classList.remove("open");
        });
    });

    // ══════════════════════════════════════════
    //   CART & CHECKOUT LOGIC
    // ══════════════════════════════════════════

    let cart = JSON.parse(localStorage.getItem('dinshawCart')) || [];
    let products = [];
    let currentCoupon = null;

    // DOM Elements
    const cartToggleBtn = document.getElementById("cartToggleBtn");
    const cartSidebar = document.getElementById("cartSidebar");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartCloseBtn = document.getElementById("cartCloseBtn");
    const cartBadge = document.getElementById("cartBadge");
    const cartItemsEl = document.getElementById("cartItems");
    const cartEmptyEl = document.getElementById("cartEmpty");
    const cartSummary = document.getElementById("cartSummary");
    const cartCouponSection = document.getElementById("cartCouponSection");
    const cartShopBtn = document.getElementById("cartShopBtn");

    // Summary Els
    const cartSubtotalEl = document.getElementById("cartSubtotal");
    const discountRowEl = document.getElementById("discountRow");
    const discountCodeEl = document.getElementById("discountCode");
    const discountAmountEl = document.getElementById("discountAmount");
    const cartTotalEl = document.getElementById("cartTotal");

    // Checkout Els
    const checkoutBtn = document.getElementById("checkoutBtn");
    const checkoutOverlay = document.getElementById("checkoutOverlay");
    const checkoutCloseBtn = document.getElementById("checkoutCloseBtn");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    const paymentOptions = document.querySelectorAll(".payment-option");
    const cardForm = document.getElementById("cardForm");
    const razorpayForm = document.getElementById("razorpayForm");
    const checkoutError = document.getElementById("checkoutError");
    const checkoutItemsList = document.getElementById("checkoutItemsList");

    // Confirmation Els
    const confirmOverlay = document.getElementById("confirmOverlay");
    const confirmOrderId = document.getElementById("confirmOrderId");
    const confirmDetails = document.getElementById("confirmDetails");
    const confirmDoneBtn = document.getElementById("confirmDoneBtn");

    // Fetch Products from Backend
    async function fetchProducts() {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.success) {
                products = data.products;
                // Bind buttons to product IDs
                const smallProd = products.find(p => p.size === 'regular');
                const largeProd = products.find(p => p.size === 'large');

                const orderSmallBtn = document.getElementById("orderSmallBtn");
                if (orderSmallBtn && smallProd) {
                    orderSmallBtn.onclick = () => addToCart(smallProd._id, 1);
                }

                const orderLargeBtn = document.getElementById("orderLargeBtn");
                if (orderLargeBtn && largeProd) {
                    orderLargeBtn.onclick = () => addToCart(largeProd._id, 1);
                }
            }
        } catch (err) {
            console.error("Failed to load products", err);
        }
    }

    // Cart Operations
    function saveCart() {
        localStorage.setItem('dinshawCart', JSON.stringify(cart));
        updateCartUI();
    }

    function addToCart(productId, qty = 1) {
        const prod = products.find(p => p._id === productId);
        if (!prod) return;

        const existing = cart.find(item => item.productId === productId);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({
                productId: prod._id,
                name: prod.name,
                size: prod.size,
                price: prod.price,
                image: prod.image,
                quantity: qty
            });
        }

        saveCart();

        // Badge animation
        cartBadge.classList.add("pop");
        setTimeout(() => cartBadge.classList.remove("pop"), 300);

        showToast(`${prod.name} added to cart!`, "🛒");

        // Validate coupon again if there's one active
        if (currentCoupon) validateCoupon(currentCoupon.code);
    }

    function updateQuantity(productId, delta) {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.productId !== productId);
        }
        saveCart();
        if (currentCoupon) validateCoupon(currentCoupon.code);
    }

    function removeFromCart(productId) {
        cart = cart.filter(i => i.productId !== productId);
        saveCart();
        if (currentCoupon) validateCoupon(currentCoupon.code);
    }

    // Update UI
    function updateCartUI() {
        // Badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;

        if (cart.length === 0) {
            cartEmptyEl.style.display = "flex";
            cartItemsEl.style.display = "none";
            cartSummary.style.display = "none";
            cartCouponSection.style.display = "none";
            currentCoupon = null;
            document.getElementById("couponInput").value = "";
            document.getElementById("couponMessage").textContent = "";
            return;
        }

        cartEmptyEl.style.display = "none";
        cartItemsEl.style.display = "flex";
        cartSummary.style.display = "block";
        cartCouponSection.style.display = "block";

        // Render Items
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="dinshaw.updateQuantity('${item.productId}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="dinshaw.updateQuantity('${item.productId}', 1)">+</button>
                        <button class="cart-item-remove" onclick="dinshaw.removeFromCart('${item.productId}')">Remove</button>
                    </div>
                </div>
            </div>
        `).join("");

        // Calculate Totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartSubtotalEl.textContent = `₹${subtotal}`;

        let discount = 0;
        if (currentCoupon) {
            discount = currentCoupon.discount;
            discountRowEl.style.display = "flex";
            discountCodeEl.textContent = currentCoupon.code;
            discountAmountEl.textContent = `-₹${discount}`;
        } else {
            discountRowEl.style.display = "none";
        }

        const total = subtotal - discount;
        cartTotalEl.textContent = `₹${total}`;

        // Checkout summary (same numbers)
        document.getElementById("chkSubtotal").textContent = `₹${subtotal}`;
        const chkDiscountRow = document.getElementById("chkDiscountRow");
        if (discount > 0) {
            chkDiscountRow.style.display = "flex";
            document.getElementById("chkDiscount").textContent = `-₹${discount}`;
        } else {
            chkDiscountRow.style.display = "none";
        }
        document.getElementById("chkTotal").textContent = `₹${total}`;
    }

    // Coupon Logic
    const couponInput = document.getElementById("couponInput");
    const couponApplyBtn = document.getElementById("couponApplyBtn");
    const couponMessage = document.getElementById("couponMessage");

    async function validateCoupon(code) {
        if (!code) return;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        couponMessage.className = "coupon-message";
        couponMessage.textContent = "Validating...";

        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, totalItems, subtotal })
            });
            const data = await res.json();

            if (data.success) {
                currentCoupon = data.coupon;
                couponMessage.className = "coupon-message coupon-success";
                couponMessage.textContent = `${data.coupon.description} applied!`;
            } else {
                currentCoupon = null;
                couponMessage.className = "coupon-message coupon-error";
                couponMessage.textContent = data.error;
            }
            updateCartUI();
        } catch (err) {
            console.error(err);
            couponMessage.className = "coupon-message coupon-error";
            couponMessage.textContent = "Failed to apply coupon.";
        }
    }

    if (couponApplyBtn) {
        couponApplyBtn.addEventListener("click", () => validateCoupon(couponInput.value.trim()));
    }

    // Sidebar Toggles
    function openCart() {
        cartSidebar.classList.add("open");
        cartOverlay.classList.add("open");
    }
    function closeCart() {
        cartSidebar.classList.remove("open");
        cartOverlay.classList.remove("open");
    }

    if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
    if (cartShopBtn) {
        cartShopBtn.addEventListener("click", () => {
            closeCart();
            smoothScrollTo("#pricing");
        });
    }

    // Checkout Flow
    function openCheckout() {
        closeCart();
        checkoutOverlay.classList.add("open");

        // Render simple list for checkout modal
        checkoutItemsList.innerHTML = cart.map(item => `
            <div class="checkout-item-row">
                <span>${item.quantity}x ${item.name}</span>
                <span>₹${item.price * item.quantity}</span>
            </div>
        `).join("");
    }

    function closeCheckout() {
        checkoutOverlay.classList.remove("open");
    }

    if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);
    if (checkoutOverlay) checkoutOverlay.addEventListener("click", (e) => {
        if (e.target === checkoutOverlay) closeCheckout();
    });
    if (checkoutCloseBtn) checkoutCloseBtn.addEventListener("click", closeCheckout);

    // Payment method selector
    paymentOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            paymentOptions.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            const val = opt.querySelector("input").value;
            opt.querySelector("input").checked = true;

            cardForm.style.display = val === "card" ? "block" : "none";
            razorpayForm.style.display = val === "razorpay" ? "block" : "none";
        });
    });

    // Place Order
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async () => {
            // Validate form
            const name = document.getElementById("custName").value.trim();
            const phone = document.getElementById("custPhone").value.trim();
            const email = document.getElementById("custEmail").value.trim();
            const address = document.getElementById("custAddress").value.trim();
            const city = document.getElementById("custCity").value.trim();
            const pincode = document.getElementById("custPincode").value.trim();

            if (!name || !phone || !address || !city || !pincode) {
                checkoutError.textContent = "Please fill in all required delivery details.";
                return;
            }

            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

            if (paymentMethod === "card") {
                const cn = document.getElementById("cardNumber").value;
                const ce = document.getElementById("cardExpiry").value;
                const cv = document.getElementById("cardCvv").value;
                if (!cn || !ce || !cv) {
                    checkoutError.textContent = "Please enter complete card details.";
                    return;
                }
            }

            checkoutError.textContent = "";
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = "Processing...";

            try {
                const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: cart,
                        customer: { name, phone, email, address, city, pincode },
                        couponCode: currentCoupon ? currentCoupon.code : "",
                        paymentMethod
                    })
                });
                const data = await res.json();

                if (data.success) {
                    // Success!
                    cart = [];
                    currentCoupon = null;
                    saveCart();
                    closeCheckout();
                    showConfirmation(data.order);
                } else {
                    checkoutError.textContent = data.error || "Failed to place order.";
                }
            } catch (err) {
                console.error(err);
                checkoutError.textContent = "Network error. Please try again.";
            } finally {
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = `<span class="material-symbols-outlined">lock</span> Place Order`;
            }
        });
    }

    function showConfirmation(order) {
        confirmOrderId.textContent = `Order ID: ${order.orderId}`;
        confirmDetails.innerHTML = `
            <strong>Delivery To:</strong> ${order.customer.name} <br>
            ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode} <br><br>
            <strong>Total Amount:</strong> ₹${order.total} <br>
            <strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()} <br>
            <strong>Status:</strong> ${order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending (COD)'}
        `;
        confirmOverlay.classList.add("open");
    }

    if (confirmDoneBtn) {
        confirmDoneBtn.addEventListener("click", () => {
            confirmOverlay.classList.remove("open");
        });
    }

    // Expose needed functions to global scope for inline onclicks
    window.dinshaw = { updateQuantity, removeFromCart };

    // Init Products & Cart
    fetchProducts();
    updateCartUI();

    // ══════════════════════════════════════════
    //   OTHER INTERACTIONS
    // ══════════════════════════════════════════

    // Buy Now button in header → scroll to pricing
    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", () => {
            smoothScrollTo("#pricing");
            showToast("Select a size to add to cart! 👇", "🛒");
        });
    }

    // Store Locator search
    const searchLocatorBtn = document.getElementById("searchLocatorBtn");
    const locatorInput = document.getElementById("locatorInput");
    if (searchLocatorBtn) {
        searchLocatorBtn.addEventListener("click", () => {
            const query = locatorInput ? locatorInput.value.trim() : "";
            if (query) {
                showToast(`Searching for stores near "${query}"...`, "📍");
                setTimeout(() => showToast(`3 Dinshaw's stores found near ${query}!`, "🏪"), 1500);
            } else {
                showToast("Please enter a zip code or city name.", "⚠️");
                if (locatorInput) locatorInput.focus();
            }
        });
    }

    // Nav logo → scroll to top
    const navLogo = document.querySelector(".nav-logo");
    if (navLogo) {
        navLogo.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // ══════════════════════════════════════════
    //   INTERSECTION OBSERVER (Reveal on Scroll)
    // ══════════════════════════════════════════
    function setupRevealObserver() {
        const observerOptions = {
            root: null,
            threshold: 0.15,
            rootMargin: "0px 0px -40px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all animatable cards
        document.querySelectorAll(
            ".benefit-card, .pricing-card, .ingredient-image-card"
        ).forEach(el => observer.observe(el));
    }

    // ══════════════════════════════════════════
    //   CARTOON CHARACTER — EYE TRACKING
    // ══════════════════════════════════════════
    const LEFT_EYE_CX = 45, LEFT_EYE_CY = 55;
    const RIGHT_EYE_CX = 75, RIGHT_EYE_CY = 55;
    const MAX_PUPIL_OFFSET = 5;

    function updateEyes(mouseX, mouseY) {
        if (!cartoonEl) return;

        const rect = cartoonEl.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height * 0.4;

        const dx = mouseX - charCenterX;
        const dy = mouseY - charCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const offsetX = (dx / dist) * Math.min(MAX_PUPIL_OFFSET, dist * 0.02);
        const offsetY = (dy / dist) * Math.min(MAX_PUPIL_OFFSET, dist * 0.02);

        if (leftPupil) {
            leftPupil.setAttribute("cx", LEFT_EYE_CX + offsetX);
            leftPupil.setAttribute("cy", LEFT_EYE_CY + offsetY);
        }
        if (rightPupil) {
            rightPupil.setAttribute("cx", RIGHT_EYE_CX + offsetX);
            rightPupil.setAttribute("cy", RIGHT_EYE_CY + offsetY);
        }
    }

    let eyeRaf = null;
    document.addEventListener("mousemove", (e) => {
        if (eyeRaf) return;
        eyeRaf = requestAnimationFrame(() => {
            updateEyes(e.clientX, e.clientY);
            eyeRaf = null;
        });
    });

    // Speech bubble messages — cycle on click
    const speeches = [
        "Try Malaidaar Lassi! 🥛",
        "Sweet & Thick! 😋",
        "Since 1922! ✨",
        "So creamy! 🤍",
        "Best thirst quencher! 💧",
        "₹30 only! 🎉",
        "Order now! 🛒"
    ];
    let speechIndex = 0;
    const speechEl = document.getElementById("characterSpeech");

    if (cartoonEl && speechEl) {
        cartoonEl.addEventListener("click", () => {
            speechIndex = (speechIndex + 1) % speeches.length;
            speechEl.textContent = speeches[speechIndex];
            speechEl.style.opacity = "1";
            speechEl.style.visibility = "visible";
            speechEl.style.transform = "translateX(-50%) translateY(0)";
            setTimeout(() => {
                speechEl.style.opacity = "";
                speechEl.style.visibility = "";
                speechEl.style.transform = "";
            }, 2500);
        });
    }

    // ══════════════════════════════════════════
    //   ACTIVE NAV LINK HIGHLIGHTING
    // ══════════════════════════════════════════
    function updateActiveNav() {
        const sections = ["benefits", "products", "pricing", "ingredients", "locator"];
        const navLinks = document.querySelectorAll(".nav-link");
        let current = "";

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 120 && rect.bottom > 120) {
                    current = id;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    }

    // ══════════════════════════════════════════
    //   INIT
    // ══════════════════════════════════════════
    async function init() {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        mainNav.classList.add("nav-transparent");
        cartoonEl.classList.add("char-hidden");

        // Preload
        await preloadImages();
        isLoaded = true;
        drawFrame(0);

        if (isOldServer) {
            setTimeout(() => {
                alert("🚨 CRITICAL WARNING 🚨\n\nYou are using the old server on port 8080!\n\nThe Shopping Cart, Checkout, and Database will NOT work here.\n\nPlease open a new tab and go to: http://localhost:3000");
                showToast("Open http://localhost:3000 to use Cart!", "⚠️");
            }, 1500);
        }

        // Hide loader
        loader.classList.add("hidden");

        // Show scroll indicator
        setTimeout(() => {
            scrollIndicator.classList.add("visible");
        }, 600);

        // Show character
        setTimeout(() => {
            cartoonEl.classList.remove("char-hidden");
            cartoonEl.classList.add("char-visible");
        }, 1200);

        // Bind scroll
        window.addEventListener("scroll", () => {
            throttledScroll();
            updateActiveNav();
        }, { passive: true });

        // Setup reveal animations
        setupRevealObserver();

        // Initial checks
        onScroll();
        updateActiveNav();
    }

    init();
})();
