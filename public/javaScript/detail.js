import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';
import { setupSearchBar } from "./searchHandler.js";

// --- Header Badge Updater ---
async function updateHeaderCounts() {
    try {
        const userData = await fetchUserData();
        if (userData) {
            localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
            localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
            if (window.updateHeader) window.updateHeader();
        }
    } catch (error) {
        console.error("Header update failed", error);
    }
}

// --- Flying Animations ---
function animateFlyTo(startEl, targetId, iconClass) {
    const targetEl = document.getElementById(targetId) || document.getElementById('account-btn');
    if (!startEl || !targetEl) return;

    const start = startEl.getBoundingClientRect();
    const end = targetEl.getBoundingClientRect();

    const flyer = document.createElement('i');
    flyer.className = `${iconClass} fixed z-[9999] text-2xl text-purple-600 pointer-events-none`;
    flyer.style.left = `${start.left + start.width/2}px`;
    flyer.style.top = `${start.top + start.height/2}px`;
    document.body.appendChild(flyer);

    // Force reflow
    flyer.getBoundingClientRect();

    flyer.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
    flyer.style.left = `${end.left + end.width/2}px`;
    flyer.style.top = `${end.top + end.height/2}px`;
    flyer.style.transform = 'scale(0.2)';
    flyer.style.opacity = '0';

    setTimeout(() => flyer.remove(), 800);
}

// --- HELPER: Generate Random Deals ---
function generateDeals(allProducts) {
    if (!allProducts || allProducts.length === 0) return [];

    // 1. Shuffle Array
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());

    // 2. Take 15 items
    const selectedItems = shuffled.slice(0, 15);

    // 3. Apply Discounts & Dates
    return selectedItems.map(product => {
        // Generate a random discount between 15% and 40%
        const discountPercent = Math.floor(Math.random() * (40 - 15 + 1)) + 15;
        
        // Calculate Deal Price (Lower than actual price in JSON)
        const dealPrice = Math.floor(product.price * ((100 - discountPercent) / 100));
        
        // Fake MRP (Higher than JSON price to show big savings)
        const fakeMRP = Math.floor(product.price * 1.2);

        // Date Logic: Current Date + 10 to 15 days
        const today = new Date();
        const daysToAdd = 10 + Math.floor(Math.random() * 6); // Min 10, Max 15
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + daysToAdd);

        return {
            ...product,
            dealPrice: dealPrice,
            mrpPrice: fakeMRP,
            discount: discountPercent,
            endDate: endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        };
    });
}

/**
 * Renders the products with the new Professional Card Design
 */
