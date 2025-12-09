import { product as allProductsData } from "./products.js";
import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';

// This variable tells the script which category to display from your main products file.
const categoryNameToRender = "homeappliances";


// --- Animation for Fly-to-Account (Cart) ---
function animateFlyToCart(buttonElement) {
    const accountButton = document.getElementById('account-btn');
    if (!accountButton || !buttonElement) {
        console.error("Animation Start Failed: Target or source element not found.");
        return;
    }

    const startRect = buttonElement.getBoundingClientRect();
    const endRect = accountButton.getBoundingClientRect();

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

// --- Animation for Fly-to-Account (Wishlist) ---
function animateFlyToWishlist(iconElement) {
    const accountButton = document.getElementById('account-btn');
    if (!accountButton || !iconElement) {
        console.error("Animation Start Failed: Target or source element not found.");
        return;
    }

    const startRect = iconElement.getBoundingClientRect();
    const endRect = accountButton.getBoundingClientRect();

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
 * Renders products for the specific "homeappliances" category.
 */
function renderCategoryProducts(wishlist = [], cart = []) {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    const categoryToRender = allProductsData && allProductsData[0] && allProductsData[0].category ?
                                 allProductsData[0].category.find(cat => cat.name.toLowerCase() === categoryNameToRender) : null;

    if (!categoryToRender || !categoryToRender.items || categoryToRender.items.length === 0) {
        productsContainer.innerHTML = `<p class="text-center text-red-500 p-8">No products found in the "${categoryNameToRender}" category or category data is missing.</p>`;
        return;
    }

    let productHtml = "";
    categoryToRender.items.forEach(item => {
        const isInWishlist = wishlist.some(p => p && p.name === item.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
        const isInCart = cart.some(p => p && p.name === item.name);
        const cartButtonText = isInCart ? 'Go to Cart' : 'Add to Cart';
        const cartButtonClass = isInCart ? 'bg-green-600 hover:bg-green-700' : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700';

        productHtml += `
            <div class="product-container animate-fadeIn" data-product-name="${encodeURIComponent(item.name)}">
                <div class="product-image-container">
                    <img class="product-image" src="${item.image}">
                    <div class="wishlist-icon text-2xl">
                        <i class="${heartIconClass} fa-heart"></i>
                    </div>
                </div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">Price ₹${item.price}</div>
                <button class="${cartButtonClass} text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    ${cartButtonText}
                </button>
            </div>
        `;
    });

    productsContainer.innerHTML = productHtml;
}

/**
 * Attaches event listeners for all product interactions on the page.
 */
function attachProductEventListeners() {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    productsContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-container');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);

        // Find the specific product data from the fashion category
        const categoryData = allProductsData && allProductsData[0] && allProductsData[0].category ?
                              allProductsData[0].category.find(cat => cat.name.toLowerCase() === categoryNameToRender) : null;
        const productData = categoryData ? categoryData.items.find(p => p.name === productName) : null;
        
        if (!productData) return;
        
        const refreshDataAndUI = async () => {
            const userData = await fetchUserData();
            localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
            localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
            localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || []));
            window.updateHeader();
            renderCategoryProducts(userData.wishlist, userData.cart);
        };

        // --- MODIFIED LOGIC START ---

        // Case 1: Clicked on Wishlist Icon
        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return; // Check auth here
            animateFlyToWishlist(event.target);
            await updateWishlist(productData);
            await refreshDataAndUI();
        } 
        // Case 2: Clicked on "Add to Cart" Button
        else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return; // Check auth here
            animateFlyToCart(event.target);
            await addToCart(productData);
            await refreshDataAndUI();
        }
        // Case 3: Clicked on "Go to Cart" Button
        else if(event.target.closest('button.bg-green-600') && event.target.textContent.trim() === 'Go to Cart') {
            window.location.href = '/cart.html';
        }
        // Case 4: Clicked anywhere else on the card (Image, Name, Price)
        else {
            // Log the view if the user is logged in, but don't block navigation
            if (localStorage.getItem('userAuthToken')) {
                await postViewedItem(productData);
            }
            // Navigate to the detail page for everyone
            window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
        }
        // --- MODIFIED LOGIC END ---
    });
}

/**
 * Main function to set up the page on load.
 */
document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();

    const userToken = localStorage.getItem('userAuthToken');

    if (userToken) {
        try {
            const userData = await fetchUserData();
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
            localStorage.setItem("viewedItems", JSON.stringify(userData.viewedItems || []));
            renderCategoryProducts(userData.wishlist, userData.cart);
        } catch (error) {
            console.error("Failed to fetch user data on HomeAppliances page load:", error);
            renderCategoryProducts();
        }
    } else {
        renderCategoryProducts();
    }
    
    attachProductEventListeners();
});