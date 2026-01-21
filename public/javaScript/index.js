import { setupSearchBar } from "./searchHandler.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem, clearRecommendations } from './apiService.js';

// --- CONFIG: Slider Items ---
const sliderConfig = [
    { 
        name: "Samsung Galaxy S25 Ultra 5G Smartphone with Galaxy AI (Titanium Black, 12GB RAM, 512GB Storage)", 
        ad: "Experience Galaxy AI" 
    },
    { 
        name: "Apple 2024 MacBook Pro Laptop with M4 chip with 10‑core CPU and 10‑core GPU", 
        ad: "Supercharged by M4" 
    },
    { 
        name: "Sunfeast YiPPee! Magic Masala, Instant Noodles (Pack of 4), 240g ITC​", 
        ad: "Instant Hunger Solution" 
    },
    { 
        name: "Maroon patta anarkali winter dress women dress", 
        ad: "Winter Anarkali Edition" 
    },
    { 
        name: "Samsung Crystal 4K Vision Pro 138 cm (55 inch) Ultra HD (4K) LED Smart Tizen TV with Bright Vision | 4K Upscaling | Multiple Voice Assistance Remote | Purcolor | HDR 10+ | Auto Game Mode | Q-Symphony | Knox Security  (UA55DUE76AKLXL)", 
        ad: "Crystal Clear Vision" 
    },
    { 
        name: "Sony PlayStation5 Gaming Console (Slim)", 
        ad: "Play Has No Limits" 
    },
    { 
        name: "Sony Bravia Theatre System 6(HT-S60) Real 5.1ch 1000W,Dolby Atmos/DTS:X Soundbar Home Theatre with Powerful subwoofer & Wireless Rear Speakers,Voice Zoom3,BCA App, Bluetooth,HDMI eARC", 
        ad: "Cinematic Surround Sound" 
    }
];

// --- HELPER: Find Product By Name (Flat JSON Version) ---
function findProductByName(allProductsData, name) {
    if (!allProductsData || !Array.isArray(allProductsData)) return null;
    // Normalize spaces and case for better matching
    return allProductsData.find(item => item.name.trim() === name.trim());
}

// --- ANIMATIONS ---
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

// --- CORE FUNCTIONS ---
async function updateHeaderCounts() {
    try {
        const userData = await fetchUserData();
        localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
        localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
        localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || [])); 
        if (window.updateHeader) window.updateHeader();
    } catch (error) {
        console.error("Background header update failed", error);
    }
}

function renderRecommendations(productsToDisplay, wishlist = [], cart = []) {
    const container = document.getElementById("recommendations-container");
    if (!container) return;
    container.innerHTML = "";
    productsToDisplay.forEach(product => {
        const isInWishlist = wishlist.some(p => p && p.name === product.name);
        const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
        const isInCart = cart.some(p => p && p.name === product.name);
        const buttonHTML = isInCart
            ? `<a href="./cart.html" class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap block text-center" style="display:inline-block; padding: 0.25rem 0.75rem;">Go to Cart</a>`
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
            </div>`;
        container.innerHTML += card;
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
function attachProductListeners(recommendations) {
    const container = document.getElementById("recommendations-container");
    if (!container) return;
    container.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-card');
        if (!card) return;
        const productName = decodeURIComponent(card.dataset.productName);
        const productData = recommendations.find(p => p.name === productName);
        if (!productData) return;

        if (event.target.closest('.wishlist-icon')) {
            if (!window.checkAuth()) return; 
            const iconBtn = event.target.closest('.wishlist-icon');
            const icon = iconBtn.querySelector('i');
            if (icon.classList.contains('fas')) {
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far');
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500');
                animateFlyToWishlist(iconBtn);
            }
            await updateWishlist(productData);
            updateHeaderCounts();
        } else if (event.target.closest('.add-to-cart-btn')) {
            if (!window.checkAuth()) return;
            const btn = event.target.closest('.add-to-cart-btn');
            animateFlyToCart(btn);
            btn.outerHTML = `<a href="./cart.html" class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap block text-center" style="display:inline-block; padding: 0.25rem 0.75rem;">Go to Cart</a>`;
            await addToCart(productData);
            updateHeaderCounts();
        } else if (event.target.closest('.product-image') || event.target.closest('.product-name')) {
            if (localStorage.getItem('userAuthToken')) postViewedItem(productData);
            window.location.href = `./detail.html?name=${encodeURIComponent(productName)}`;
        }
    });
}

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

