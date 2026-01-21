import { fetchUserData, updateWishlist, addToCart } from './apiService.js';

// --- Reusable Animation Function ---
function animateFlyToCartTarget(startElement, targetElementId, iconClass) {
    const target = document.getElementById(targetElementId);
    if (!target || !startElement) return;

    const startRect = startElement.getBoundingClientRect();
    const endRect = target.getBoundingClientRect();

    const flyingIcon = document.createElement('i');
    flyingIcon.className = `${iconClass} fixed z-50 text-purple-600 text-xl pointer-events-none`;
    document.body.appendChild(flyingIcon);

    flyingIcon.style.left = `${startRect.left + startRect.width / 2}px`;
    flyingIcon.style.top = `${startRect.top + startRect.height / 2}px`;
    flyingIcon.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';

    requestAnimationFrame(() => {
        flyingIcon.style.left = `${endRect.left + endRect.width / 2}px`;
        flyingIcon.style.top = `${endRect.top + endRect.height / 2}px`;
        flyingIcon.style.transform = 'scale(0.5)';
        flyingIcon.style.opacity = '0';
    });

    setTimeout(() => flyingIcon.remove(), 800);
}

// --- Render Logic ---
const renderWishlist = async () => {
    try {
        const userData = await fetchUserData();
        
        const wishlist = (userData.wishlist || []).filter(item => item);
        const cart = (userData.cart || []).filter(item => item);

        localStorage.setItem("wishlistProducts", JSON.stringify(wishlist));
        localStorage.setItem("cartProducts", JSON.stringify(cart));
        
        const wishlistContainer = document.getElementById("wishlist-container");
        const countBadge = document.getElementById("wishlist-count-badge");
        
        if(countBadge) countBadge.textContent = `${wishlist.length} Items Saved`;
        wishlistContainer.innerHTML = "";

        if (wishlist.length === 0) {
            wishlistContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                    <div class="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <i class="far fa-heart text-4xl text-purple-300"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
                    <p class="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't found anything you like yet. Browse our categories to find your next favorite item.</p>
                    <a href="./explore.html" class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
                        Start Shopping
                    </a>
                </div>
            `;
        } else {
            wishlist.forEach(product => {
                const isInCart = cart.some(p => p.name === product.name);
                
                // Button Logic: Green 'Go to Cart' or Black 'Move to Cart'
                const btnText = isInCart ? 'Go to Cart' : 'Move to Cart';
                const btnClass = isInCart 
                    ? 'go-to-cart-btn bg-green-600 hover:bg-green-700' 
                    : 'add-to-cart-btn bg-gray-900 hover:bg-purple-600';
                const btnIcon = isInCart ? 'fa-check' : 'fa-shopping-cart';

                const card = document.createElement('div');
                card.className = "wishlist-card group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col";
                card.dataset.productName = encodeURIComponent(product.name);
                
                card.innerHTML = `
                    <button class="wishlist-remove-btn absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-gray-400 hover:text-red-500 hover:bg-red-50 transition z-10" title="Remove from Wishlist">
                        <i class="fas fa-times"></i>
                    </button>

                    <div class="product-image-container relative h-48 mb-4 overflow-hidden rounded-xl bg-gray-50">
                        <img class="product-image w-full h-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-110" 
                             src="${product.image}" alt="${product.name}">
                    </div>

                    <div class="flex-grow flex flex-col">
                        <div class="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Nexus Approved</div>
                        <h3 class="product-name font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 hover:text-purple-600 cursor-pointer transition-colors" onclick="window.location.href='./detail.html?name=${encodeURIComponent(product.name)}'">${product.name}</h3>
                        
                        <div class="mt-auto mb-4">
                            <span class="text-xl font-extrabold text-gray-900">₹${product.price.toLocaleString('en-IN')}</span>
                        </div>

                        <button class="${btnClass} w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                            <i class="fas ${btnIcon}"></i>
                            ${btnText}
                        </button>
                    </div>
                `;
                wishlistContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Failed to render wishlist:", error);
    }
};

// --- Main Execution ---
document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem('userAuthToken')) {
        document.body.innerHTML = `<div class="flex items-center justify-center min-h-screen bg-gray-50"><div class="text-center bg-white p-10 rounded-2xl shadow-xl"><h1 class="text-2xl font-bold mb-4">Please sign in</h1><a href="./signin.html" class="text-purple-600 font-bold hover:underline">Go to Sign In</a></div></div>`;
        return;
    }

    const wishlistContainer = document.getElementById("wishlist-container");
    if (!wishlistContainer) return;

    wishlistContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.wishlist-card');
        if (!card) return;

        const productName = decodeURIComponent(card.dataset.productName);
        const wishlist = JSON.parse(localStorage.getItem("wishlistProducts")) || [];
        const product = wishlist.find(p => p.name === productName);
        
        if (!product) return;

        // 1. Remove Item Logic
        if (event.target.closest('.wishlist-remove-btn')) {
            const btn = event.target.closest('.wishlist-remove-btn');
            card.style.transform = 'scale(0.9)';
            card.style.opacity = '0';
            setTimeout(async () => {
                await updateWishlist(product);
                await renderWishlist(); 
                window.updateHeader?.();
            }, 200);
        }
        // 2. Go to Cart Logic (If item is already in cart)
        else if (event.target.closest('.go-to-cart-btn')) {
             window.location.href = './cart.html';
        }
        // 3. Move to Cart Logic (If item is NOT in cart)
        else if (event.target.closest('.add-to-cart-btn')) {
            const btn = event.target.closest('.add-to-cart-btn');
            animateFlyToCartTarget(btn, 'cart-icon-target', 'fas fa-shopping-cart'); 
            
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Moving...`;
            
            await addToCart(product);
            await renderWishlist(); 
            window.updateHeader?.();
        }
        // 4. Clicked Image/Title -> Go to Detail
        else if (event.target.closest('.product-image') || event.target.closest('.product-name')) {
            window.location.href = `./detail.html?name=${encodeURIComponent(productName)}`;
        }
    });

    await renderWishlist();
});