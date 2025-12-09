import { product as allProductsData } from "./products.js";
import { fetchUserData, updateWishlist, addToCart } from './apiService.js';
import { setupSearchBar } from "./searchHandler.js";

// --- ANIMATION 1: Fly to Cart ---
function animateFlyToCart(buttonElement) {
    const target = document.getElementById('account-btn'); 
    if (!target || !buttonElement) return;

    const startRect = buttonElement.getBoundingClientRect();
    const endRect = target.getBoundingClientRect();

    const flyingIcon = document.createElement('i');
    flyingIcon.className = 'fas fa-shopping-cart fly-to-cart-icon'; 
    document.body.appendChild(flyingIcon);

    flyingIcon.style.left = `${startRect.left + startRect.width / 2 - 15}px`;
    flyingIcon.style.top = `${startRect.top + startRect.height / 2 - 15}px`;

    setTimeout(() => {
        flyingIcon.style.left = `${endRect.left + endRect.width / 2 - 15}px`;
        flyingIcon.style.top = `${endRect.top + endRect.height / 2 - 15}px`;
        flyingIcon.style.transform = 'scale(0.2)';
        flyingIcon.style.opacity = '1';
    }, 10);

    setTimeout(() => flyingIcon.remove(), 1000);
}

// --- ANIMATION 2: Fly to Wishlist ---
function animateFlyToWishlist(iconElement) {
    const target = document.getElementById('account-btn'); 
    if (!target || !iconElement) return;

    const startRect = iconElement.getBoundingClientRect();
    const endRect = target.getBoundingClientRect();

    const flyingIcon = document.createElement('i');
    flyingIcon.className = 'fas fa-heart fly-to-wishlist-icon'; 
    document.body.appendChild(flyingIcon);

    flyingIcon.style.left = `${startRect.left + startRect.width / 2 - 15}px`;
    flyingIcon.style.top = `${startRect.top + startRect.height / 2 - 15}px`;

    setTimeout(() => {
        flyingIcon.style.left = `${endRect.left + endRect.width / 2 - 15}px`;
        flyingIcon.style.top = `${endRect.top + endRect.height / 2 - 15}px`;
        flyingIcon.style.transform = 'scale(0.2)';
        flyingIcon.style.opacity = '1';
    }, 10);

    setTimeout(() => flyingIcon.remove(), 1000);
}

/**
 * Finds a product by its name from the global product data.
 */
