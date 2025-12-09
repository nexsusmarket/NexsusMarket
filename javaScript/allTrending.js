// In javaScript/allTrending.js
import { setupSearchBar } from "./searchHandler.js";

/**
 * Updates the cart count number in the header.
 */
function updateHeaderCartCount() {
    const cartItems = JSON.parse(localStorage.getItem("cartProducts")) || [];
    const cartCounterElement = document.querySelector('.cart-counter');
    if (cartCounterElement) {
        cartCounterElement.textContent = cartItems.length;
    }
}

/**
 * Updates the wishlist count number in the header.
 */
function updateHeaderWishlistCount() {
    const wishlistItems = JSON.parse(localStorage.getItem("wishlistProducts")) || [];
    const wishlistCounterElement = document.querySelector('.wishlist-counter');
    if (wishlistCounterElement) {
        wishlistCounterElement.textContent = wishlistItems.length;
    }
}

/**
 * Main function to set up the page on load.
 */
document.addEventListener('DOMContentLoaded', () => {
    setupSearchBar();
    updateHeaderCartCount();
    updateHeaderWishlistCount();

    const wishlist = JSON.parse(localStorage.getItem("wishlistProducts")) || [];

    // Find all hard-coded product cards and make them interactive
    document.querySelectorAll('.product-card').forEach(card => {
        // Read the product data from the data- attributes you added in the HTML
        const productData = {
            name: card.dataset.productName,
            price: parseFloat(card.dataset.productPrice),
            image: card.dataset.productImage,
            quantity: 1
        };

        if (!productData.name) return; // Skip if card has no data

        // Check if this product is in the wishlist
        const isInWishlist = wishlist.some(p => p.name === productData.name);
        const heartIconClass = isInWishlist ? 'fas' : 'far';

        // Create and add the wishlist icon to the card
        const wishlistIcon = document.createElement('div');
        wishlistIcon.className = 'wishlist-icon';
        wishlistIcon.innerHTML = `<i class="${heartIconClass} fa-heart"></i>`;
        
        // Find the image container and add the icon to it
        const imageContainer = card.querySelector('.p-5'); 
        if (imageContainer) {
            imageContainer.style.position = 'relative'; // Ensure positioning context
            imageContainer.appendChild(wishlistIcon);
        }

        // Add the click event listener to the new icon
        wishlistIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault(); 

            const heartIcon = wishlistIcon.querySelector('i');
            let currentWishlist = JSON.parse(localStorage.getItem("wishlistProducts")) || [];
            const productIndex = currentWishlist.findIndex(p => p.name === productData.name);

            if (productIndex > -1) {
                currentWishlist.splice(productIndex, 1);
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
            } else {
                currentWishlist.push(productData);
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');

                // Trigger animation
                heartIcon.classList.add('heart-anim');
                setTimeout(() => heartIcon.classList.remove('heart-anim'), 300);
            }

            localStorage.setItem("wishlistProducts", JSON.stringify(currentWishlist));
            updateHeaderWishlistCount();
        });
    });
});