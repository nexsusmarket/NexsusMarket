import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';

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
 * Renders all products using the universal card style.
 * Updated for Flat JSON structure.
 */
function renderAllProducts(allProductsData, wishlist = [], cart = []) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;
    
    if (!allProductsData || !Array.isArray(allProductsData)) {
        productsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No products loaded.</p>';
        return;
    }

    let productHtml = "";
    
    // Direct loop since products.json is a flat array
    allProductsData.forEach(item => {
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
                <button class="${cartButtonClass} px-4 py-2 rounded-lg text-sm font-semibold transition">
                    ${cartButtonText}
                </button>
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
        localStorage.setItem("viewedItems", JSON.stringify(userData.viewedItems || [])); 
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
    const savedPos = sessionStorage.getItem('exploreScrollPos');
    if (savedPos) {
        window.scrollTo(0, parseInt(savedPos));
        sessionStorage.removeItem('exploreScrollPos'); 
    }
}

/**
 * Attaches event listeners for all product interactions.
 */
function attachProductEventListeners(allProductsData) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    productsContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-container');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        
        // Find product directly in flat array
        const productData = allProductsData.find(p => p.name === productName);
        
        if (!productData) return;
        
        // --- 1. Clicked on Wishlist Icon ---
        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return; // Check for login here
            
            const iconBtn = event.target.closest('.wishlist-icon');
            const icon = iconBtn.querySelector('i');

            // Optimistic UI Update
            if (icon.classList.contains('fas')) {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far');
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500');
                animateFlyToWishlist(iconBtn); // Animate only on add
            }

            // Background API Call
            await updateWishlist(productData);
            updateHeaderCounts();
        } 
        
        // --- 2. Clicked on "Add to Cart" Button ---
        else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return; // Check for login here
            
            const btn = event.target.closest('.add-to-cart-btn');
            
            // Animation
            animateFlyToCart(btn);

            // Optimistic UI Update (Green "Go to Cart")
            btn.textContent = 'Go to Cart';
            btn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer';
            
            // Background API Call
            await addToCart(productData);
            updateHeaderCounts();
        }
        
        // --- 3. Clicked on "Go to Cart" Button ---
        else if(event.target.closest('button.bg-green-600') && event.target.textContent.trim() === 'Go to Cart') {
            window.location.href = './cart.html';
        }
        
        // --- 4. Clicked anywhere else (Image, Name, Price) - NAVIGATION ---
        else {
            if (localStorage.getItem('userAuthToken')) {
                postViewedItem(productData); // Fire and forget
            }
            
            // SAVE SCROLL POSITION BEFORE NAVIGATING
            sessionStorage.setItem('exploreScrollPos', window.scrollY);
            
            window.location.href = `./detail.html?name=${encodeURIComponent(productName)}`;
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
/**
 * Main function to set up the page on load.
 */
document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();
    const userToken = localStorage.getItem('userAuthToken');

    try {
        // --- 1. Fetch JSON Data ---
        const response = await fetch('./javaScript/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allProductsData = await response.json();

        // --- 2. Attach Listeners ---
        attachProductEventListeners(allProductsData);

        // --- 3. Render Logic ---
        if (userToken) {
            try {
                const userData = await fetchUserData();
                localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
                localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
                localStorage.setItem("viewedItems", JSON.stringify(userData.viewedItems || [])); 
                renderAllProducts(allProductsData, userData.wishlist, userData.cart);
                restoreScrollPosition(); // Restore after render
            } catch (error) {
                console.error("Failed to fetch user data on page load:", error);
                renderAllProducts(allProductsData);
                restoreScrollPosition(); // Restore even on error
            }
        } else {
            renderAllProducts(allProductsData);
            restoreScrollPosition(); // Restore for guest
        }

    } catch (error) {
        console.error("Failed to load products data:", error);
        const productsContainer = document.getElementById("products-container");
        if (productsContainer) {
            productsContainer.innerHTML = '<p class="text-center text-red-500 col-span-full">Failed to load products. Please try again later.</p>';
        }
    }
});