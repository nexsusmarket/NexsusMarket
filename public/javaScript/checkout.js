import { API_URL } from './apiService.js'; // Importing URL to manually call fetch with flags

// --- Toast Notification ---
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    const icon = toast.querySelector('i');

    if (message.toLowerCase().includes('error')) {
        icon.className = 'fas fa-times-circle text-red-500';
    } else {
        icon.className = 'fas fa-check-circle text-green-500';
    }

    toast.classList.add('toast-show');
    setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

// --- Helper: Calculate Shipping Logic ---
function getShippingCost(address) {
    if (!address || !address.state) return 100;
    const cleanState = address.state.trim().toLowerCase().replace(/\s+/g, '');
    if (['andhrapradesh', 'telangana'].includes(cleanState)) {
        return 0;
    }
    return 100;
}

// --- Render Functions ---
function renderCheckoutSummary() {
    // 1. Check for Buy Now Mode
    const isBuyNow = localStorage.getItem('buyNowMode') === 'true';
    let cart = [];
    
    // Always check checkoutReadyCart first, as it has final prices
    cart = JSON.parse(localStorage.getItem('checkoutReadyCart')) || [];

    // Fallback for normal checkout if checkoutReadyCart is empty (edge case)
    if (!isBuyNow && cart.length === 0) {
        cart = JSON.parse(localStorage.getItem('cartProducts')) || [];
    }

    const address = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
    const itemsContainer = document.getElementById('order-summary-items');

    if (cart.length === 0) {
        if (isBuyNow) {
             console.error("Buy Now data missing.");
             window.location.href = './index.html';
        } else {
             console.error("Cart data missing.");
             window.location.href = './cart.html';
        }
        return;
    }

    const subtotal = cart.reduce((sum, p) => {
        const itemFinalPrice = p.pricePaid !== undefined ? p.pricePaid : p.price;
        return sum + (itemFinalPrice * p.quantity);
    }, 0);

    const shipping = getShippingCost(address);
    const total = subtotal + shipping;

    itemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
            <div class="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center">
                <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full object-contain">
            </div>
            <div class="flex-grow">
                <p class="font-semibold text-gray-800 text-sm line-clamp-2">${item.name}</p>
                <div class="flex justify-between items-center mt-1">
                    <p class="text-xs text-gray-500">Qty: ${item.quantity}</p>
                    <p class="font-medium text-gray-900">₹${((item.pricePaid !== undefined ? item.pricePaid : item.price) * item.quantity).toFixed(2)}</p>
                </div>
                 ${item.discount > 0 ? `<p class="text-xs text-green-600 mt-1"><i class="fas fa-tag mr-1"></i>Student Discount Applied</p>` : ''}
                 ${item.selectedOfferId && item.selectedOfferId !== 'none' ? `<p class="text-xs text-blue-600 mt-1"><i class="fas fa-credit-card mr-1"></i>Bank Offer Applied</p>` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `₹${total.toFixed(2)}`;

    const addressContainer = document.getElementById('shipping-address-summary');
    if (!address || !address.pincode) {
         addressContainer.innerHTML = `
            <div class="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 text-sm">
                <i class="fas fa-exclamation-circle mr-2"></i> Shipping address is missing.
            </div>
            <a href="./address.html" class="block text-center bg-gray-900 text-white py-2 rounded mt-3 text-sm hover:bg-gray-800 transition">Add Address</a>
         `;
         document.getElementById('place-order-btn').disabled = true;
         document.getElementById('place-order-btn').classList.add('opacity-50', 'cursor-not-allowed');

    } else {
        addressContainer.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm text-gray-700 relative group">
                <p class="font-bold text-gray-900 mb-1">${address.name || 'N/A'}</p>
                <p>${address.address || ''}</p>
                <p>${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}</p>
                <p class="mt-2 text-gray-500">Mobile: <span class="text-gray-900">${address.mobile || ''}</span></p>
                <a href="./address.html" class="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase tracking-wide">Edit</a>
            </div>
        `;
         document.getElementById('place-order-btn').disabled = false;
         document.getElementById('place-order-btn').classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('userAuthToken')) {
        window.location.href = './signin.html';
        return;
    }

    renderCheckoutSummary();

    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const deliveryAddress = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
        if (!deliveryAddress.pincode) {
             showToast('Error: Please add a complete delivery address.');
             return;
        }

        const placeOrderBtn = document.getElementById('place-order-btn');
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

        // 1. DETERMINE SOURCE BASED ON MODE
        const isBuyNow = localStorage.getItem('buyNowMode') === 'true';
        let checkoutItems = JSON.parse(localStorage.getItem('checkoutReadyCart')) || [];

        if (checkoutItems.length === 0) {
            showToast("No items to checkout.");
            placeOrderBtn.disabled = false;
            return;
        }

        const subtotal = checkoutItems.reduce((sum, p) => {
            const itemFinalPrice = p.pricePaid !== undefined ? p.pricePaid : p.price;
            return sum + (itemFinalPrice * p.quantity);
        }, 0);

        const shippingCost = getShippingCost(deliveryAddress);
        const totalAmount = subtotal + shippingCost;

        const itemsForOrder = checkoutItems.map(item => ({
             name: item.name,
             image: item.image,
             price: item.price, 
             quantity: item.quantity,
             pricePaid: item.pricePaid !== undefined ? item.pricePaid : item.price,
             category: item.category, 
             discount: item.discount, 
             selectedOfferId: item.selectedOfferId 
        }));

        const newOrder = {
            orderId: `NEXUS-${Date.now()}`,
            orderDate: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            items: itemsForOrder,
            shippingCost: shippingCost,
            totalAmount: totalAmount,
            shippingAddress: deliveryAddress
        };

        // 2. SEND ORDER WITH 'isBuyNow' FLAG
        // We manually call fetch here to override the restrictive structure of apiService.js
        const orderPayload = {
            order: newOrder,
            isBuyNow: isBuyNow // This flag tells the server NOT to clear the DB cart
        };

        try {
            const token = localStorage.getItem('userAuthToken');
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-phone': token
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to place order');
            }

            showToast('Order placed successfully! Redirecting...');
            
            // 3. CLEANUP
            if (isBuyNow) {
                localStorage.removeItem('checkoutReadyCart');
                localStorage.removeItem('buyNowMode');
            } else {
                localStorage.removeItem('cartProducts');
            }
            
            setTimeout(() => { window.location.href = './order.html'; }, 2000);
        } catch (error) {
            showToast(`Error: ${error.message || 'Could not place order.'}`);
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        }
    });
});