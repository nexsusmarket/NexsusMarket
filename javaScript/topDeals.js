import { topDeals } from "./topDealsProducts.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';

/**
 * Renders the Top Deals products.
 * @param {Array} wishlist - The user's current wishlist.
 * @param {Array} cart - The user's current cart.
 */
function renderTopDeals(wishlist = [], cart = []) {
    const productsContainer = document.querySelector(".top-product-list");
    if (!productsContainer) return;

    let productHtml = "";
    // Ensure topDeals and its items array exist before trying to access
    const productItems = topDeals && topDeals[0] && topDeals[0].items ? topDeals[0].items : [];

    productItems.forEach(item => {
        const discount = Math.round(((item.mrpprice - item.dealprice) / item.mrpprice) * 100);
        // MODIFIED LINE: Add a check for 'p' being truthy to prevent 'Cannot read properties of null'
        const isInWishlist = wishlist.some(p => p && p.name === item.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
        // MODIFIED LINE: Add a check for 'p' being truthy to prevent 'Cannot read properties of null'
        const isInCart = cart.some(p => p && p.name === item.name);
        const cartButtonText = isInCart ? 'Go to Cart' : 'Add to Cart';
        // Ensure button class consistency for navigation (only if you want a specific color for "Go to Cart")
        const cartButtonClass = isInCart ? 'bg-green-600 hover:bg-green-700' : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700';

        productHtml += `
            <div class="top-product-card" data-product-name="${encodeURIComponent(item.name)}">
                <img class="top-image" src="${item.image}" alt="${item.name}">
                <div class="wishlist-icon text-2xl">
                    <i class="${heartIconClass} fa-heart"></i>
                </div>
                <div class="top-details">
                    <h3>${item.name}</h3>
                    <div class="price-row">
                        <span class="deal-price">₹${item.dealprice}</span>
                        <span class="mrp-price">₹${item.mrpprice}</span>
                        <span class="discount">${discount}% OFF</span>
                    </div>
                </div>
                <button class="${cartButtonClass} text-white font-semibold transition">
                    ${cartButtonText}
                </button>
            </div>
        `;
    });

    productsContainer.innerHTML = productHtml;
}

/**
 * Attaches event listeners for all product interactions.
 */
function attachProductEventListeners() {
    const productsContainer = document.querySelector(".top-product-list");
    if (!productsContainer) return;

    productsContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.top-product-card');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        // Ensure topDeals and its items array exist before trying to find the product
        const productData = topDeals && topDeals[0] && topDeals[0].items ? 
                            topDeals[0].items.find(p => p.name === productName) : null;
        if (!productData) return;

        // Prepare product data for API calls (using dealprice as the price)
        const productForApi = {
            name: productData.name,
            image: productData.image,
            price: productData.dealprice,
            category: productData.category, // Use dealprice for API interactions
        };

        // --- AUTHENTICATION CHECK ---
        // This single line replaces the old confirm() pop-up with the professional modal
        if (!window.checkAuth()) return;
        
        // --- LOGGED-IN USER ACTIONS ---
        const refreshDataAndUI = async () => {
            const userData = await fetchUserData();
            localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || [])); // Ensure defaults
            localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));     // Ensure defaults
            window.updateHeader();
            renderTopDeals(userData.wishlist, userData.cart);
        };

        if (event.target.closest('.wishlist-icon')) {
            await updateWishlist(productForApi);
            await refreshDataAndUI();
        } 
        else if (event.target.closest('.add-to-cart-btn')) {
            await addToCart(productForApi);
            await refreshDataAndUI();
        }
        // MODIFIED: Only navigate to cart if the button clicked specifically indicates "Go to Cart"
        else if(event.target.closest('button.bg-green-600')) { 
            window.location.href = '/cart.html';
        }
        else {
            await postViewedItem(productForApi);
        }
    });
}

/**
 * Main function to set up the page on load.
 */
document.addEventListener("DOMContentLoaded", async () => { // Made async to use await
    // Note: The original file had setupSearchBar(), but the topDeals.html does not have a search bar.
    // If you add one later, you can uncomment this line.
    // setupSearchBar(); 

    const userToken = localStorage.getItem('userAuthToken');

    if (userToken) {
        // If user is logged in, fetch their latest data from the server
        try {
            const userData = await fetchUserData();
            // Store the fetched data in local storage for quick access
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
            // Render the products, reflecting the user's current wishlist and cart state
            renderTopDeals(userData.wishlist, userData.cart);
        } catch (error) {
            console.error("Failed to fetch user data on Top Deals page load:", error);
            // If there's an error fetching data, render products without personalization
            renderTopDeals(); 
        }
    } else {
        // If no user token, render products without any personalized state
        renderTopDeals();
    }
    
    attachProductEventListeners();
});