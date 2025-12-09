import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';
import { product as allProductsData } from './products.js'; 

// --- Animation for Fly-to-Cart ---
function animateFlyToCart(buttonElement) {
    const accountButton = document.getElementById('account-btn');
    const targetElement = accountButton || document.getElementById('header-cart-icon'); 
    
    if (!targetElement || !buttonElement) return;

    const startRect = buttonElement.getBoundingClientRect();
    const endRect = targetElement.getBoundingClientRect();

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

    setTimeout(() => {
        flyingIcon.remove();
    }, 1000); 
}

// --- Animation for Fly-to-Wishlist ---
function animateFlyToWishlist(iconElement) {
    const accountButton = document.getElementById('account-btn');
    const targetElement = accountButton || document.getElementById('header-wishlist-icon'); 
    
    if (!targetElement || !iconElement) return;

    const startRect = iconElement.getBoundingClientRect();
    const endRect = targetElement.getBoundingClientRect();

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

    setTimeout(() => {
        flyingIcon.remove();
    }, 1000); 
}

/**
 * A generic function to render products from any brand.
 */
function renderProducts(productItems, wishlist = [], cart = []) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    if (!productItems || productItems.length === 0) {
          productsContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center">No products found for this brand.</p>`;
          return;
    }

    let productHtml = "";
    productItems.forEach(item => {
        const isInWishlist = wishlist.some(p => p && p.name === item.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
        const isInCart = cart.some(p => p && p.name === item.name);
        
        // Dynamic Button State
        const cartButtonText = isInCart ? 'Go to Cart' : 'Add to Cart';
        const cartButtonClass = isInCart 
            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
            : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700 text-white';

        productHtml += `
            <div class="product-container animate-fadeIn" data-product-name="${encodeURIComponent(item.name)}">
                <div class="product-image-container">
                    <img class="product-image" src="${item.image}">
                    <div class="wishlist-icon text-2xl"><i class="${heartIconClass} fa-heart"></i></div>
                </div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">Price ₹${item.price.toLocaleString('en-IN')}</div>
                <button class="${cartButtonClass} px-4 py-2 rounded-lg text-sm font-semibold transition">${cartButtonText}</button>
            </div>
        `;
    });
    productsContainer.innerHTML = productHtml;
}

/**
 * Updates header counts in the background without reloading the grid.
 */
async function updateHeaderCounts() {
    try {
        const userData = await fetchUserData();
        localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
        localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
        if (window.updateHeader) {
            window.updateHeader();
        }
    } catch (error) {
        console.error("Background header update failed", error);
    }
}

/**
 * Helper to restore scroll position
 */
function restoreScrollPosition() {
    const savedPos = sessionStorage.getItem('brandScrollPos');
    if (savedPos) {
        window.scrollTo(0, parseInt(savedPos));
        sessionStorage.removeItem('brandScrollPos');
    }
}

/**
 * Attaches generic event listeners for product interactions.
 */
function attachProductEventListeners(productItems) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    productsContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-container');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        const productData = productItems.find(p => p.name === productName);
        if (!productData) return;

        // Case 1: Clicked on Wishlist Icon
        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return;
            
            const iconBtn = event.target.closest('.wishlist-icon');
            const icon = iconBtn.querySelector('i');

            // Optimistic UI Update (Immediate visual change)
            if (icon.classList.contains('fas')) {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far');
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500');
                animateFlyToWishlist(iconBtn); // Animate only on add
            }

            // API Call & Background Update
            await updateWishlist(productData);
            updateHeaderCounts();
        }
        // Case 2: Clicked on "Add to Cart" Button
        else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return;
            
            const btn = event.target.closest('.add-to-cart-btn');
            
            // Animation
            animateFlyToCart(btn);

            // Optimistic UI Update (Change to "Go to Cart" green button)
            btn.textContent = 'Go to Cart';
            btn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer';
            
            // API Call & Background Update
            await addToCart(productData);
            updateHeaderCounts();
        }
        // Case 3: Clicked on "Go to Cart" Button
        else if (event.target.closest('button.bg-green-600')) {
            window.location.href = '/cart.html';
        }
        // Case 4: Clicked anywhere else (Image, Name, Price) - NAVIGATION
        else {
            if (localStorage.getItem('userAuthToken')) {
                postViewedItem(productData); // Fire and forget logic
            }
            
            // SAVE SCROLL POSITION BEFORE NAVIGATING
            sessionStorage.setItem('brandScrollPos', window.scrollY);
            
            window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
        }
    });
}

/**
 * Finds all products belonging to a specific brand across all categories.
 */
function filterProductsByBrand(brandName) {
    if (!allProductsData || !allProductsData[0] || !allProductsData[0].category) {
        return [];
    }

    const lowerBrandName = brandName.toLowerCase();
    const allCategories = allProductsData[0].category;
    let brandProducts = [];

    // Precise brand matching regex
    const brandRegex = new RegExp(`\\b${lowerBrandName}\\b`, 'i');

    allCategories.forEach(category => {
        category.items.forEach(item => {
            const lowerItemName = item.name.toLowerCase();
            if (brandRegex.test(lowerItemName)) {
                brandProducts.push(item);
            }
        });
    });

    return brandProducts;
}

/**
 * Main function to set up the page on load.
 */
document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();

    const params = new URLSearchParams(window.location.search);
    const brandName = params.get('name');

    const titleElement = document.getElementById('brand-title');
    const container = document.getElementById('products-container');

    if (!brandName) {
        titleElement.textContent = "Brand Not Found";
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">No brand was specified in the URL.</p>`;
        return;
    }

    const formattedBrandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    titleElement.textContent = `${formattedBrandName} Products`;
    document.title = `${formattedBrandName} - NexusMarket`;

    try {
        const productItems = filterProductsByBrand(brandName);

        if (!productItems || productItems.length === 0) {
            container.innerHTML = `<p class="text-gray-500 col-span-full text-center">No products found for the brand "${formattedBrandName}".</p>`;
            return;
        }
        
        attachProductEventListeners(productItems); 

        // Render products based on login status
        const userToken = localStorage.getItem('userAuthToken');
        if (userToken) {
            try {
                const userData = await fetchUserData();
                localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
                localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
                renderProducts(productItems, userData.wishlist, userData.cart);
                restoreScrollPosition(); // Restore after render
            } catch (fetchError) {
                console.error("Failed to fetch user data for brand page:", fetchError);
                renderProducts(productItems); 
                restoreScrollPosition(); // Restore even on error
            }
        } else {
            renderProducts(productItems);
            restoreScrollPosition(); // Restore for guest
        }

    } catch (error) {
        console.error(`An unexpected error occurred while processing brand "${brandName}":`, error);
        titleElement.textContent = `Error Loading ${formattedBrandName}`;
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">An error occurred while displaying products for this brand.</p>`;
    }
});