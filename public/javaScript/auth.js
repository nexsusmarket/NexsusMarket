// javaScript/auth.js

import { fetchUserData } from './apiService.js';

let closeDropdownHandler = null;

async function checkLoginStatus() {
    const userToken = localStorage.getItem('userAuthToken');
    const userName = localStorage.getItem('userName');
    const navigation = document.getElementById('main-navigation');
    
    if (!navigation) return;

    if (closeDropdownHandler) {
        window.removeEventListener('click', closeDropdownHandler);
        closeDropdownHandler = null;
    }

    // --- 1. Define the AI Button with the NEW CSS Class ---
    const aiButtonHtml = `
        <button id="nex-trigger" class="header-ai-trigger" title="Ask NEX AI">
            <i class="fas fa-microphone"></i>
        </button>
    `;

    if (userToken && userName) {
        // --- LOGGED IN STATE ---
        let wishlistCount = 0;
        let cartCount = 0;

        try {
            const userData = await fetchUserData();
            wishlistCount = (userData.wishlist || []).length;
            cartCount = (userData.cart || []).length;
            
            localStorage.setItem("wishlistProducts", JSON.stringify(userData.wishlist || []));
            localStorage.setItem("cartProducts", JSON.stringify(userData.cart || []));
        } catch (error) {
            console.warn("API fetch failed, using local storage", error);
            const w = JSON.parse(localStorage.getItem("wishlistProducts") || '[]');
            const c = JSON.parse(localStorage.getItem("cartProducts") || '[]');
            wishlistCount = w.length;
            cartCount = c.length;
        }

        // Layout: AI Button -> Account Button
        navigation.innerHTML = `
            <div class="flex items-center">
                
                ${aiButtonHtml} 

                <div class="relative">
                    <div id="account-btn" class="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-white/10 transition">
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
                                 
                                 <a href="./wishlist.html" class="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md">
                                    <span class="flex items-center"><i class="fas fa-heart w-6 mr-2"></i>My Wishlist</span>
                                    <span class="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${wishlistCount}</span>
                                 </a>
                                 
                                 <a href="./cart.html" class="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md">
                                    <span class="flex items-center"><i class="fas fa-shopping-cart w-6 mr-2"></i>My Cart</span>
                                    <span class="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${cartCount}</span>
                                 </a>
                                 <hr class="my-1 border-white/20">
                                 <button onclick="logout()" class="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md"><i class="fas fa-sign-out-alt w-6 mr-2"></i><span>Logout</span></button>
                             </div>
                         </div>
                    </div>
                </div>
            </div>`;

        // Re-attach dropdown listeners
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
        // Layout: AI Button -> Login -> Wishlist -> Cart
        localStorage.removeItem("wishlistProducts");
        localStorage.removeItem("cartProducts");

        navigation.innerHTML = `
            <div class="flex items-center">
                
                ${aiButtonHtml}

                <a href="./signin.html" class="hidden md:block bg-white text-purple-700 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-100 transition mr-4">Login</a>
                
                <a href="./wishlist.html" id="header-wishlist-icon" class="relative hover:text-yellow-300 transition nav-link mr-4">
                    <i class="fas fa-heart text-2xl"></i>
                    <span class="wishlist-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
                </a>

                <a href="./cart.html" id="header-cart-icon" class="relative hover:text-yellow-300 transition nav-link">
                    <i class="fas fa-shopping-cart text-2xl"></i>
                    <span class="cart-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
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