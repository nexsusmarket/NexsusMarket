// javaScript/auth.js

import { fetchUserData } from './apiService.js';

let closeDropdownHandler = null;

async function checkLoginStatus() {
    const userToken = localStorage.getItem('userAuthToken');
    const userName = localStorage.getItem('userName');
    const navigation = document.getElementById('main-navigation');
    
    if (!navigation) return;

    // Cleanup old event listeners
    if (closeDropdownHandler) {
        window.removeEventListener('click', closeDropdownHandler);
        closeDropdownHandler = null;
    }

    // --- 1. Determine State & Fetch Data ---
    let wishlistCount = 0;
    let cartCount = 0;
    let isLoggedIn = false;

    if (userToken && userName) {
        isLoggedIn = true;
        try {
            const userData = await fetchUserData();
            const wishlist = userData.wishlist || [];
            const cart = userData.cart || [];
            
            wishlistCount = wishlist.length;
            cartCount = cart.length;

            // Update storage for sync
            localStorage.setItem("wishlistProducts", JSON.stringify(wishlist));
            localStorage.setItem("cartProducts", JSON.stringify(cart));
        } catch (error) {
            console.warn("API fetch failed, using local storage", error);
            const w = JSON.parse(localStorage.getItem("wishlistProducts") || '[]');
            const c = JSON.parse(localStorage.getItem("cartProducts") || '[]');
            wishlistCount = w.length;
            cartCount = c.length;
        }
    } else {
        // Logged out: Reset counts to 0
        localStorage.removeItem("wishlistProducts");
        localStorage.removeItem("cartProducts");
    }

    // --- 2. Build The HTML ---
    
    // A. The Icons (Wishlist & Cart) - ALWAYS on the Left
    const iconsHtml = `
        <div class="flex items-center space-x-6 mr-6">
            
            <button id="nex-trigger" class="group relative flex items-center justify-center text-gray-100 hover:text-cyan-400 transition-colors duration-300" title="Ask NEX AI">
                 <span class="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-20 animate-ping group-hover:opacity-40"></span>
                 <i class="fas fa-microphone-alt text-2xl relative z-10 group-hover:scale-110 transition-transform"></i>
            </button>

            <a href="./wishlist.html" id="header-wishlist-icon" class="relative hover:text-yellow-300 transition nav-link group text-gray-100">
                <i class="fas fa-heart text-2xl group-hover:scale-110 transition-transform"></i>
                <span class="wishlist-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    ${wishlistCount}
                </span>
            </a>

            <a href="./cart.html" id="header-cart-icon" class="relative hover:text-yellow-300 transition nav-link group text-gray-100">
                <i class="fas fa-shopping-cart text-2xl group-hover:scale-110 transition-transform"></i>
                <span class="cart-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    ${cartCount}
                </span>
            </a>
        </div>
    `;

    // B. The Dropdown Content (Changes based on Login Status)
    let dropdownInnerHtml = '';

    if (isLoggedIn) {
        // CONTENT: LOGGED IN
        dropdownInnerHtml = `
            <div class="px-4 py-3 border-b border-white/20">
                <p class="text-xs text-gray-300">Hello,</p>
                <p class="font-bold text-md truncate text-white">${userName}</p>
            </div>
            <div class="py-2">
                <a href="./profile.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-user-circle w-5 mr-3 text-center"></i>My Profile</a>
                <a href="./order.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-box-open w-5 mr-3 text-center"></i>My Orders</a>
                <a href="./delivered.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-check-circle w-5 mr-3 text-center"></i>Delivered</a>
                <div class="my-1 border-t border-white/10"></div>
                <button onclick="logout()" class="w-full text-left flex items-center px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 rounded-md transition"><i class="fas fa-sign-out-alt w-5 mr-3 text-center"></i>Logout</button>
            </div>
        `;
    } else {
        // CONTENT: LOGGED OUT
        dropdownInnerHtml = `
            <div class="px-4 py-4 text-center border-b border-white/20">
                <p class="font-bold text-lg text-white mb-1">Welcome</p>
                <p class="text-xs text-gray-300 mb-3">To access account and manage orders</p>
                <a href="./signin.html" class="block w-full py-2 rounded-md bg-white text-indigo-600 font-bold text-sm hover:bg-gray-100 transition shadow-md">
                    LOGIN / SIGN UP
                </a>
            </div>
        `;
    }

    // --- 3. Assemble Final Navigation ---
    navigation.innerHTML = `
        <div class="flex items-center">
            
            ${iconsHtml}

            <div class="relative">
                <div id="account-btn" class="flex items-center space-x-2 cursor-pointer py-2 px-3 rounded-lg hover:bg-white/10 transition border border-transparent hover:border-white/20">
                    <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <i class="fas fa-user text-sm"></i>
                    </div>
                    <span class="font-semibold text-sm hidden sm:block">Account</span>
                    <i class="fas fa-chevron-down text-xs ml-1 opacity-70"></i>
                </div>

                <div id="account-menu" class="absolute right-0 top-full mt-2 w-64 account-dropdown-menu-glass hidden z-[60] origin-top-right transform transition-all duration-200"> 
                     <div class="glass-background-blur rounded-xl"></div>
                     <div class="dropdown-content-layer relative z-10">
                         ${dropdownInnerHtml}
                     </div>
                </div>
            </div>

        </div>
    `;

    // --- 4. Event Listeners ---
    const accountBtn = document.getElementById('account-btn');
    const accountMenu = document.getElementById('account-menu');

    if (accountBtn && accountMenu) {
        accountBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            accountMenu.classList.toggle('hidden');
        });

        // Store handler to remove it later if needed
        closeDropdownHandler = (event) => {
            if (!accountMenu.contains(event.target) && !accountBtn.contains(event.target)) {
                accountMenu.classList.add('hidden');
            }
        };

        window.addEventListener('click', closeDropdownHandler);
    }
}

// Global functions
window.logout = function() {
    localStorage.clear();
    window.location.href = './signin.html';
};

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
    // Ensure Nav ID exists
    const nav = document.querySelector('header nav');
    if (nav && !nav.id) nav.id = 'main-navigation';
    
    checkLoginStatus();

    // Setup Modal Close Logic
    const modal = document.getElementById('login-prompt-modal');
    const closeModalBtn = document.getElementById('close-prompt-btn');
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
});