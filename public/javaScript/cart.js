// javascript/cart.js

import { updateCartQuantity, removeFromCart, fetchUserData, updateCartOffer } from './apiService.js';

// --- Loading Animation Function ---
let loadingInterval = null;
function startLoadingAnimation(button, baseText = "Processing") {
    let dotCount = 0;
    if (loadingInterval) clearInterval(loadingInterval);
    button.disabled = true;
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }
    loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        button.textContent = baseText + '.'.repeat(dotCount);
    }, 400);
}

function stopLoadingAnimation(button, restoreText = null) {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    button.textContent = restoreText || button.dataset.originalText || 'Submit';
    button.disabled = false;
}
// --- End Loading Animation ---

// --- Master list of all possible bank offers ---
const ALL_BANK_OFFERS = [
    { id: 'none', text: 'No offer', discount: 0, logoUrl: null },
    { id: 'ICICI5_MID', text: '5% ICICI', discount: 5, logoUrl: 'https://cdn.worldvectorlogo.com/logos/icici-bank-1.svg' },
    { id: 'HDFC250_MID', text: '₹250 HDFC', discount: 250, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/hdfc-bank-logo.svg' },
    { id: 'AXIS7_MID', text: '7% Axis Bank', discount: 7, logoUrl: 'https://cdn.worldvectorlogo.com/logos/axis-bank-logo-1.svg'},
    { id: 'KOTAK300_MID', text: '₹300 Kotak', discount: 300, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/kotak-mahindra-bank-logo.svg'},
    { id: 'HDFC10_HIGH', text: '10% HDFC', discount: 10, logoUrl: 'https://cdn.worldvectorlogo.com/logos/hdfc-bank-logo.svg' },
    { id: 'SBI1000_HIGH', text: '₹1000 SBI', discount: 1000, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/sbi-3.svg' },
    { id: 'AMEX8_HIGH', text: '8% Amex', discount: 8, logoUrl: 'https://cdn.worldvectorlogo.com/logos/american-express-1.svg' },
    { id: 'YES1200_HIGH', text: '₹1200 Yes Bank', discount: 1200, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/yes-bank.svg'}
];

function getBankOffersForPrice(price) {
    const noOffer = ALL_BANK_OFFERS.find(o => o.id === 'none');
    if (price > 10000) {
        return [noOffer, ...ALL_BANK_OFFERS.filter(o => o.id.endsWith('_HIGH'))];
    }
    if (price >= 1000) {
        return [noOffer, ...ALL_BANK_OFFERS.filter(o => o.id.endsWith('_MID'))];
    }
    return [noOffer];
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    const icon = toast.querySelector('i');
    icon.className = isError || message.toLowerCase().includes('error')
        ? 'fas fa-times-circle text-red-500'
        : 'fas fa-check-circle text-green-500';
    toast.classList.add('toast-show');
    setTimeout(() => toast.classList.remove('toast-show'), 3000);
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
// --- Student Discount API Calls ---
async function requestDiscountCode(studentEmail, productName) {
    const response = await fetch('/api/user/request-discount-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-phone': localStorage.getItem('userAuthToken')
        },
        body: JSON.stringify({ studentEmail, productName })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
}

async function verifyDiscountCode(verificationCode, productName) {
    const response = await fetch('/api/user/verify-discount-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-phone': localStorage.getItem('userAuthToken')
        },
        body: JSON.stringify({ verificationCode, productName })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
}
// --- End Student Discount API ---

function renderCart(cartItems) {
    const itemsContainer = document.querySelector(".cart-items-section");
    const summaryContainer = document.querySelector(".cart-summary");
    if (!itemsContainer || !summaryContainer) {
        console.error("Cart container or summary container not found in HTML.");
        return;
    }

    const validCartItems = Array.isArray(cartItems) ? cartItems : [];

    if (validCartItems.length === 0) {
        summaryContainer.style.display = 'none';
        itemsContainer.style.gridColumn = '1 / -1'; // Span full width
        itemsContainer.innerHTML = `<div class="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md"><i class="fas fa-shopping-cart text-6xl text-gray-300 mb-6"></i><h2 class="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2><p class="text-gray-500 mb-6">Looks like you haven't added anything yet.</p><a href="./explore.html" class="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition">Continue Shopping</a></div>`;
    } else {
        summaryContainer.style.display = 'block';
        itemsContainer.style.gridColumn = 'auto'; // Reset grid column span
        try {
            itemsContainer.innerHTML = validCartItems.map(product => {
                if (!product || typeof product.name === 'undefined' || typeof product.price === 'undefined' || typeof product.quantity === 'undefined') {
                    return ''; 
                }

                const availableOffers = getBankOffersForPrice(product.price);
                const selectedOffer = availableOffers.find(o => o.id === product.selectedOfferId) || availableOffers[0];
                const offerOptionsHTML = availableOffers.map(offer => `<li class="custom-option ${offer.id === selectedOffer.id ? 'selected' : ''}" data-value="${offer.id}">${offer.logoUrl ? `<img src="${offer.logoUrl}" alt="${offer.text}" class="offer-logo">` : '<div class="offer-logo"></div>'}<span>${offer.text}</span></li>`).join('');
                const customDropdownHTML = product.price >= 1000
                    ? `<div class="custom-select-wrapper" data-product-name="${encodeURIComponent(product.name)}"><div class="custom-select-trigger">${selectedOffer.logoUrl ? `<img src="${selectedOffer.logoUrl}" alt="${selectedOffer.text}" class="offer-logo">` : '<div class="offer-logo"></div>'}<span>${selectedOffer.text}</span><i class="fas fa-chevron-down dropdown-arrow"></i></div><ul class="custom-options">${offerOptionsHTML}</ul></div>`
                    : `<div class="text-xs text-gray-400 mt-2 p-1">No bank offers available</div>`;

                const accountNumberHTML = (product.accountNumber && product.selectedOfferId && product.selectedOfferId !== 'none') ? `<div class="text-xs text-green-600 font-bold mt-1">Offer applied to A/C ****${product.accountNumber.slice(-4)}</div>` : '';

                const isEligibleForStudentDiscount = product.price >= 1000 && ['laptop', 'mobile'].includes(product.category?.toLowerCase());
                const studentDiscountHTML = isEligibleForStudentDiscount
                    ? (product.discount > 0 ? `<span class="text-xs text-green-600 font-bold">${product.discount}% Student Discount Applied!</span>` : `<button class="student-discount-btn text-xs text-purple-600 hover:underline">Apply Student Discount</button>`)
                    : '';

                let finalPrice = product.price;
                const studentDiscountPrice = (product.discount > 0) ? product.price * (1 - product.discount / 100) : product.price;
                finalPrice = studentDiscountPrice;
                if (selectedOffer && selectedOffer.discount > 0) {
                    finalPrice = selectedOffer.isFlat ? studentDiscountPrice - selectedOffer.discount : studentDiscountPrice * (1 - selectedOffer.discount / 100);
                }
                if (finalPrice < 0) finalPrice = 0;
                
                const displayPriceHTML = (finalPrice < product.price) ? `<div class="flex flex-col items-end"><span class="text-red-500 font-bold text-lg">₹${(finalPrice * product.quantity).toFixed(2)}</span><span class="text-gray-400 line-through text-sm">₹${(product.price * product.quantity).toFixed(2)}</span></div>` : `<span class="font-bold text-lg">₹${(product.price * product.quantity).toFixed(2)}</span>`;

                return `<div class="cart-item-row" data-product-name="${encodeURIComponent(product.name)}"><div class="cart-product-details"><img src="${product.image || 'placeholder.png'}" alt="${product.name}" class="cart-product-image cursor-pointer"><div class="cart-product-meta"><h2 class="cart-product-name">${product.name}</h2>${studentDiscountHTML}${customDropdownHTML}${accountNumberHTML}</div></div><div class="cart-quantity-selector"><div class="flex items-center border border-gray-300 rounded-md overflow-hidden"><button class="quantity-minus px-3 py-2 text-red-500 hover:bg-red-100 transition"><i class="fas fa-minus"></i></button><span class="quantity-display px-4 py-1 font-semibold">${product.quantity}</span><button class="quantity-plus px-3 py-2 text-green-600 hover:bg-green-100 transition"><i class="fas fa-plus"></i></button></div></div><div class="cart-price-display">${displayPriceHTML}</div><button class="cart-remove-button" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg></button></div>`;
            }).join('');
        } catch (renderError) {
             console.error("Error during cart item rendering:", renderError);
             itemsContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Error rendering cart items. Please try refreshing.</p>`;
             summaryContainer.style.display = 'none'; 
        }
    }
    updateTotals();
}

function updateTotals() {
    const items = JSON.parse(localStorage.getItem('cartProducts')) || [];
    const address = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
    const validItems = Array.isArray(items) ? items.filter(p => p && typeof p.price === 'number' && typeof p.quantity === 'number') : []; 

    const totalItems = validItems.reduce((sum, p) => sum + p.quantity, 0);

    const subtotal = validItems.reduce((sum, p) => {
        let itemPrice = p.price;
        if (p.discount > 0) {
            itemPrice *= (1 - p.discount / 100);
        }
        const selectedOffer = ALL_BANK_OFFERS.find(offer => offer.id === p.selectedOfferId);
        if (selectedOffer?.discount > 0) {
            itemPrice = selectedOffer.isFlat ? itemPrice - selectedOffer.discount : itemPrice * (1 - selectedOffer.discount / 100);
        }
        return sum + (Math.max(0, itemPrice) * p.quantity);
    }, 0);

    let shipping = 0;
    let shippingText = "Free";
    let shippingLabelText = "Shipping";

    if (subtotal > 0) {
        const state = (address.state || "").toLowerCase().trim().replace(/\s+/g, '');
        
        if (state === 'andhrapradesh' || state === 'telangana') {
            shipping = 0;
            shippingText = "Free";
            shippingLabelText = "Shipping (Free)";
        } else {
            shipping = 100;
            shippingText = `₹${shipping.toFixed(2)}`;
        }
    } else {
        shippingText = "₹0.00";
    }

    const total = subtotal + shipping;
    document.getElementById('cart-item-count').textContent = totalItems;
    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-shipping').textContent = shippingText;
    document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
    document.getElementById('shipping-label').textContent = shippingLabelText;
}

async function setupCartPage() {
    console.log("Setting up cart page...");
    if (!localStorage.getItem('userAuthToken')) {
        console.log("User not authenticated, redirecting to signin.");
        document.body.innerHTML = `<div class="text-center p-10"><h1 class="text-2xl font-bold">Please sign in to view your cart.</h1><a href="./signin.html" class="text-blue-600 hover:underline mt-4 inline-block">Go to Sign In</a></div>`;
        return;
    }

    // Modal References
    const accountNumberModal = document.getElementById('account-number-modal');
    const accountNumberForm = document.getElementById('account-number-form');
    const accountNumberInput = document.getElementById('account-number-input');
    const cvvInput = document.getElementById('cvv-input');
    const accountNumberCloseBtn = document.getElementById('account-number-modal-close-btn');
    const accountNumberError = document.getElementById('account-number-error');
    const emailModal = document.getElementById('student-email-modal');
    const emailModalCloseBtn = document.getElementById('student-email-modal-close-btn');
    const emailForm = document.getElementById('student-email-form');
    const emailInput = document.getElementById('student-email-input');
    const studentEmailError = document.getElementById('student-email-error');
    const codeModal = document.getElementById('verification-code-modal');
    const codeModalCloseBtn = document.getElementById('verification-code-modal-close-btn');
    const codeForm = document.getElementById('verification-code-form');

    const emailSubmitBtn = emailForm?.querySelector('button[type="submit"]');
    if (emailSubmitBtn) emailSubmitBtn.dataset.originalText = emailSubmitBtn.textContent;
    const codeSubmitBtn = codeForm?.querySelector('button[type="submit"]');
    if (codeSubmitBtn) codeSubmitBtn.dataset.originalText = codeSubmitBtn.textContent;
    const accountSubmitBtn = accountNumberForm?.querySelector('button[type="submit"]');
    if (accountSubmitBtn) accountSubmitBtn.dataset.originalText = accountSubmitBtn.textContent;

    let productForOffer = null;
    let productForDiscount = '';

    try {
        console.log("Fetching user data...");
        const userData = await fetchUserData();
        console.log("User data fetched:", userData);

        const cartData = userData.cart || [];
        const addressData = userData.address || {};

        console.log("Cart data from server:", cartData);

        // Update local storage *before* rendering
        localStorage.setItem('cartProducts', JSON.stringify(cartData));
        localStorage.setItem('deliveryAddress', JSON.stringify(addressData));

        console.log("Rendering cart with items:", cartData);
        renderCart(cartData); // Render using the fetched data

        const locationDisplay = document.getElementById('delivery-location');
        const updateDisplayLocation = (address) => {
            locationDisplay.textContent = (address?.name && address?.mobile)
                ? `${address.name}, ${address.mobile}`
                : 'Add a delivery address';
        };
        updateDisplayLocation(addressData);

    } catch (error) {
         console.error("Failed to fetch initial user data:", error);
         const itemsContainer = document.querySelector(".cart-items-section");
         const summaryContainer = document.querySelector(".cart-summary");
         if(itemsContainer) {
             itemsContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Error loading cart data. Please try refreshing the page.</p>`;
         }
         if(summaryContainer) {
             summaryContainer.style.display = 'none';
         }
         return;
    }

    // --- Modal Event Listeners ---
    emailModalCloseBtn?.addEventListener('click', () => emailModal.classList.add('hidden'));
    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled && loadingInterval) return;

        if (studentEmailError) {
            studentEmailError.textContent = '';
            studentEmailError.classList.add('hidden');
        }
        startLoadingAnimation(submitBtn, "Sending");

        try {
            const result = await requestDiscountCode(emailInput.value, productForDiscount);
            stopLoadingAnimation(submitBtn);
            showToast(result.message);
            emailModal.classList.add('hidden');
            codeModal.classList.remove('hidden');
        } catch (error) {
            stopLoadingAnimation(submitBtn);
            if (studentEmailError) {
                studentEmailError.textContent = error.message;
                studentEmailError.classList.remove('hidden');
            } else {
                 showToast(`Error: ${error.message}`, true);
            }
        }
    });

    codeModalCloseBtn?.addEventListener('click', () => codeModal.classList.add('hidden'));
    codeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
         if (submitBtn.disabled && loadingInterval) return;

        const codeInput = document.getElementById('verification-code-input');
        startLoadingAnimation(submitBtn, "Verifying");

        try {
            const result = await verifyDiscountCode(codeInput.value, productForDiscount);
            stopLoadingAnimation(submitBtn);
            showToast(result.message);
            codeModal.classList.add('hidden');
            const freshUserData = await fetchUserData(); // Fetch updated data
            localStorage.setItem('cartProducts', JSON.stringify(freshUserData.cart));
            renderCart(freshUserData.cart); // Re-render
            window.updateHeader?.();
        } catch (error) {
            stopLoadingAnimation(submitBtn);
            showToast(`Error: ${error.message}`, true);
        }
    });

    accountNumberCloseBtn?.addEventListener('click', () => accountNumberModal.classList.add('hidden'));
    accountNumberForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled && loadingInterval) return;
        if (!productForOffer) return;

        const accountNumber = accountNumberInput.value.trim();
        const cvv = cvvInput.value.trim();
        const offerId = productForOffer.offerId;

        accountNumberError.classList.add('hidden');
        if (!/^\d{16}$/.test(accountNumber)) {
            accountNumberError.textContent = 'Invalid card number (16 digits).';
            accountNumberError.classList.remove('hidden'); return;
        }
        if (!/^\d{3}$/.test(cvv)) {
            accountNumberError.textContent = 'Invalid CVV (3 digits).';
            accountNumberError.classList.remove('hidden'); return;
        }

        startLoadingAnimation(submitBtn, "Applying");

        try {
            await updateCartOffer(productForOffer.name, offerId, accountNumber);
            stopLoadingAnimation(submitBtn);

            const freshUserData = await fetchUserData(); // Fetch updated data
            localStorage.setItem('cartProducts', JSON.stringify(freshUserData.cart));
            renderCart(freshUserData.cart); // Re-render
            window.updateHeader?.();

            accountNumberModal.classList.add('hidden');
            accountNumberForm.reset();
            productForOffer = null;
            showToast('Bank offer applied!');

        } catch (error) {
            stopLoadingAnimation(submitBtn);
            showToast(`Error applying offer: ${error.message}`, true);
        }
    });

    // --- Main Event Listener for Cart Actions ---
    const cartContainer = document.querySelector(".cart-container");
    cartContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const button = target.closest('button');
        const trigger = target.closest('.custom-select-trigger');
        const option = target.closest('.custom-option');
        const row = target.closest('.cart-item-row');
        const productName = row ? decodeURIComponent(row.dataset.productName) : null;
        
        // 🔥 FIX: IMAGE CLICK NAVIGATION
        if (target.classList.contains('cart-product-image')) {
            if (productName) {
                e.preventDefault();
                window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
                return; 
            }
        }

        // Custom Select Dropdown Logic
        if (trigger) {
            e.preventDefault();
            const wrapper = trigger.closest('.custom-select-wrapper');
            document.querySelectorAll('.custom-select-wrapper.open').forEach(openWrapper => {
                if (openWrapper !== wrapper) openWrapper.classList.remove('open');
            });
            wrapper.classList.toggle('open');
            return;
        }

        // Custom Select Option Logic
        if (option) {
             e.stopPropagation();
            const wrapper = option.closest('.custom-select-wrapper');
            const selectedProductName = decodeURIComponent(wrapper.dataset.productName);
            const selectedOfferId = option.dataset.value;
            wrapper.classList.remove('open');

            if (selectedOfferId === 'none') {
                 try {
                     await updateCartOffer(selectedProductName, 'none', null);
                     const freshUserData = await fetchUserData();
                     localStorage.setItem('cartProducts', JSON.stringify(freshUserData.cart));
                     renderCart(freshUserData.cart);
                     window.updateHeader?.();
                 } catch(error) {
                     showToast(`Error removing offer: ${error.message}`, true);
                 }
             } else {
                 productForOffer = { name: selectedProductName, offerId: selectedOfferId };
                 accountNumberInput.value = '';
                 cvvInput.value = '';
                 accountNumberError.textContent = '';
                 accountNumberError.classList.add('hidden');
                 accountNumberModal.classList.remove('hidden');
                 accountNumberInput.focus();
             }
             return;
         }

         // Close dropdown if clicking outside
         if (!target.closest('.custom-select-wrapper')) {
             document.querySelectorAll('.custom-select-wrapper.open').forEach(wrapper => {
                 wrapper.classList.remove('open');
             });
        }

        if (!button) return;

        if (button.classList.contains('student-discount-btn')) {
            if (productName) {
                productForDiscount = productName;
                emailInput.value = '';
                studentEmailError.textContent = '';
                studentEmailError.classList.add('hidden');
                emailModal.classList.remove('hidden');
            }
            return;
        }

        // *** CHECKOUT BUTTON LOGIC (FIXED) ***
        if (button.classList.contains('cart-checkout-button')) {
            const currentCartItems = JSON.parse(localStorage.getItem('cartProducts')) || [];
            const deliveryAddress = JSON.parse(localStorage.getItem('deliveryAddress')) || {};

            if (currentCartItems.length === 0) {
                showToast('Error: Your cart is empty.', true); return;
            }
            if (!deliveryAddress.pincode) {
                showToast('Error: Please add a delivery address.', true); return;
            }

            // Calculate final price BEFORE navigating
            const checkoutCartItems = currentCartItems.map(item => {
                let finalPrice = item.price;
                if (item.discount > 0) {
                    finalPrice = finalPrice * (1 - item.discount / 100);
                }
                const selectedOffer = ALL_BANK_OFFERS.find(offer => offer.id === item.selectedOfferId);
                if (selectedOffer && selectedOffer.discount > 0) {
                    finalPrice = selectedOffer.isFlat ? finalPrice - selectedOffer.discount : finalPrice * (1 - selectedOffer.discount / 100);
                }
                if (finalPrice < 0) finalPrice = 0;
                return { ...item, pricePaid: finalPrice };
            });

            // Save the cart WITH pricePaid specifically for checkout
            localStorage.setItem('checkoutReadyCart', JSON.stringify(checkoutCartItems));
            
            // EXPLICITLY DISABLE BUY NOW MODE
            localStorage.setItem('buyNowMode', 'false');

            button.disabled = true;
            button.textContent = 'Proceeding...';
            window.location.href = './checkout.html';
            return;
        }
        
        // Handle Quantity and Remove buttons
        if (productName) {
            const product = (JSON.parse(localStorage.getItem('cartProducts')) || []).find(p => p.name === productName);
            if (!product) return;

            const qtyButtons = row.querySelectorAll('.quantity-plus, .quantity-minus, .cart-remove-button');
            qtyButtons.forEach(btn => btn.disabled = true); 

            try {
                 if (button.classList.contains('quantity-plus')) {
                     await updateCartQuantity(productName, product.quantity + 1);
                 } else if (button.classList.contains('quantity-minus')) {
                     await updateCartQuantity(productName, product.quantity - 1);
                 } else if (button.classList.contains('cart-remove-button')) {
                     await removeFromCart(productName);
                 }

                 const freshUserData = await fetchUserData(); 
                 const serverCart = freshUserData.cart || [];
                 localStorage.setItem('cartProducts', JSON.stringify(serverCart));
                 renderCart(serverCart); 
                 window.updateHeader?.();
             } catch (error) {
                 showToast(`Error updating cart: ${error.message}`, true);
                 const currentRow = document.querySelector(`.cart-item-row[data-product-name="${encodeURIComponent(productName)}"]`);
                 currentRow?.querySelectorAll('.quantity-plus, .quantity-minus, .cart-remove-button').forEach(btn => btn.disabled = false);
             }
        }
    });
}

document.addEventListener('DOMContentLoaded', setupCartPage);