// --- INITIALIZATION & SLIDER LOGIC ---
document.addEventListener('DOMContentLoaded', async function() {
    setupSearchBar();
    
    // --- 1. Fetch Product Data Dynamically ---
    let allProductsData = [];
    try {
        const response = await fetch('./javascript/products.json');
        if (!response.ok) throw new Error("Failed to fetch products.json");
        allProductsData = await response.json();
    } catch (error) {
        console.error("Critical error loading products:", error);
        // We can't render the slider if products fail to load, but we continue to check user auth
    }

    const recomContainer = document.getElementById("recomContainer");
    const userToken = localStorage.getItem('userAuthToken');

    if (userToken) {
        const removeRecsBtn = document.getElementById('remove-recs-btn');
        if (removeRecsBtn) removeRecsBtn.addEventListener('click', window.removeRecommendations);
        try {
            const userData = await fetchUserData();
            const dbRecommendations = userData.recommendations || [];
            localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
            localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
            localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || []));
            
            if (dbRecommendations.length > 0) {
                if (recomContainer) recomContainer.style.display = "flex";
                renderRecommendations(dbRecommendations, userData.wishlist, userData.cart);
                attachProductListeners(dbRecommendations);
            } else {
                if (recomContainer) recomContainer.style.display = "none";
            }
            if (window.updateHeader) window.updateHeader();
        } catch (error) {
            console.error("Could not load user data or recommendations:", error);
            if (recomContainer) recomContainer.style.display = "none";
        }
    } else {
        if (recomContainer) recomContainer.style.display = "none";
    }
    
    // --- PROFESSIONAL CONTINUOUS SLIDER LOGIC ---
    // Only run if we successfully loaded products
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer && allProductsData.length > 0) {
        const slider = sliderContainer.querySelector('.slider');
        const dotsContainer = sliderContainer.querySelector('.dots-container');
        const prevBtn = sliderContainer.querySelector('.btn-prev');
        const nextBtn = sliderContainer.querySelector('.btn-next');
        let autoPlayInterval;
        const SLIDE_DURATION = 3000;

        // Map config to actual data using the new flat array helper
        const sliderItems = sliderConfig.map(config => {
            const product = findProductByName(allProductsData, config.name);
            if (product) return { ...product, adText: config.ad };
            return null;
        }).filter(item => item !== null);

        sliderItems.forEach((product, i) => {
            const slide = document.createElement('div');
            slide.classList.add('slide');
            slide.innerHTML = `
                <div class="w-full h-full relative cursor-pointer" onclick="window.location.href='./detail.html?name=${encodeURIComponent(product.name)}'">
                    <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 p-8 text-white">
                        <p class="text-yellow-400 font-bold text-2xl drop-shadow-md tracking-wide">${product.adText}</p>
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

        // --- RESUME LOGIC (No Fast Travel) ---
        let savedIndex = sessionStorage.getItem('nexus_slider_pos');
        let currentSlide = savedIndex ? parseInt(savedIndex) : 1; 

        if (currentSlide >= slides.length - 1 || currentSlide <= 0) {
            currentSlide = 1;
        }

        let isTransitioning = false;
        
        const goToSlide = (slideIndex, isManual = false) => {
            if (isTransitioning) return;
            isTransitioning = true;
            
            slider.style.transition = 'transform 0.5s ease-in-out';
            slider.style.transform = `translateX(-${slideIndex * 100}%)`;
            
            currentSlide = slideIndex;
            
            sessionStorage.setItem('nexus_slider_pos', currentSlide);

            let realIndex = (slideIndex - 1 + dots.length) % dots.length;
            if(slideIndex === 0) realIndex = dots.length - 1;
            if(slideIndex === slides.length - 1) realIndex = 0;

            dots.forEach(d => {
                d.querySelector('.progress-fill').style.transition = 'none';
                d.querySelector('.progress-fill').style.width = '0%';
                d.classList.remove('active');
            });
            
            if(dots[realIndex]) {
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
                sessionStorage.setItem('nexus_slider_pos', currentSlide); 
            } else if (currentSlide === slides.length - 1) {
                slider.style.transition = 'none';
                currentSlide = 1;
                slider.style.transform = `translateX(-${currentSlide * 100}%)`;
                sessionStorage.setItem('nexus_slider_pos', currentSlide); 
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
            slider.style.transition = 'none';
            slider.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            let realIndex = (currentSlide - 1 + dots.length) % dots.length;
            if(dots[realIndex]) {
                dots[realIndex].classList.add('active');
                setTimeout(() => {
                    const activeProgressFill = dots[realIndex].querySelector('.progress-fill');
                    if (activeProgressFill) {
                        activeProgressFill.style.transition = `width ${SLIDE_DURATION / 1000}s linear`;
                        activeProgressFill.style.width = '100%';
                    }
                }, 50);
            }

            autoPlayInterval = setInterval(() => goToSlide(currentSlide + 1), SLIDE_DURATION);
        }
    }
});