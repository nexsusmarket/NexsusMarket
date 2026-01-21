import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';

// --- Animation for Fly-to-Cart ---
function animateFlyToCart(buttonElement) {
    const accountButton = document.getElementById('account-btn');
    const targetElement = accountButton || document.getElementById('header-cart-icon'); // Changed ID to match standard header icons
    
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
 * Renders products for a specific category.
 */
function renderCategoryProducts(productItems, wishlist = [], cart = []) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    if (!productItems || productItems.length === 0) {
         productsContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-12"><p class="text-gray-500 text-lg">No products found in this category.</p></div>`;
         return;
    }

    let productHtml = "";
    productItems.forEach(item => {
        const isInWishlist = wishlist.some(p => p && p.name === item.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far text-gray-400'; 
        const isInCart = cart.some(p => p && p.name === item.name);
        const cartButtonText = isInCart ? 'Go to Cart' : 'Add to Cart';
        
        // Dynamic classes based on state
        const cartButtonClass = isInCart 
            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
            : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700 text-white';

        productHtml += `
            <div class="product-container animate-fadeIn bg-white" data-product-name="${encodeURIComponent(item.name)}">
                <div class="product-image-container relative mb-4">
                    <img class="product-image object-contain h-40 w-full" src="${item.image}" alt="${item.name}">
                    <button class="wishlist-icon absolute top-0 right-0 p-2 text-2xl transition-transform hover:scale-110">
                        <i class="${heartIconClass} fa-heart transition-colors duration-300"></i>
                    </button>
                </div>
                <div class="product-name font-semibold text-gray-800 mb-1 h-12 overflow-hidden">${item.name}</div>
                <div class="product-price font-bold text-gray-900 mb-3">Price ₹${item.price.toLocaleString('en-IN')}</div>
                <button class="${cartButtonClass} px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm">
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
    const savedPos = sessionStorage.getItem('categoryScrollPos');
    if (savedPos) {
        window.scrollTo(0, parseInt(savedPos));
        sessionStorage.removeItem('categoryScrollPos');
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

        // --- 1. Wishlist Logic ---
        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return;
            
            const iconBtn = event.target.closest('.wishlist-icon');
            const icon = iconBtn.querySelector('i');
            
            // Visual Toggle (Immediate Feedback)
            const isHearted = icon.classList.contains('fas');
            if (isHearted) {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far', 'text-gray-400');
            } else {
                icon.classList.remove('far', 'text-gray-400');
                icon.classList.add('fas', 'text-red-500');
                animateFlyToWishlist(iconBtn); // Animate only on add
            }

            // API Call & Background Update
            await updateWishlist(productData);
            updateHeaderCounts();
        }
        
        // --- 2. Add to Cart Logic ---
        else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return;
            
            const btn = event.target.closest('.add-to-cart-btn');
            
            // Animate
            animateFlyToCart(btn);
            
            // Visual Update to "Go to Cart" (Green)
            btn.innerHTML = `Go to Cart`;
            btn.className = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm";
            // Remove the specific class so clicking again redirects instead of adding
            btn.classList.remove('add-to-cart-btn'); 

            // API Call & Background Update
            await addToCart(productData);
            updateHeaderCounts();
        }
        
        // --- 3. Go to Cart Logic ---
        else if (event.target.closest('button.bg-green-600')) {
            window.location.href = './cart.html';
        }
        
        // --- 4. Navigation Logic (Clicking Image/Title) ---
        else {
            if (localStorage.getItem('userAuthToken')) {
                postViewedItem(productData); // Fire and forget
            }
            
            // SAVE SCROLL POSITION BEFORE NAVIGATING
            sessionStorage.setItem('categoryScrollPos', window.scrollY);
            
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

    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get('category');

    const titleElement = document.getElementById('category-title');
    const container = document.getElementById('products-container');

    if (!categoryName) {
        titleElement.textContent = "Category Not Found";
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">No category was specified.</p>`;
        return;
    }

    // Formatting for display (e.g., "Home & Appliances")
    let formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    if (categoryName.toLowerCase() === 'homeappliances') formattedCategoryName = 'Home & Appliances';

    titleElement.textContent = formattedCategoryName;
    document.title = `${formattedCategoryName} - NexusMarket`;

    try {
        // --- 1. Fetch JSON Data ---
        const response = await fetch('./javaScript/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allProductsData = await response.json();

        // --- 2. Filter products based on flat JSON structure ---
        // We match item.category to the URL param
        const productItems = allProductsData.filter(item => 
            item.category && item.category.toLowerCase() === categoryName.toLowerCase()
        );

        if (!productItems || productItems.length === 0) {
            titleElement.textContent = `Category "${formattedCategoryName}" Not Found`;
            container.innerHTML = `<p class="text-red-500 col-span-full text-center">No products found in this category.</p>`;
            return;
        }

        attachProductEventListeners(productItems);

        // --- 3. Render logic (with user data if logged in) ---
        const userToken = localStorage.getItem('userAuthToken');
        if (userToken) {
            try {
                // Initial fetch to set correct states (red heart / green button) on load
                const userData = await fetchUserData();
                localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
                localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
                renderCategoryProducts(productItems, userData.wishlist, userData.cart);
                restoreScrollPosition(); 
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                renderCategoryProducts(productItems); 
                restoreScrollPosition(); 
            }
        } else {
            renderCategoryProducts(productItems);
            restoreScrollPosition(); 
        }

    } catch (error) {
        console.error(`An unexpected error occurred while processing category "${categoryName}":`, error);
        titleElement.textContent = `Error Loading ${formattedCategoryName}`;
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">An error occurred while loading products.</p>`;
    }
});