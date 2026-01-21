import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';
import { setupSearchBar } from "./searchHandler.js";

// --- API URL SETUP ---
const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://nexus-backend.onrender.com';

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

// --- HELPER: Fetch Reviews from Backend ---
async function fetchProductReviews(productName) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/product/reviews?productName=${encodeURIComponent(productName)}`);
        if (!res.ok) return { reviews: [], average: 0, totalReviews: 0 };
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch reviews", e);
        return { reviews: [], average: 0, totalReviews: 0 };
    }
}

// --- HELPER: Generate Star HTML ---
function getStarHtml(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star text-yellow-400"></i>';
    if (hasHalfStar) html += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    
    // Fill remaining with empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star text-gray-300"></i>';
    
    return html;
}

/**
 * Finds a product by its name from the flat JSON array.
 */
function findProductByName(allProductsData, name) {
    if (!allProductsData || !Array.isArray(allProductsData)) return null;
    return allProductsData.find(item => item.name === name);
}

/**
 * Helper to get related products (Random items from same category or random fallback)
 */
function getRelatedProducts(allProductsData, currentProduct) {
    if (!allProductsData || !currentProduct) return [];

    // Filter items in the same category, excluding the current one
    const sameCategory = allProductsData.filter(item => 
        item.category === currentProduct.category && item.name !== currentProduct.name
    );

    // If we have less than 4 items, fill with random items from other categories
    let related = [...sameCategory];
    if (related.length < 8) {
        const others = allProductsData.filter(item => item.category !== currentProduct.category);
        related = [...related, ...others];
    }

    // Shuffle and slice to get random 15
    return related.sort(() => 0.5 - Math.random()).slice(0, 15);
}

/**
 * Renders the product details.
 */
async function renderProductDetails(product, allProductsData, userData = { wishlist: [], cart: [] }) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const { wishlist, cart } = userData;
    const isInWishlist = wishlist.some(p => p && p.name === product.name);
    const isInCart = cart.some(p => p && p.name === product.name);

    // Calculations
    const originalPrice = Math.round(product.price * 1.25); 
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

    // --- FETCH REAL REVIEWS ---
    const reviewData = await fetchProductReviews(product.name);
    const { reviews, average, totalReviews } = reviewData;
    const starHtml = getStarHtml(parseFloat(average));

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

    // Review List HTML Generator
    const reviewListHtml = reviews.length > 0 ? reviews.map(r => {
        const initial = r.userName.charAt(0).toUpperCase();
        const dateStr = new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const rStars = getStarHtml(r.rating);
        
        return `
        <div class="border-b border-gray-100 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    ${initial}
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-900 text-sm">${r.userName}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="text-xs flex">${rStars}</div>
                                <span class="text-xs text-gray-400">&bull; ${dateStr}</span>
                            </div>
                        </div>
                        <div class="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-1 rounded-full flex items-center">
                            <i class="fas fa-check-circle mr-1"></i> Certified Buyer
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mt-3 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        "${r.reviewText}"
                    </p>
                </div>
            </div>
        </div>`;
    }).join('') : `<div class="text-center py-8 text-gray-500">No reviews yet. Be the first to review this product!</div>`;

    // Button States for Main Product
    const cartBtnClass = isInCart 
        ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' 
        : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50';

    const cartBtnText = isInCart ? 'Go to Cart' : 'Add to Cart';
    const cartBtnIcon = isInCart ? 'fa-check' : 'fa-shopping-cart';

    // Student Discount Logic
    const cat = (product.category || '').toLowerCase();
    const isEligibleForStudentDiscount = product.price >= 1000 && 
        (cat.includes('mobile') || cat.includes('laptop') || cat.includes('phone') || cat.includes('iphone'));
    
    const gridColsClass = isEligibleForStudentDiscount ? 'grid-cols-4' : 'grid-cols-3';
    
    const studentIconHtml = isEligibleForStudentDiscount ? `
        <div class="flex flex-col items-center text-center gap-1">
            <div class="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mb-0.5">
                <i class="fas fa-user-graduate text-xs"></i>
            </div>
            <span class="text-[10px] font-bold text-gray-600 leading-tight">Student<br>Offer</span>
        </div>` : '';


    // --- GENERATE RELATED PRODUCTS HTML (EXPLORE STYLE) ---
    const relatedProducts = getRelatedProducts(allProductsData, product);
    let relatedProductsHtml = '';

    if (relatedProducts.length > 0) {
        const relatedItemsHtml = relatedProducts.map(item => {
            const isRelInWishlist = wishlist.some(p => p && p.name === item.name);
            const isRelInCart = cart.some(p => p && p.name === item.name);
            
            const heartIconClass = isRelInWishlist ? 'fas text-red-500' : 'far';
            const relCartBtnText = isRelInCart ? 'Go to Cart' : 'Add to Cart';
            const relCartBtnClass = isRelInCart 
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700 text-white';

            return `
            <div class="product-container animate-fadeIn bg-white" data-product-name="${encodeURIComponent(item.name)}">
                <div class="product-image-container">
                    <img class="product-image" src="${item.image}">
                    <div class="wishlist-icon text-2xl"><i class="${heartIconClass} fa-heart"></i></div>
                </div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">Price ₹${item.price.toLocaleString('en-IN')}</div>
                <button class="${relCartBtnClass} px-4 py-2 rounded-lg text-sm font-semibold transition mt-auto">
                    ${relCartBtnText}
                </button>
            </div>
            `;
        }).join('');

        relatedProductsHtml = `
            <div class="mt-12 pt-8 border-t border-gray-200">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 px-4 border-l-4 border-purple-600">Similar Products</h2>
                <div id="related-products-grid" class="products-grid">
                    ${relatedItemsHtml}
                </div>
            </div>
        `;
    }

    // --- MAIN HTML TEMPLATE ---
    const html = `
        <div class="max-w-7xl mx-auto p-4 md:p-8">
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
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

                        <div class="flex items-center mb-5 cursor-pointer" onclick="document.getElementById('reviews-section').scrollIntoView({behavior: 'smooth'})">
                            <div class="flex text-yellow-400 text-xs">
                                ${starHtml}
                            </div>
                            <span class="text-gray-500 text-xs ml-2 font-medium underline hover:text-purple-600">
                                ${average} (${totalReviews} Reviews)
                            </span>
                        </div>

                        <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <div class="flex items-end flex-wrap gap-2">
                                <span class="text-3xl font-bold text-gray-900">₹${product.price.toLocaleString('en-IN')}</span>
                            </div>
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

                        <div class="grid ${gridColsClass} gap-2 py-4 border-t border-gray-100 mb-6">
                             ${studentIconHtml}
                             <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-0.5"><i class="fas fa-shield-alt text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">1 Year<br>Warranty</span></div>
                             <div class="flex flex-col items-center text-center gap-1"><div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-0.5"><i class="fas fa-undo text-xs"></i></div><span class="text-[10px] font-bold text-gray-600 leading-tight">2 Days<br>Return</span></div>
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

            <div id="reviews-section" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900">Customer Reviews</h2>
                        <div class="flex items-center gap-2 mt-1">
                            <div class="flex text-yellow-400 text-sm">${starHtml}</div>
                            <span class="text-sm font-medium text-gray-600">${average} out of 5</span>
                        </div>
                    </div>
                    <div class="text-sm text-gray-500 font-medium">
                        ${totalReviews} Global Ratings
                    </div>
                </div>
                
                <div class="p-6 md:p-8">
                    ${reviewListHtml}
                </div>
            </div>

            ${relatedProductsHtml}

        </div>
    `;
    container.innerHTML = html;
}

/**
 * Attaches event listeners using EVENT DELEGATION.
 * This fixes the issue where buttons stop working after the HTML is refreshed.
 */
function attachDetailEventListeners(product, allProductsData) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    // EVENT DELEGATION: Listener attached to the container, not the buttons directly
    container.addEventListener('click', async (event) => {
        
        // --- 1. HANDLE BUY NOW (Modified for Direct Checkout) ---
        const buyNowBtn = event.target.closest('#buy-now-btn');
        if (buyNowBtn) {
            if (!window.checkAuth()) return;
            
            buyNowBtn.innerHTML = `<i class="fas fa-spinner fa-spin text-sm"></i> Processing...`;

            // Create a temporary cart item
            const buyNowItem = {
                ...product,
                quantity: 1,
                selectedOfferId: 'none',
                discount: 0,
                pricePaid: product.price
            };

            // Save for checkout
            localStorage.setItem('checkoutReadyCart', JSON.stringify([buyNowItem]));
            localStorage.setItem('buyNowMode', 'true'); // Flag to tell checkout page

            // Go Directly to Checkout (Do NOT call API)
            window.location.href = './checkout.html';
            return;
        }

        // --- 2. HANDLE ADD TO CART / GO TO CART ---
        const cartBtn = event.target.closest('#add-to-cart-btn');
        if (cartBtn) {
            if (cartBtn.textContent.trim().includes('Go to Cart')) {
                window.location.href = './cart.html';
                return;
            }

            if (!window.checkAuth()) return;
            
            animateFlyToCart(cartBtn);
            cartBtn.innerHTML = `<i class="fas fa-spinner fa-spin text-sm"></i> Adding...`;
            
            try {
                await addToCart(product);
                // Refresh data
                const newUserData = await fetchUserData();
                await renderProductDetails(product, allProductsData, newUserData);
                if (window.updateHeader) window.updateHeader();
            } catch (error) {
                console.error("Add to cart error", error);
                cartBtn.innerHTML = `<i class="fas fa-shopping-cart text-sm"></i> Add to Cart`;
            }
            return;
        }

        // --- 3. HANDLE WISHLIST (Main Image) ---
        const imgWishlistBtn = event.target.closest('#img-wishlist-btn');
        if (imgWishlistBtn) {
            if (!window.checkAuth()) return;

            const icon = imgWishlistBtn.querySelector('i');
            const isAdding = icon.classList.contains('far');

            if (isAdding) {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500');
                imgWishlistBtn.classList.add('text-red-500');
                imgWishlistBtn.classList.remove('text-gray-400');
                animateFlyToWishlist(imgWishlistBtn);
            } else {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far');
                imgWishlistBtn.classList.remove('text-red-500');
                imgWishlistBtn.classList.add('text-gray-400');
            }

            await updateWishlist(product);
            const newUserData = await fetchUserData();
            await renderProductDetails(product, allProductsData, newUserData);
            if (window.updateHeader) window.updateHeader();
            return;
        }

        // --- 4. HANDLE THUMBNAILS ---
        const thumbBtn = event.target.closest('.thumbnail-btn');
        if (thumbBtn) {
            const src = thumbBtn.dataset.src;
            const mainImage = document.getElementById('main-product-image');
            
            const allThumbs = container.querySelectorAll('.thumbnail-btn');
            allThumbs.forEach(t => {
                t.classList.remove('border-purple-600', 'ring-1', 'ring-purple-100');
                t.classList.add('border-gray-200');
            });
            
            thumbBtn.classList.remove('border-gray-200');
            thumbBtn.classList.add('border-purple-600', 'ring-1', 'ring-purple-100');

            mainImage.style.opacity = '0.5';
            setTimeout(() => {
                mainImage.src = src;
                mainImage.style.opacity = '1';
            }, 150);
            return;
        }

        // --- 5. RELATED PRODUCTS ---
        const relatedWishlist = event.target.closest('.wishlist-icon');
        if (relatedWishlist) {
            event.stopPropagation();
            if (!window.checkAuth()) return;
            const card = relatedWishlist.closest('.product-container');
            const itemName = decodeURIComponent(card.dataset.productName);
            const relatedItem = findProductByName(allProductsData, itemName);

            const icon = relatedWishlist.querySelector('i');
            const isAdding = icon.classList.contains('far');

            if (isAdding) {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500');
                animateFlyToWishlist(relatedWishlist);
            } else {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far');
            }
            
            await updateWishlist(relatedItem);
            if (window.updateHeader) window.updateHeader();
            return;
        }

        const relatedCartBtn = event.target.closest('.add-to-cart-btn');
        if (relatedCartBtn) {
            event.stopPropagation();
            if (!window.checkAuth()) return;
            const card = relatedCartBtn.closest('.product-container');
            const itemName = decodeURIComponent(card.dataset.productName);
            const relatedItem = findProductByName(allProductsData, itemName);
            animateFlyToCart(relatedCartBtn);
            relatedCartBtn.innerText = 'Go to Cart';
            relatedCartBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition mt-auto cursor-pointer';
            relatedCartBtn.classList.remove('add-to-cart-btn');
            relatedCartBtn.classList.add('go-to-cart-btn');
            await addToCart(relatedItem);
            if (window.updateHeader) window.updateHeader();
            return;
        }

        const relatedGoToCart = event.target.closest('button.bg-green-600');
        if (relatedGoToCart && relatedGoToCart.textContent.includes('Go to Cart')) {
            event.stopPropagation();
            window.location.href = './cart.html';
            return;
        }

        const productCard = event.target.closest('.product-container');
        if (productCard && !event.target.closest('button') && !event.target.closest('.wishlist-icon')) {
             const itemName = decodeURIComponent(productCard.dataset.productName);
             const relatedItem = findProductByName(allProductsData, itemName);
             if (localStorage.getItem('userAuthToken')) {
                 postViewedItem(relatedItem);
             }
             window.location.href = `./detail.html?name=${encodeURIComponent(itemName)}`;
        }
    });
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

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    // CLEANUP: Reset Buy Now flags if user comes here
    localStorage.removeItem('buyNowMode');
    localStorage.removeItem('checkoutReadyCart');

    setupSearchBar();

    const params = new URLSearchParams(window.location.search);
    const productName = decodeURIComponent(params.get('name'));
    const container = document.getElementById('product-detail-container');

    if (!productName || !container) {
        if(container) container.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-gray-700">Product Not Found</h2><a href="./index.html" class="text-purple-600 hover:underline mt-2 inline-block">Go Home</a></div>`;
        return;
    }

    try {
        const response = await fetch('./javascript/products.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allProductsData = await response.json();
        const product = findProductByName(allProductsData, productName);

        if (!product) {
            container.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-gray-700">Oops! Product Unavailable</h2><p class="text-gray-500">The product "${productName}" does not exist.</p><a href="./index.html" class="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-full">Continue Shopping</a></div>`;
            return;
        }

        const userToken = localStorage.getItem('userAuthToken');
        if (userToken) {
            try {
                const userData = await fetchUserData();
                localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
                localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
                await renderProductDetails(product, allProductsData, userData); 
            } catch (error) {
                console.error("Data fetch error:", error);
                await renderProductDetails(product, allProductsData);
            }
        } else {
            await renderProductDetails(product, allProductsData);
        }
        
        // Attach listener ONCE
        attachDetailEventListeners(product, allProductsData);

    } catch (error) {
        console.error("Failed to load product data:", error);
        container.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-red-600">Error</h2><p class="text-gray-500">Failed to load product data.</p></div>`;
    }
});