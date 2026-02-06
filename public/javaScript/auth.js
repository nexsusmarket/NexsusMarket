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

    // --- 1. Define the AI Button HTML (Reusable Component) ---
    // Using Tailwind classes to match the header style
    const aiButtonHtml = `
        <button id="nex-trigger" class="mr-6 flex items-center justify-center text-white hover:text-yellow-300 transition-transform hover:scale-110 focus:outline-none" title="Ask NEX AI">
            <i class="fas fa-microphone text-2xl animate-pulse"></i>
        </button>
    `;

    // --- 2. Build Navigation Based on Login Status ---
    if (userToken && userName) {
        // --- LOGGED IN STATE ---
        // Layout: AI Button -> Account Dropdown
        
        let wishlistCount = 0;
        let cartCount = 0;

        try {
            const userData = await fetchUserData();
            const wishlist = userData.wishlist || [];
            const cart = userData.cart || [];
            wishlistCount = wishlist.length;
            cartCount = cart.length;
            
            localStorage.setItem("wishlistProducts", JSON.stringify(wishlist));
            localStorage.setItem("cartProducts", JSON.stringify(cart));
        } catch (error) {
            console.warn("API fetch failed, using local storage", error);
            const w = JSON.parse(localStorage.getItem("wishlistProducts") || '[]');
            const c = JSON.parse(localStorage.getItem("cartProducts") || '[]');
            wishlistCount = w.length;
            cartCount = c.length;
        }

        navigation.innerHTML = `
            <div class="flex items-center">
                
                ${aiButtonHtml}

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
                             <div class="px-4 py-3 border-b border-white/20">
                                 <p class="text-xs text-gray-300">Hello,</p>
                                 <p class="font-bold text-md truncate text-white">${userName}</p>
                             </div>
                             <div class="py-2">
                                 <a href="./profile.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-user-circle w-5 mr-3 text-center"></i>My Profile</a>
                                 <a href="./order.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-box-open w-5 mr-3 text-center"></i>My Orders</a>
                                 <a href="./delivered.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition"><i class="fas fa-check-circle w-5 mr-3 text-center"></i>Delivered</a>
                                 <a href="./wishlist.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition justify-between">
                                    <span><i class="fas fa-heart w-5 mr-3 text-center"></i>Wishlist</span>
                                    <span class="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">${wishlistCount}</span>
                                 </a>
                                 <a href="./cart.html" class="flex items-center px-4 py-2 text-sm text-gray-100 hover:bg-white/10 rounded-md transition justify-between">
                                    <span><i class="fas fa-shopping-cart w-5 mr-3 text-center"></i>Cart</span>
                                    <span class="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">${cartCount}</span>
                                 </a>
                                 <div class="my-1 border-t border-white/10"></div>
                                 <button onclick="logout()" class="w-full text-left flex items-center px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 rounded-md transition"><i class="fas fa-sign-out-alt w-5 mr-3 text-center"></i>Logout</button>
                             </div>
                         </div>
                    </div>
                </div>
            </div>`;

        // Attach Dropdown Listeners
        const accountBtn = document.getElementById('account-btn');
        const accountMenu = document.getElementById('account-menu');
        if (accountBtn && accountMenu) {
            accountBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                accountMenu.classList.toggle('hidden');
            });
            closeDropdownHandler = (e) => {
                if (!accountMenu.contains(e.target) && !accountBtn.contains(e.target)) {
                    accountMenu.classList.add('hidden');
                }
            };
            window.addEventListener('click', closeDropdownHandler);
        }

    } else {
        // --- LOGGED OUT STATE ---
        // Layout: AI Button -> Login Button -> Wishlist Icon -> Cart Icon
        
        // Reset counts
        localStorage.removeItem("wishlistProducts");
        localStorage.removeItem("cartProducts");

        navigation.innerHTML = `
            <div class="flex items-center">
                
                ${aiButtonHtml}

                <a href="./signin.html" class="hidden md:block bg-white text-purple-700 px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition shadow-sm mr-6">
                    Login
                </a>
                
                <a href="./wishlist.html" id="header-wishlist-icon" class="relative hover:text-yellow-300 transition nav-link mr-6 group">
                    <i class="fas fa-heart text-2xl group-hover:scale-110 transition-transform"></i>
                    <span class="wishlist-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">0</span>
                </a>

                <a href="./cart.html" id="header-cart-icon" class="relative hover:text-yellow-300 transition nav-link group">
                    <i class="fas fa-shopping-cart text-2xl group-hover:scale-110 transition-transform"></i>
                    <span class="cart-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">0</span>
                </a>
            </div>
        `;
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
    if (userToken) return true;
    const modal = document.getElementById('login-prompt-modal');
    if (modal) modal.classList.remove('hidden');
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('header nav');
    if (nav && !nav.id) nav.id = 'main-navigation';
    checkLoginStatus();

    const modal = document.getElementById('login-prompt-modal');
    const closeModalBtn = document.getElementById('close-prompt-btn');
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }
});