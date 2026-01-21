// javascript/auth.js

// Import the API service function needed to fetch current data
import { fetchUserData } from './apiService.js'; // You must ensure this import path is correct

// A variable to hold a reference to our event listener function
let closeDropdownHandler = null;

// Convert to async function to await API data
async function checkLoginStatus() {
    const userToken = localStorage.getItem('userAuthToken');
    const userName = localStorage.getItem('userName');
    const navigation = document.getElementById('main-navigation');
    if (!navigation) return;

    // --- If a listener from a previous render exists, remove it ---
    if (closeDropdownHandler) {
        window.removeEventListener('click', closeDropdownHandler);
        closeDropdownHandler = null;
    }

    if (userToken && userName) {
        // --- START OF FIX: Fetch latest data directly from API ---
        let wishlistItems = [];
        let cartItems = [];
        try {
            const userData = await fetchUserData();
            wishlistItems = (userData.wishlist || []).filter(item => item);
            cartItems = (userData.cart || []).filter(item => item);
            
            // OPTIONAL: Update localStorage immediately with the fresh counts
            localStorage.setItem("wishlistProducts", JSON.stringify(wishlistItems));
            localStorage.setItem("cartProducts", JSON.stringify(cartItems));

        } catch (error) {
            console.warn("Failed to fetch user data for header counts, using local storage fallback.", error);
            // Fallback to local storage if API fails (though this will use stale data)
            wishlistItems = JSON.parse(localStorage.getItem("wishlistProducts")) || [];
            cartItems = JSON.parse(localStorage.getItem("cartProducts")) || [];
        }
        // --- END OF FIX ---

        navigation.innerHTML = `
            <div class="relative">
                <div id="account-btn" class="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-white/10">
                    <i class="fas fa-user-circle text-2xl"></i>
                    <span class="font-semibold text-sm">Account</span>
                </div>
                <div id="account-menu" class="absolute right-0 account-dropdown-menu-glass hidden z-50"> 
                     <div class="glass-background-blur"></div>
                     <div class="dropdown-content-layer">
                         <div class="px-4 py-3 border-b border-white/20">
                             <p class="text-sm">Hello,</p>
                             <p class="font-bold text-md truncate">${userName}</p>
                         </div>
                         <div class="py-1">
                             <a href="./profile.html" class="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md"><i class="fas fa-user-circle w-6 mr-2"></i><span>My Profile</span></a>
                             <a href="./order.html" class="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md"><i class="fas fa-box-open w-6 mr-2"></i><span>My Orders</span></a>
                             <a href="./delivered.html" class="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md"><i class="fas fa-check-circle w-6 mr-2"></i><span>Delivered Items</span></a>
                             
                             <a href="./wishlist.html" id="header-wishlist-icon" class="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md">
                                 <span class="flex items-center"><i class="fas fa-heart w-6 mr-2"></i>My Wishlist</span>
                                 <span class="wishlist-counter bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${wishlistItems.length}</span>
                             </a>
                             
                             <a href="./cart.html" id="header-cart-icon" class="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md">
                                 <span class="flex items-center"><i class="fas fa-shopping-cart w-6 mr-2"></i>My Cart</span>
                                 <span class="cart-counter bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${cartItems.length}</span>
                             </a>
                             <hr class="my-1 border-white/20">
                             <button onclick="logout()" class="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md"><i class="fas fa-sign-out-alt w-6 mr-2"></i><span>Logout</span></button>
                         </div>
                     </div>
                 </div>`;

        const accountBtn = document.getElementById('account-btn');
        const accountMenu = document.getElementById('account-menu');

        if (accountBtn && accountMenu) {
            // Toggles the menu visibility when the account button is clicked
            accountBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                accountMenu.classList.toggle('hidden');
            });

            // --- Define the new handler for this specific menu ---
            closeDropdownHandler = (event) => {
                if (!accountMenu.contains(event.target) && !accountBtn.contains(event.target)) {
                    accountMenu.classList.add('hidden');
                }
            };

            // --- Attach the new listener to the window ---
            window.addEventListener('click', closeDropdownHandler);
        }

    } else {
        // Logged-out state (no change needed here, as the counts are hardcoded to 0)
        navigation.innerHTML = `
            <a href="./signin.html" class="hidden md:block bg-white text-purple-700 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-100 transition">Login</a>
            
            <a href="./wishlist.html" id="header-wishlist-icon" class="relative hover:text-gray-200 transition nav-link">
                <i class="fas fa-heart text-2xl"></i>
                <span class="wishlist-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </a>

            <a href="./cart.html" id="header-cart-icon" class="relative hover:text-gray-200 transition nav-link">
                <i class="fas fa-shopping-cart text-2xl"></i>
                <span class="cart-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </a>
        `;
    }
}

window.logout = function() {
    localStorage.clear();
    window.location.href = './signin.html';
};

// Ensure window.updateHeader is async to match checkLoginStatus
window.updateHeader = async function() {
    await checkLoginStatus();
};

window.checkAuth = function() {
    const userToken = localStorage.getItem('userAuthToken');
    if (userToken) {
        return true;
    } else {
        const modal = document.getElementById('login-prompt-modal');
        if (modal) modal.classList.remove('hidden');
        return false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('header nav');
    if (nav && !nav.id) {
        nav.id = 'main-navigation';
    }
    
    // Call the async function on DOMContentLoaded
    checkLoginStatus();

    const modal = document.getElementById('login-prompt-modal');
    const closeModalBtn = document.getElementById('close-prompt-btn');
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
});