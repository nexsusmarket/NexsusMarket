import { topDeals } from "./topDealsProducts.js";
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

/**
 * Renders the products with the new Professional Card Design
 */
function renderTopDeals(wishlist = [], cart = []) {
    const container = document.querySelector(".top-product-list");
    if (!container) return;

    const items = topDeals?.[0]?.items || [];
    let html = "";

    items.forEach(item => {
        const discount = Math.round(((item.mrpprice - item.dealprice) / item.mrpprice) * 100);
        
        // State Checks
        const inWishlist = wishlist.some(p => p.name === item.name);
        const inCart = cart.some(p => p.name === item.name);

        const heartClass = inWishlist ? "fas text-red-500" : "far";
        const btnClass = inCart ? "deal-cart-btn added" : "deal-cart-btn default";
        const btnText = inCart ? "Go to Cart" : "Add to Cart";
        const btnIcon = inCart ? "fa-check" : "fa-shopping-cart";

        html += `
            <article class="deal-card group" data-name="${encodeURIComponent(item.name)}">
                
                <div class="deal-image-wrapper">
                    <span class="deal-badge">-${discount}%</span>
                    <button class="deal-wishlist-btn wishlist-btn">
                        <i class="${heartClass} fa-heart"></i>
                    </button>
                    <img src="${item.image}" alt="${item.name}" class="deal-image" loading="lazy">
                </div>

                <div class="deal-content">
                    <div class="deal-category">${item.category}</div>
                    <h3 class="deal-title" title="${item.name}">${item.name}</h3>
                    
                    <div class="deal-price-row">
                        <span class="current-price">₹${item.dealprice.toLocaleString('en-IN')}</span>
                        <span class="old-price">₹${item.mrpprice.toLocaleString('en-IN')}</span>
                    </div>

                    <button class="${btnClass} action-cart-btn">
                        <i class="fas ${btnIcon}"></i> <span>${btnText}</span>
                    </button>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}
function highlightActiveLink() {
    // 1. Get the current page filename (e.g., "topDeals.html" or "mobile")
    const currentPage = window.location.pathname.split("/").pop();
    const currentSearch = window.location.search; // For category pages like ?category=mobile

    // 2. Select all navigation links
    const navLinks = document.querySelectorAll('.nav-item');

    navLinks.forEach(link => {
        // Get the href attribute of the link
        const linkHref = link.getAttribute('href');

        // 3. Check if the link matches the current page
        // We check if the href matches the page name OR the full category query
        if (linkHref === currentPage || (currentSearch && linkHref.includes(currentSearch))) {
            
            // REMOVE default styling (if needed)
            link.classList.remove('text-white', 'hover:text-yellow-300');

            // ADD your specific "Gold" styling classes
            // This matches the code snippet you shared:
            link.classList.add(
                'text-yellow-300', 
                'font-bold', 
                'border-b-2', 
                'border-yellow-300', 
                'pb-0.5'
            );
        } else {
            // Ensure non-active links have default styling
            link.classList.add('text-white');
            link.classList.remove('text-yellow-300', 'font-bold', 'border-b-2', 'border-yellow-300', 'pb-0.5');
        }
    });
}

// Run this when the page loads
document.addEventListener('DOMContentLoaded', highlightActiveLink);
/**
 * Handles clicks: Card -> Detail, Buttons -> Actions
 */
function attachListeners() {
    const container = document.querySelector(".top-product-list");
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const card = e.target.closest('.deal-card');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.name);
        const itemData = topDeals[0].items.find(i => i.name === productName);
        
        if (!itemData) return;

        const productPayload = {
            name: itemData.name,
            image: itemData.image,
            price: itemData.dealprice,
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
            
            cartBtn.className = "deal-cart-btn added";
            cartBtn.innerHTML = '<i class="fas fa-check"></i> Go to Cart';
            
            updateHeaderCounts();
            return;
        }

        // 3. Card Click -> Go to Detail
        if (localStorage.getItem('userAuthToken')) {
            postViewedItem(productPayload);
        }
        window.location.href = `./detail.html?name=${encodeURIComponent(productName)}`;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();
    
    // Initial Render (Fast)
    renderTopDeals(); 

    // Fetch User Data & Re-render (Slow)
    if (localStorage.getItem('userAuthToken')) {
        try {
            const userData = await fetchUserData();
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
            renderTopDeals(userData.wishlist, userData.cart);
        } catch (e) { console.error(e); }
    }

    attachListeners();
});