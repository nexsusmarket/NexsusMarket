import { addsProducts } from './addsProducts.js';
import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem, clearRecommendations } from './apiService.js';

// --- ANIMATION 1: Fly to Cart ---
function animateFlyToCart(buttonElement) {
    const target = document.getElementById('account-btn'); // Target the Account button
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
 * Updates header counts in the background without reloading the grid.
 */
async function updateHeaderCounts() {
    try {
        const userData = await fetchUserData();
        localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
        localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
        localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || [])); 
        if (window.updateHeader) {
            window.updateHeader();
        }
    } catch (error) {
        console.error("Background header update failed", error);
    }
}

/**
 * Renders the recommendation cards on the page.
 */
function renderRecommendations(productsToDisplay, wishlist = [], cart = []) {
    const container = document.getElementById("recommendations-container");
    if (!container) return;
    container.innerHTML = "";

    productsToDisplay.forEach(product => {
        const isInWishlist = wishlist.some(p => p && p.name === product.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
        const isInCart = cart.some(p => p && p.name === product.name);
        
        // Button Logic
        const buttonHTML = isInCart
            ? `<a href="/cart.html" class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap block text-center" style="display:inline-block; padding: 0.25rem 0.75rem;">Go to Cart</a>`
            : `<button class="add-to-cart-btn bg-purple-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-purple-700 transition whitespace-nowrap">Add to Cart</button>`;

        const card = `
            <div class="product-card reco-card" data-product-name="${encodeURIComponent(product.name)}">
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="reco-card-img cursor-pointer product-image">
                    <div class="wishlist-icon absolute top-1 right-1 text-xl text-gray-300 cursor-pointer">
                        <i class="${heartIconClass} fa-heart transition-colors duration-300"></i>
                    </div>
                </div>
                <h3 class="reco-card-name cursor-pointer product-name">${product.name}</h3>
                <div class="reco-card-footer">
                    <span class="reco-card-price">₹${Number(product.price).toFixed(2)}</span>
                    ${buttonHTML}
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

/**
 * Attaches event listeners to the recommendation cards.
 */
function attachProductListeners(recommendations) {
    const container = document.getElementById("recommendations-container");
    if (!container) return;

    container.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-card');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        const productData = recommendations.find(p => p.name === productName);
        if (!productData) return;

        // --- 1. Wishlist Logic ---
        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return; 
            
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
        
        // --- 2. Add to Cart Logic ---
        else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return;
            
            const btn = event.target.closest('.add-to-cart-btn');
            
            // Animation
            animateFlyToCart(btn);
            
            // Optimistic UI Update (Change to "Go to Cart")
            // Replacing button with Link visually
            btn.outerHTML = `<a href="/cart.html" class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap block text-center" style="display:inline-block; padding: 0.25rem 0.75rem;">Go to Cart</a>`;

            // Background API Call
            await addToCart(productData);
            updateHeaderCounts();
        } 
        
        // --- 3. Clicked on "Go to Cart" link ---
        // (Handled naturally by the <a> tag)

        // --- 4. Navigation Logic ---
        else if (event.target.closest('.product-image') || event.target.closest('.product-name')) {
            if (localStorage.getItem('userAuthToken')) {
                postViewedItem(productData); // Fire and forget
            }
            window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
        }
    });
}

/**
 * Clears recommendations from the database and the UI.
 */
window.removeRecommendations = async function() {
    if (!window.checkAuth()) return;

    try {
        await clearRecommendations(); 
        location.reload(); 
    } catch (error) {
        console.error("Failed to clear recommendations:", error);
        alert("Error clearing recommendations. Please try again.");
    }
};

/**
 * Main function to set up the page when it loads.
 */