function renderTopDeals(dealItems, wishlist = [], cart = []) {
    const container = document.querySelector(".top-product-list");
    if (!container) return;

    if (dealItems.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">Loading best deals for you...</div>`;
        return;
    }

    let html = "";

    dealItems.forEach(item => {
        // State Checks
        const inWishlist = wishlist.some(p => p.name === item.name);
        const inCart = cart.some(p => p.name === item.name);

        const heartClass = inWishlist ? "fas text-red-500" : "far";
        const btnClass = inCart ? "deal-cart-btn added" : "deal-cart-btn default";
        const btnText = inCart ? "Go to Cart" : "Add to Cart";
        const btnIcon = inCart ? "fa-check" : "fa-shopping-cart";

        // Store deal price in data attribute for click handler
        html += `
            <article class="deal-card group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full relative" 
                     data-name="${encodeURIComponent(item.name)}" 
                     data-deal-price="${item.dealPrice}">
                
                <div class="deal-image-wrapper relative pt-4 px-4 flex justify-center items-center h-56 bg-gray-50 overflow-hidden">
                    <span class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10">
                        -${item.discount}% OFF
                    </span>

                    <span class="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white text-[10px] font-medium px-2 py-1 rounded-full shadow-sm z-10 backdrop-blur-sm flex items-center gap-1">
                        <i class="fas fa-clock text-yellow-400"></i> Ends ${item.endDate}
                    </span>

                    <button class="deal-wishlist-btn wishlist-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-20">
                        <i class="${heartClass} fa-heart"></i>
                    </button>

                    <img src="${item.image}" alt="${item.name}" class="deal-image object-contain h-full w-full max-w-[80%] transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" loading="lazy">
                </div>

                <div class="deal-content p-4 flex flex-col flex-grow">
                    <div class="deal-category text-[10px] uppercase font-bold text-purple-600 mb-1 tracking-wider">${item.category}</div>
                    <h3 class="deal-title text-sm font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[40px]" title="${item.name}">${item.name}</h3>
                    
                    <div class="deal-price-row flex items-baseline gap-2 mb-4 mt-auto">
                        <span class="current-price text-xl font-bold text-gray-900">₹${item.dealPrice.toLocaleString('en-IN')}</span>
                        <span class="old-price text-xs text-gray-400 line-through">₹${item.mrpPrice.toLocaleString('en-IN')}</span>
                    </div>

                    <button class="${btnClass} action-cart-btn w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${inCart ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-purple-600'}">
                        <i class="fas ${btnIcon}"></i> <span>${btnText}</span>
                    </button>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

/**
 * Handles clicks: Card -> Detail, Buttons -> Actions
 */
function attachListeners(dealItems) {
    const container = document.querySelector(".top-product-list");
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const card = e.target.closest('.deal-card');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.name);
        const itemData = dealItems.find(i => i.name === productName);
        
        if (!itemData) return;

        // Use Deal Price for adding to cart directly from this page
        const productPayload = {
            name: itemData.name,
            image: itemData.image,
            price: itemData.dealPrice, // Important: Use the discounted price
            category: itemData.category
        };

        // 1. Wishlist Click
        const wishBtn = e.target.closest('.wishlist-btn');
        if (wishBtn) {
            e.stopPropagation();
            if (!window.checkAuth()) return;

            const icon = wishBtn.querySelector('i');
            const isAdding = icon.classList.contains('far');

            if (isAdding) {
                icon.classList.replace('far', 'fas');
                icon.classList.add('text-red-500');
                animateFlyTo(wishBtn, 'header-wishlist-icon', 'fas fa-heart');
            } else {
                icon.classList.replace('fas', 'far');
                icon.classList.remove('text-red-500');
            }

            await updateWishlist(productPayload);
            updateHeaderCounts();
            return;
        }

        // 2. Add/Go Cart Click
        const cartBtn = e.target.closest('.action-cart-btn');
        if (cartBtn) {
            e.stopPropagation();
            
            // If already added, go to cart page
            if (cartBtn.classList.contains('added')) {
                window.location.href = './cart.html';
                return;
            }

            if (!window.checkAuth()) return;

            // Animate & Update UI
            animateFlyTo(cartBtn, 'header-cart-icon', 'fas fa-shopping-cart');
            cartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            
            await addToCart(productPayload);
            
            cartBtn.className = "deal-cart-btn added w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-green-100 text-green-700";
            cartBtn.innerHTML = '<i class="fas fa-check"></i> Go to Cart';
            
            updateHeaderCounts();
            return;
        }

        // 3. Card Click -> Go to Detail WITH DEAL PRICE
        if (localStorage.getItem('userAuthToken')) {
            postViewedItem(productPayload);
        }
        // 👇 THIS IS THE KEY CHANGE: Passing dealPrice in URL
        window.location.href = `./detail.html?name=${encodeURIComponent(productName)}&dealPrice=${itemData.dealPrice}`;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();
    
    try {
        // 1. Fetch Raw Products
        const response = await fetch('./javaScript/products.json');
        if (!response.ok) throw new Error("Failed to fetch products");
        const allProducts = await response.json();

        // 2. Generate Random Deals
        const randomDeals = generateDeals(allProducts);

        // 3. Get User Data for Wishlist/Cart status
        let wishlist = [];
        let cart = [];
        if (localStorage.getItem('userAuthToken')) {
            try {
                const userData = await fetchUserData();
                wishlist = userData.wishlist || [];
                cart = userData.cart || [];
                localStorage.setItem("wishlistProducts", JSON.stringify(wishlist));
                localStorage.setItem("cartProducts", JSON.stringify(cart));
            } catch (e) { console.error("User data fetch error", e); }
        }

        // 4. Render
        renderTopDeals(randomDeals, wishlist, cart);
        attachListeners(randomDeals);

    } catch (error) {
        console.error("Top Deals Error:", error);
        document.querySelector(".top-product-list").innerHTML = `<div class="col-span-full text-center text-red-500">Failed to load top deals.</div>`;
    }
});