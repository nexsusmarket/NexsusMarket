import { setupSearchBar } from "./searchHandler.js";
import { product } from "./products.js";
import { fetchUserData, updateWishlist, addToCart, postViewedItem } from './apiService.js';

// --- 1. CATEGORY DEFINITIONS ---
const CATEGORY_SYNONYMS = {
    "mobile": ["phone", "smartphone", "android", "iphone", "cell", "mobiles", "phones", "5g", "4g", "galaxy", "redmi", "realme", "vivo", "oppo", "iqoo", "pixel", "pad", "tablet", "tab"],
    "laptop": ["computer", "notebook", "pc", "macbook", "desktop", "laptops", "windows", "processor", "intel", "ryzen", "book", "chromebook", "ultrabook", "gaming laptop", "workstation"],
    "electronics": ["gadget", "tech", "accessory", "accessories", "camera", "dslr", "mirrorless", "lens", "headphone", "earbud", "speaker", "watch", "smartwatch", "buds", "airpods", "tws", "audio", "mouse", "keyboard", "gaming", "console", "ps5", "playstation", "gamepad", "controller", "printer", "monitor", "gpu", "graphic", "card", "rtx", "cooling", "fan"],
    "fashion": ["cloth", "clothing", "wear", "apparel", "dress", "shirt", "pant", "jeans", "shoe", "sneaker", "top", "t-shirt", "men", "women", "kids", "saree", "kurta", "anarkali", "ethnic", "slide", "slipper", "flip", "flop", "sandal", "bag", "backpack", "luggage"],
    "homeappliances": ["home", "appliance", "fridge", "refrigerator", "tv", "television", "smart tv", "led", "qled", "ac", "conditioner", "air", "cool", "washing", "machine", "cooler", "fan", "ceiling", "sofa", "bed", "chair", "table", "desk", "furniture", "living", "room", "study", "soundbar", "theatre", "woofer", "subwoofer", "audio"],
    "grocery": ["food", "eat", "snack", "drink", "biscuit", "oil", "chocolate", "almond", "dry fruit", "nut", "masala", "spice", "noodle", "maggi", "pasta", "shampoo", "soap", "wash", "hair", "care", "ghee", "dairy", "salt", "sugar", "pie", "cookie", "cake"]
};

// --- 2. THE "IGNORABLE" LIST (Broad Category Terms) ---
// These words select a category but DO NOT need to exist in the product name.
// Specific words like "Shoe", "Desk", "TV" are NOT here, so they MUST be in the name.
const IGNORABLE_TERMS = {
    "mobile": ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones", "cell", "android", "5g", "4g", "device"],
    "laptop": ["laptop", "laptops", "computer", "computers", "pc", "system", "machine"],
    "electronics": ["electronics", "electronic", "gadget", "gadgets", "tech", "accessory", "accessories"],
    "fashion": ["fashion", "cloth", "clothing", "clothes", "wear", "apparel", "style", "men", "women", "kids"],
    "homeappliances": ["home", "appliance", "appliances", "item", "product"],
    "grocery": ["grocery", "groceries", "food", "foods", "eat", "item", "product", "pantry"]
};

// --- 3. DATA PREPARATION ---
function extractBrandFromName(name) {
    const knownBrands = [
        'Apple', 'HP', 'Samsung', 'OnePlus', 'Google', 'Asus', 'Realme', 'Motorola', 'Sony', 'Zebronics', 'MSI', 'LG', 'Vivo', 'Oppo', 'iQOO',
        'Nike', 'Levis', 'Allen Solly', 'Adidas', 'Puma',
        'ITC', 'Aashirvaad', 'Sunfeast', 'Orion', 'Fortune', 'Head & Shoulders',
        'Callas', 'Casastyle', 'Nilkamal', 'Crompton', 'Whirlpool', 'Haier', 'Godrej'
    ];
    
    const lowerName = name.toLowerCase();
    for (const brand of knownBrands) {
        if (lowerName.includes(brand.toLowerCase())) return brand;
    }
    return ""; 
}

const allItems = product.flatMap(p =>
    p.category.flatMap(cat =>
        cat.items.map(item => ({
            ...item,
            category: cat.name.toLowerCase(), 
            brand: extractBrandFromName(item.name)
        }))
    )
);