function findProductByName(name) {
    for (const section of allProductsData) {
        for (const cat of section.category) {
            const found = cat.items.find(item => item.name === name);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Renders the product details.
 */
function renderProductDetails(product, userData = { wishlist: [], cart: [] }) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const { wishlist, cart } = userData;
    const isInWishlist = wishlist.some(p => p && p.name === product.name);
    const isInCart = cart.some(p => p && p.name === product.name);

    // Calculations
    const originalPrice = Math.round(product.price * 1.25); 
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

    // Thumbnails
    const thumbnails = [product.image, ...(product.moreImages || [])];
    const thumbnailHtml = thumbnails.map((imgSrc, index) => `
        <button class="thumbnail-btn flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${index === 0 ? 'border-purple-600 ring-1 ring-purple-100' : 'border-gray-200 hover:border-gray-400'}" 
                data-src="${imgSrc}">
            <img src="${imgSrc}" class="w-full h-full object-cover" alt="View ${index + 1}">
        </button>
    `).join('');

    // Features
    const featuresHtml = (product.highlights || ['Premium Quality', 'Best in class performance', '1 Year Warranty'])
        .map(h => `<li class="flex items-start text-gray-600 mb-1.5 text-sm"><i class="fas fa-check-circle text-green-500 mt-0.5 mr-2.5 flex-shrink-0"></i><span>${h}</span></li>`)
        .join('');

    // Button States
    const cartBtnClass = isInCart 
        ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' 
        : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50';

    const cartBtnText = isInCart ? 'Go to Cart' : 'Add to Cart';
    const cartBtnIcon = isInCart ? 'fa-check' : 'fa-shopping-cart';

    // HTML Template
    const html = `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                <div class="lg:col-span-5 bg-gray-50 p-6 flex flex-col">
                    <div class="relative bg-white rounded-xl shadow-sm border border-gray-100 aspect-[4/3] flex items-center justify-center mb-4 overflow-hidden group">
                        <img id="main-product-image" src="${product.image}" alt="${product.name}" 
                             class="max-w-[90%] max-h-[90%] object-contain transform transition-transform duration-500 group-hover:scale-105">
                        
                        <span class="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Best Seller
                        </span>
                        
                         <button id="img-wishlist-btn" class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-lg z-10 transition-transform hover:scale-110 ${isInWishlist ? 'text-red-500' : 'text-gray-400'}">
                            <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>

                    <div id="thumbnail-container" class="flex space-x-2 overflow-x-auto hide-scroll pb-1 px-1 justify-center">
                        ${thumbnailHtml}
                    </div>
                </div>

                <div class="lg:col-span-7 p-6 lg:p-8 flex flex-col">
                    
                    <div class="flex items-center space-x-2 text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                        <span class="text-purple-600">${product.category}</span>
                        <span>&bull;</span>
                        <span>Nexus Approved</span>
                    </div>

                    <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                        ${product.name}
                    </h1>

                    <div class="flex items-center mb-5">
                        <div class="flex text-yellow-400 text-xs">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                        </div>
                        <span class="text-gray-500 text-xs ml-2 font-medium underline cursor-pointer hover:text-purple-600">4.5 (1,240 Reviews)</span>
                    </div>

                    <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <div class="flex items-end flex-wrap gap-2">
                            <span class="text-3xl font-bold text-gray-900">₹${product.price.toLocaleString('en-IN')}</span>
                            <div class="flex flex-col mb-1 ml-1">
                                <span class="text-sm text-gray-400 line-through font-medium">₹${originalPrice.toLocaleString('en-IN')}</span>
                            </div>
                            <span class="text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded self-center ml-1">${discount}% OFF</span>
                        </div>
                        <p class="text-gray-500 text-xs mt-1">Inclusive of all taxes. Free shipping.</p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 mb-6">
                        <button id="buy-now-btn" 
                                class="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-base font-bold py-3 px-6 rounded-lg shadow-md shadow-orange-100 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            <i class="fas fa-bolt text-sm"></i> 
                            Buy Now
                        </button>
                        
                        <button id="add-to-cart-btn" 
                                class="flex-1 ${cartBtnClass} text-base font-bold py-3 px-6 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            <i class="fas ${cartBtnIcon} text-sm"></i> 
                            ${cartBtnText}
                        </button>
                    </div>

                    <div class="grid grid-cols-4 gap-2 py-4 border-t border-b border-gray-100 mb-6">
                         <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-0.5"><i class="fas fa-truck-fast text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">Free<br>Delivery</span></div>
                         <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-0.5"><i class="fas fa-shield-alt text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">1 Year<br>Warranty</span></div>
                         <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-0.5"><i class="fas fa-undo text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">7 Days<br>Return</span></div>
                         <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 mb-0.5"><i class="fas fa-lock text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">Secure<br>Payment</span></div>
                    </div>

                    <div class="prose prose-purple max-w-none">
                        <h3 class="text-base font-bold text-gray-800 mb-2">About this item</h3>
                        <p class="text-gray-600 leading-relaxed mb-4 text-sm">
                            ${product.description || 'Experience the future with this cutting-edge product from NexusMarket. Designed for performance.'}
                        </p>
                        
                        <h3 class="text-base font-bold text-gray-800 mb-2">Key Highlights</h3>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            ${featuresHtml}
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

/**
 * Attaches event listeners.
 */
function attachDetailEventListeners(product) {
    const buyNowBtn = document.getElementById('buy-now-btn'); 
    const cartBtn = document.getElementById('add-to-cart-btn');
    const imgWishlistBtn = document.getElementById('img-wishlist-btn'); 
    const thumbnailContainer = document.getElementById('thumbnail-container');

    const refreshPageForUser = async () => {
        try {
            const newUserData = await fetchUserData();
            renderProductDetails(product, newUserData);
            attachDetailEventListeners(product); 
            window.updateHeader?.();
        } catch (error) {
            console.error("Refresh error:", error);
            renderProductDetails(product); 
            attachDetailEventListeners(product);
        }
    };

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            if (!window.checkAuth()) return;
            buyNowBtn.innerHTML = `<i class="fas fa-spinner fa-spin text-sm"></i> Processing...`;
            await addToCart(product);
            window.location.href = '/checkout.html'; 
        });
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', async () => {
            if (cartBtn.textContent.trim().includes('Go to Cart')) {
                window.location.href = '/cart.html';
                return;
            }
            if (!window.checkAuth()) return;
            
            animateFlyToCart(cartBtn);
            
            cartBtn.innerHTML = `<i class="fas fa-spinner fa-spin text-sm"></i> Adding...`;
            await addToCart(product);
            await refreshPageForUser();
        });
    }

    // --- MODIFIED WISHLIST HANDLER ---
    if (imgWishlistBtn) {
        imgWishlistBtn.addEventListener('click', async () => {
            if (!window.checkAuth()) return;
            
            const icon = imgWishlistBtn.querySelector('i');
            // Check if currently adding (currently 'far' means it's about to become 'fas')
            const isAdding = icon.classList.contains('far');

            // Visual toggle
            if(icon) icon.classList.toggle('fas');
            if(icon) icon.classList.toggle('far');
            imgWishlistBtn.classList.toggle('text-red-500');
            imgWishlistBtn.classList.toggle('text-gray-400');

            // Only animate if adding
            if (isAdding) {
                animateFlyToWishlist(imgWishlistBtn);
            }
            
            await updateWishlist(product);
            await refreshPageForUser();
        });
    }

    if (thumbnailContainer) {
        const thumbnails = thumbnailContainer.querySelectorAll('.thumbnail-btn');
        thumbnails.forEach(btn => {
            btn.addEventListener('click', () => {
                const src = btn.dataset.src;
                const mainImage = document.getElementById('main-product-image');
                mainImage.style.opacity = '0.5';
                setTimeout(() => {
                    mainImage.src = src;
                    mainImage.style.opacity = '1';
                }, 150);
                thumbnails.forEach(t => {
                    t.classList.remove('border-purple-600', 'ring-1', 'ring-purple-100');
                    t.classList.add('border-gray-200');
                });
                btn.classList.remove('border-gray-200');
                btn.classList.add('border-purple-600', 'ring-1', 'ring-purple-100');
            });
        });
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    setupSearchBar();

    const params = new URLSearchParams(window.location.search);
    const productName = decodeURIComponent(params.get('name'));
    const container = document.getElementById('product-detail-container');

    if (!productName || !container) {
        if(container) container.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-gray-700">Product Not Found</h2><a href="index.html" class="text-purple-600 hover:underline mt-2 inline-block">Go Home</a></div>`;
        return;
    }

    const product = findProductByName(productName);

    if (!product) {
        container.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-gray-700">Oops! Product Unavailable</h2><p class="text-gray-500">The product "${productName}" does not exist.</p><a href="index.html" class="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-full">Continue Shopping</a></div>`;
        return;
    }

    const userToken = localStorage.getItem('userAuthToken');
    if (userToken) {
        try {
            const userData = await fetchUserData();
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
            renderProductDetails(product, userData);
        } catch (error) {
            console.error("Data fetch error:", error);
            renderProductDetails(product);
        }
    } else {
        renderProductDetails(product);
    }
    
    attachDetailEventListeners(product);
});