document.addEventListener('DOMContentLoaded', async function() {
    setupSearchBar();

    const recomContainer = document.getElementById("recomContainer");
    const userToken = localStorage.getItem('userAuthToken');

    if (userToken) {
        const removeRecsBtn = document.getElementById('remove-recs-btn');
        if (removeRecsBtn) {
            removeRecsBtn.addEventListener('click', window.removeRecommendations);
        }
        try {
            const userData = await fetchUserData();
            const dbRecommendations = userData.recommendations || [];

            localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
            localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
            localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || []));
            
            if (dbRecommendations.length > 0) {
                if (recomContainer) { recomContainer.style.display = "flex"; }
                renderRecommendations(dbRecommendations, userData.wishlist, userData.cart);
                attachProductListeners(dbRecommendations);
            } else {
                if (recomContainer) { recomContainer.style.display = "none"; }
            }
            window.updateHeader();
        } catch (error) {
            console.error("Could not load user data or recommendations:", error);
            if (recomContainer) { recomContainer.style.display = "none"; }
        }
    } else {
        if (recomContainer) { recomContainer.style.display = "none"; }
    }
    
    // --- Slider Logic ---
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        const slider = sliderContainer.querySelector('.slider');
        const dotsContainer = sliderContainer.querySelector('.dots-container');
        const prevBtn = sliderContainer.querySelector('.btn-prev');
        const nextBtn = sliderContainer.querySelector('.btn-next');
        
        let autoPlayInterval;
        const SLIDE_DURATION = 3000;

        addsProducts.forEach((product, i) => {
            const slide = document.createElement('div');
            slide.classList.add('slide');
            slide.innerHTML = `
                <div class="w-full h-full relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 p-6 text-white">
                        <h3 class="text-2xl font-bold">${product.name}</h3>
                        <p>${product.add}</p>
                    </div>
                </div>
            `;
            slider.appendChild(slide);

            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.dataset.slide = i;
            dot.innerHTML = `<div class="progress-fill"></div>`;
            dotsContainer.appendChild(dot);
        });

        let slides = slider.querySelectorAll('.slide');
        const dots = dotsContainer.querySelectorAll('.dot');

        if (slides.length > 1) {
            const firstClone = slides[0].cloneNode(true);
            const lastClone = slides[slides.length - 1].cloneNode(true);
            slider.appendChild(firstClone);
            slider.insertBefore(lastClone, slides[0]);
            slides = slider.querySelectorAll('.slide');
        }

        let currentSlide = 1;
        let isTransitioning = false;
        
        const goToSlide = (slideIndex, isManual = false) => {
            if (isTransitioning) return;
            isTransitioning = true;
            
            slider.style.transition = 'transform 0.5s ease-in-out';
            slider.style.transform = `translateX(-${slideIndex * 100}%)`;
            currentSlide = slideIndex;

            let realIndex = (slideIndex - 1 + dots.length) % dots.length;
            dots.forEach(d => {
                d.querySelector('.progress-fill').style.transition = 'none';
                d.querySelector('.progress-fill').style.width = '0%';
                d.classList.remove('active');
            });
            dots[realIndex].classList.add('active');

            if (!isManual) {
                setTimeout(() => {
                    const activeProgressFill = dots[realIndex].querySelector('.progress-fill');
                    if (activeProgressFill) {
                        activeProgressFill.style.transition = `width ${SLIDE_DURATION / 1000}s linear`;
                        activeProgressFill.style.width = '100%';
                    }
                }, 50);
            }
            
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(() => goToSlide(currentSlide + 1), SLIDE_DURATION);
        };

        slider.addEventListener('transitionend', () => {
            isTransitioning = false;
            if (currentSlide === 0) {
                slider.style.transition = 'none';
                currentSlide = slides.length - 2;
                slider.style.transform = `translateX(-${currentSlide * 100}%)`;
            } else if (currentSlide === slides.length - 1) {
                slider.style.transition = 'none';
                currentSlide = 1;
                slider.style.transform = `translateX(-${currentSlide * 100}%)`;
            }
        });

        nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1, true));
        prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1, true));
        
        dotsContainer.addEventListener('click', (e) => {
            const targetDot = e.target.closest('.dot');
            if (targetDot) {
                const slideToGo = parseInt(targetDot.dataset.slide) + 1;
                goToSlide(slideToGo, true);
            }
        });

        if (slides.length > 1) {
            slider.style.transform = `translateX(-${currentSlide * 100}%)`;
            goToSlide(currentSlide);
        }
    }
});