// --- 4. PERFECTED SEARCH LOGIC ---
function getFilteredResults(searchTerm) {
    if (!searchTerm) return [];
    
    // Normalize spaces and lower case
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    let targetBrand = null;
    const targetCategories = new Set(); 
    const keywordsToCheck = [];

    // Step A: Parse User Intent
    terms.forEach(term => {
        let matched = false;

        // 1. Check Brand
        const brandMatch = allItems.find(i => i.brand.toLowerCase() === term);
        if (brandMatch) {
            targetBrand = term;
            matched = true;
        }

        // 2. Check Category Synonyms
        if (!matched) {
            for (const [catName, syns] of Object.entries(CATEGORY_SYNONYMS)) {
                if (syns.includes(term) || catName === term) {
                    targetCategories.add(catName);
                    // We DO NOT set matched=true here.
                    // "Shoe" matches Fashion category, but we still need "Shoe" in the keywords list
                    // to filter out dresses.
                    break; 
                }
            }
        }

        // Always add to keywords for potential text matching
        keywordsToCheck.push(term);
    });

    // Step B: Filter Items
    return allItems.filter(item => {
        const itemBrand = item.brand.toLowerCase();
        const itemCategory = item.category.toLowerCase();
        const itemName = item.name.toLowerCase();

        // 1. Brand Filter (Strict)
        if (targetBrand && !itemBrand.includes(targetBrand) && !itemName.includes(targetBrand)) {
            return false;
        }

        // 2. Category Filter (Flexible)
        if (targetCategories.size > 0 && !targetCategories.has(itemCategory)) {
            return false; 
        }

        // 3. Keyword Filter (The Smart Part)
        if (keywordsToCheck.length > 0) {
            const mustMatchKeywords = keywordsToCheck.filter(kw => {
                // If the keyword is the Brand, we already checked it. Skip.
                if (kw === targetBrand) return false;

                // CHECK: Is this keyword "Ignorable" for this specific item's category?
                const ignorableList = IGNORABLE_TERMS[itemCategory];
                if (ignorableList && ignorableList.includes(kw)) {
                    return false; // Skip text match (e.g., "Mobile" in "Samsung Mobile")
                }

                // If it's NOT ignorable (e.g. "Shoe", "Desk"), we MUST find it in the name.
                return true; 
            });

            // Run the strict check on remaining specific keywords
            if (mustMatchKeywords.length > 0) {
                const nameMatches = mustMatchKeywords.every(kw => itemName.includes(kw));
                if (!nameMatches) return false;
            }
        }

        return true;
    });
}

// --- RENDER LOGIC ---
function renderSearchResults(foundProducts, wishlist = [], cart = []) {
    const container = document.getElementById("products-container");
    if (!container) return;

    const term = localStorage.getItem("lastSearch") || "";
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = term;

    if (foundProducts.length > 0) {
        container.innerHTML = foundProducts.map(item => {
            const isInWishlist = wishlist.some(p => p && p.name === item.name);
            const heartIconClass = isInWishlist ? 'fas text-red-500' : 'far';
            const isInCart = cart.some(p => p && p.name === item.name);
            const cartButtonText = isInCart ? 'Go to Cart' : 'Add to Cart';
            const cartButtonClass = isInCart 
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                : 'add-to-cart-btn bg-purple-600 hover:bg-purple-700 text-white';
            const displayPrice = item.price || item.dealprice; 

            return `
                <div class="product-container animate-fadeIn" data-product-name="${encodeURIComponent(item.name)}">
                    <div class="product-image-container">
                        <img class="product-image" src="${item.image}" alt="${item.name}" />
                        <div class="wishlist-icon text-2xl cursor-pointer">
                            <i class="${heartIconClass} fa-heart transition-colors duration-200"></i>
                        </div>
                    </div>
                    <div class="product-name">${item.name}</div>
                    <div class="product-price">Price: ₹${displayPrice.toLocaleString('en-IN')}</div>
                    <button class="${cartButtonClass} px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm">
                        ${cartButtonText}
                    </button>
                </div>
            `;
        }).join("");
    } else {
        container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
            <i class="fas fa-search text-6xl mb-4 text-gray-300"></i>
            <p class="text-xl">No results found for "${term}"</p>
            <p class="text-sm mt-2">Try checking your spelling or use different keywords.</p>
        </div>`;
    }
}

// --- ANIMATIONS & UTILS ---
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
    setTimeout(() => { flyingIcon.remove(); }, 1000);
}

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
    setTimeout(() => { flyingIcon.remove(); }, 1000);
}

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

function restoreScrollPosition() {
    const savedPos = sessionStorage.getItem('searchScrollPos');
    if (savedPos) {
        window.scrollTo(0, parseInt(savedPos));
        sessionStorage.removeItem('searchScrollPos');
    }
}

function attachProductEventListeners() {
    const container = document.getElementById("products-container");
    if (!container) return;

    container.addEventListener('click', async (event) => {
        const card = event.target.closest('.product-container');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        const productData = allItems.find(p => p.name === productName);
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
            btn.textContent = 'Go to Cart';
            btn.className = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm cursor-pointer";
            btn.classList.remove('add-to-cart-btn');
            await addToCart(productData);
            updateHeaderCounts();
        } else if (event.target.matches('button') && event.target.textContent.trim() === 'Go to Cart') {
            window.location.href = '/cart.html';
        } else {
            if (localStorage.getItem('userAuthToken')) {
                postViewedItem(productData);
            }
            sessionStorage.setItem('searchScrollPos', window.scrollY);
            window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setupSearchBar();

    const searchTerm = localStorage.getItem("lastSearch") || "";
    // USE THE NEW PERFECTED FILTERING LOGIC
    const matches = getFilteredResults(searchTerm);
    
    sessionStorage.setItem('lastSearchResults', JSON.stringify(matches));
    
    const userToken = localStorage.getItem('userAuthToken');
    attachProductEventListeners();

    if (userToken) {
        try {
            const userData = await fetchUserData();
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
            localStorage.setItem('viewedItems', JSON.stringify(userData.viewedItems || []));
            renderSearchResults(matches, userData.wishlist, userData.cart);
            restoreScrollPosition();
        } catch (error) {
            console.error("Failed to fetch user data on search page load:", error);
            renderSearchResults(matches);
            restoreScrollPosition();
        }
    } else {
        renderSearchResults(matches);
        restoreScrollPosition();
    }
});