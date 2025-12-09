import { placeOrder } from './apiService.js';

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
// We define this outside so both render and submit can use the exact same logic
function getShippingCost(subtotal, address) {
    if (subtotal === 0) return 0;
    if (address && address.state) {
        const cleanState = address.state.trim().toLowerCase().replace(/\s+/g, '');
        if (['andhrapradesh', 'telangana'].includes(cleanState)) {
            return 0; // Free shipping
        }
    }
    // 10% shipping, capped at 100
    const cost = subtotal * 0.10;
    return Math.min(cost, 100);
}

// --- Render Functions ---
function renderCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('checkoutReadyCart')) || [];
    const address = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
    const itemsContainer = document.getElementById('order-summary-items');

    if (cart.length === 0) {
        console.error("Checkout cart data missing. Redirecting to cart.");
        window.location.href = '/cart.html';
        return;
    }

    const subtotal = cart.reduce((sum, p) => {
        const itemFinalPrice = p.pricePaid !== undefined ? p.pricePaid : p.price;
        return sum + (itemFinalPrice * p.quantity);
    }, 0);

    const shipping = getShippingCost(subtotal, address);
    const total = subtotal + shipping;

    itemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
            <div>
                <p class="font-semibold">${item.name}</p>
                <p class="text-sm text-gray-500">Qty: ${item.quantity}</p>
                 ${item.discount > 0 ? `<p class="text-xs text-green-600">Student Discount Applied</p>` : ''}
                 ${item.selectedOfferId && item.selectedOfferId !== 'none' ? `<p class="text-xs text-blue-600">Bank Offer Applied</p>` : ''}
            </div>
            <p class="ml-auto font-medium">₹${( (item.pricePaid !== undefined ? item.pricePaid : item.price) * item.quantity).toFixed(2)}</p>
        </div>
    `).join('');

    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `₹${total.toFixed(2)}`;

    const addressContainer = document.getElementById('shipping-address-summary');
    if (!address || !address.pincode) {
         addressContainer.innerHTML = `
            <p class="text-red-500 font-semibold">Shipping address is missing or incomplete.</p>
            <a href="address.html" class="text-blue-600 hover:underline mt-2 inline-block">Add/Edit Address</a>
         `;
         document.getElementById('place-order-btn').disabled = true;
         document.getElementById('place-order-btn').classList.add('opacity-50', 'cursor-not-allowed');

    } else {
        addressContainer.innerHTML = `
            <p><strong>${address.name || 'N/A'}</strong></p>
            <p>${address.address || ''}, ${address.city || ''}</p>
            <p>${address.state || ''}, ${address.pincode || ''}</p>
            <p>Mobile: ${address.mobile || ''}</p>
            <a href="address.html" class="text-blue-600 hover:underline text-sm mt-2 inline-block">Change Address</a>
        `;
         document.getElementById('place-order-btn').disabled = false;
         document.getElementById('place-order-btn').classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('userAuthToken')) {
        window.location.href = '/signin.html';
        return;
    }

    renderCheckoutSummary();

    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const deliveryAddress = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
        if (!deliveryAddress.pincode) {
             showToast('Error: Please add a complete delivery address before placing the order.');
             return;
        }

        const placeOrderBtn = document.getElementById('place-order-btn');
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Placing Order...';

        // 1. Get Cart Items
        const checkoutItems = JSON.parse(localStorage.getItem('checkoutReadyCart')) || [];
        
        // 2. Calculate Subtotal
        const subtotal = checkoutItems.reduce((sum, p) => {
            const itemFinalPrice = p.pricePaid !== undefined ? p.pricePaid : p.price;
            return sum + (itemFinalPrice * p.quantity);
        }, 0);

        // 3. Calculate Exact Shipping (To store in DB)
        const shippingCost = getShippingCost(subtotal, deliveryAddress);

        // 4. Calculate Total
        const totalAmount = subtotal + shippingCost;

        // 5. Prepare Order Object
        const itemsForOrder = checkoutItems.map(item => ({
             name: item.name,
             image: item.image,
             price: item.price, 
             quantity: item.quantity,
             pricePaid: item.pricePaid,
             category: item.category, 
             discount: item.discount, 
             selectedOfferId: item.selectedOfferId 
        }));

        const newOrder = {
            orderId: `NEXUS-${Date.now()}`,
            orderDate: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            items: itemsForOrder,
            shippingCost: shippingCost, // <--- SAVING SHIPPING COST TO MONGODB
            totalAmount: totalAmount,
            shippingAddress: deliveryAddress
        };

        try {
            await placeOrder(newOrder);

            showToast('Order placed successfully! Redirecting...');
            localStorage.removeItem('cartProducts'); 
            localStorage.removeItem('checkoutReadyCart'); 
            setTimeout(() => { window.location.href = '/order.html'; }, 2000);
        } catch (error) {
            showToast(`Error: ${error.message || 'Could not place order.'}`);
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        }
    });
});