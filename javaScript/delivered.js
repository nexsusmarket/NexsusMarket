import { fetchUserData, addToCart } from './apiService.js';

// --- API FUNCTIONS (Keep existing) ---
async function requestReturnOtp(itemId, reason) {
    const response = await fetch('http://localhost:3000/api/user/returns/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-phone': localStorage.getItem('userAuthToken') },
        body: JSON.stringify({ itemId, reason })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request OTP.');
    }
    return response.json();
}

async function finalizeReturn(itemId, otp) {
    const response = await fetch('http://localhost:3000/api/user/returns/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-phone': localStorage.getItem('userAuthToken') },
        body: JSON.stringify({ itemId, otp })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to finalize return.');
    }
    return response.json();
}

async function fetchOrderDetails(orderId) {
    const response = await fetch(`http://localhost:3000/api/user/order/${orderId}`, {
        headers: { 'x-phone': localStorage.getItem('userAuthToken') }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch order details.');
    }
    return response.json();
}

async function submitReview(reviewData) {
    const response = await fetch('http://localhost:3000/api/user/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-phone': localStorage.getItem('userAuthToken') },
        body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review.');
    }
    return response.json();
}

// --- HELPER FUNCTIONS ---
const groupItemsByMonth = (items) => {
    return items.reduce((groups, item) => {
        const date = new Date(item.deliveryDate);
        const monthYear = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(item);
        return groups;
    }, {});
};

function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast-visible';
    toast.style.backgroundColor = isError ? '#EF4444' : '#10B981';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '1000';
    
    setTimeout(() => {
        toast.className = 'toast-hidden';
        toast.textContent = '';
    }, 3000);
}

// --- NUMBER TO WORDS CONVERTER (Indian System) ---
function convertNumberToWords(amount) {
    const words = new Array();
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';

    amount = amount.toString();
    const atemp = amount.split(".");
    let number = atemp[0].split(",").join("");
    let n_length = number.length;
    let words_string = "";
    
    if (n_length <= 9) {
        const n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
        const received_n_array = new Array();
        for (let i = 0; i < n_length; i++) {
            received_n_array[i] = number.substr(i, 1);
        }
        for (let i = 9 - n_length, j = 0; i < 9; i++, j++) {
            n_array[i] = received_n_array[j];
        }
        for (let i = 0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                if (n_array[i] == 1) {
                    n_array[i + 1] = 10 + parseInt(n_array[i + 1]);
                    n_array[i] = 0;
                }
            }
        }
        let value = "";
        for (let i = 0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                value = n_array[i] * 10;
            } else {
                value = n_array[i];
            }
            if (value != 0) {
                words_string += words[value] + " ";
            }
            if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Crores ";
            }
            if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Lakhs ";
            }
            if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                words_string += "Thousand ";
            }
            if (i == 6 && value != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                words_string += "Hundred and ";
            } else if (i == 6 && value != 0) {
                words_string += "Hundred ";
            }
        }
        words_string = words_string.split("  ").join(" ");
    }
    return words_string + "Rupees Only";
}

function createStarRatingHTML(label, ratingKey) {
    return `
        <div class="rating-group bg-gray-50 p-3 rounded-lg border border-gray-100" data-rating-key="${ratingKey}" data-rating-value="0">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-2">${label}</label>
            <div class="flex space-x-2 text-2xl text-gray-300 cursor-pointer review-stars">
                <i class="far fa-star transition hover:scale-110" data-value="1"></i>
                <i class="far fa-star transition hover:scale-110" data-value="2"></i>
                <i class="far fa-star transition hover:scale-110" data-value="3"></i>
                <i class="far fa-star transition hover:scale-110" data-value="4"></i>
                <i class="far fa-star transition hover:scale-110" data-value="5"></i>
            </div>
        </div>
    `;
}

function buildReviewModal(category) {
    const container = document.getElementById('review-ratings-container');
    let html = createStarRatingHTML('Overall Rating', 'overallRating');

    switch (category) {
        case 'Mobiles':
            html += createStarRatingHTML('Display', 'display');
            html += createStarRatingHTML('Performance', 'performance');
            html += createStarRatingHTML('Battery', 'battery');
            html += createStarRatingHTML('Camera', 'camera');
            break;
        case 'Laptops':
            html += createStarRatingHTML('Display', 'display');
            html += createStarRatingHTML('Performance', 'performance');
            html += createStarRatingHTML('Battery', 'battery');
            html += createStarRatingHTML('Design', 'design');
            break;
    }
    container.innerHTML = html;
}

// --- INVOICE GENERATOR ---
function generateInvoice(order) {
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const addr = order.shippingAddress;
    
    // 1. Get Delivered Date
    let deliveredDateLine = '';
    if (order.status === 'Delivered' && order.actualDeliveryDate) {
        const dDate = new Date(order.actualDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        deliveredDateLine = `Delivered Date: ${dDate}<br>`;
    }

    // 2. Calculate Costs
    const subtotal = order.items.reduce((acc, item) => acc + ((item.pricePaid || item.price) * item.quantity), 0);
    const grandTotal = order.totalAmount;
    
    // 3. Shipping Cost Logic
    let shippingAmount = 0;
    if (order.shippingCost !== undefined) {
        shippingAmount = order.shippingCost;
    } else {
        shippingAmount = Math.max(0, grandTotal - subtotal);
    }
    
    const shippingDisplay = shippingAmount > 0 ? `₹${shippingAmount.toFixed(2)}` : 'Free';

    // 4. Generate Amount in Words
    const amountInWords = convertNumberToWords(Math.round(grandTotal));

    const invoiceContent = `
    <html>
    <head>
        <title>Invoice - ${order.orderId}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; background: white; -webkit-print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; display: flex; align-items: center; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { margin: 0; font-size: 32px; font-weight: 700; color: #111; letter-spacing: -0.5px; }
            .invoice-meta { margin-top: 10px; font-size: 13px; color: #6b7280; line-height: 1.6; }
            
            .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
            .addr-box { flex: 1; }
            .addr-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; letter-spacing: 0.5px; }
            .addr-text { font-size: 14px; line-height: 1.6; color: #374151; }
            .addr-text strong { color: #111; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; padding: 12px 8px; background-color: #f9fafb; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
            td { padding: 16px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
            .amount-words-box { flex: 1; padding-right: 40px; }
            .amount-words-box p { font-size: 11px; color: #9ca3af; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
            .amount-words-box h4 { font-size: 14px; color: #374151; margin: 8px 0 0 0; line-height: 1.5; font-style: italic; }
            
            .totals-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #4b5563; }
            .grand-total { font-weight: 700; font-size: 18px; color: #111; border-top: 2px solid #111; margin-top: 10px; padding-top: 10px; }
            
            .footer { margin-top: 80px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">NexusMarket</div>
            <div class="invoice-title">
                <h1>Tax Invoice</h1>
                <div class="invoice-meta">
                    Invoice #: INV-${order.orderId.substring(0, 8).toUpperCase()}<br>
                    Order Date: ${orderDate}<br>
                    ${deliveredDateLine}
                    Invoice Date: ${invoiceDate}
                </div>
            </div>
        </div>

        <div class="addresses">
            <div class="addr-box">
                <h3>Sold By</h3>
                <div class="addr-text">
                    <strong>NexusMarket Retail Pvt Ltd.</strong><br>
                    Building 12, Cyber City<br>
                    Hyderabad, Telangana 500081<br>
                    GSTIN: 36AAACN1234F1Z5
                </div>
            </div>
            <div class="addr-box">
                <h3>Bill To / Ship To</h3>
                <div class="addr-text">
                    <strong>${addr.name}</strong><br>
                    ${addr.address}<br>
                    ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                    Phone: ${addr.mobile}
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 55%">Product Description</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map((item, index) => `
                <tr>
                    <td style="color: #9ca3af;">${index + 1}</td>
                    <td>
                        <strong>${item.name}</strong><br>
                        <span style="font-size: 12px; color: #9ca3af;">Category: ${item.category || 'General'}</span>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₹${(item.pricePaid || item.price).toFixed(2)}</td>
                    <td class="text-right font-bold">₹${((item.pricePaid || item.price) * item.quantity).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="amount-words-box">
                <p>Amount in Words</p>
                <h4>${amountInWords}</h4>
            </div>
            <div class="totals-box">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Shipping Charges</span>
                    <span>${shippingDisplay}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Grand Total</span>
                    <span>₹${grandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>Need help? Contact nexsusmarketshop@gmail.com</p>
        </div>

        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
}

// --- POPULATE ORDER MODAL ---
const populateOrderModal = (order) => {
    document.getElementById('current-order-data').dataset.order = JSON.stringify(order);
    
    document.getElementById('modal-order-id').textContent = order.orderId;
    document.getElementById('modal-order-date').textContent = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const statusEl = document.getElementById('modal-order-status');
    if (order.status === 'Delivered' && order.actualDeliveryDate) {
        const dDate = new Date(order.actualDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        // Use text-sm to match other fields exactly
        statusEl.innerHTML = `<span class="text-green-600 font-semibold">Delivered</span> <span class="text-xs text-gray-500 font-normal block mt-1">on ${dDate}</span>`;
    } else {
        statusEl.textContent = order.status;
        statusEl.className = `font-semibold ${order.status === 'Delivered' ? 'text-green-600' : 'text-gray-900'}`;
    }

    const addr = order.shippingAddress;
    document.getElementById('modal-shipping-address').innerHTML = `
        <strong class="text-gray-900 block mb-1">${addr.name}</strong>
        <span class="block text-gray-600">${addr.address}, ${addr.city}</span>
        <span class="block text-gray-600">${addr.state} - ${addr.pincode}</span>
        <span class="block mt-2 font-medium text-gray-800">Phone: ${addr.mobile}</span>
    `;

    document.getElementById('modal-item-list').innerHTML = order.items.map(item => `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
            <div class="col-span-6 flex items-center gap-4">
                <div class="w-14 h-14 bg-gray-50 rounded border border-gray-100 flex items-center justify-center p-1">
                    <img src="${item.image}" class="max-w-full max-h-full object-contain">
                </div>
                <div>
                    <p class="font-bold text-gray-800 text-sm line-clamp-1">${item.name}</p>
                    <p class="text-xs text-gray-500 md:hidden mt-1">Qty: ${item.quantity}</p>
                </div>
            </div>
            <div class="col-span-2 text-center hidden md:block text-sm text-gray-600">₹${(item.pricePaid || item.price).toFixed(2)}</div>
            <div class="col-span-2 text-center hidden md:block text-sm font-medium">${item.quantity}</div>
            <div class="col-span-2 text-right text-sm font-bold text-gray-900">₹${((item.pricePaid || item.price) * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    const subtotal = order.items.reduce((acc, item) => acc + ((item.pricePaid || item.price) * item.quantity), 0);
    const grandTotal = order.totalAmount;
    
    // --- SHIPPING CALCULATION FOR MODAL ---
    let shippingAmount = 0;
    if (order.shippingCost !== undefined) {
        shippingAmount = order.shippingCost;
    } else {
        shippingAmount = Math.max(0, grandTotal - subtotal);
    }
    const shippingText = shippingAmount > 0 ? `₹${shippingAmount.toFixed(2)}` : 'Free';

    document.getElementById('modal-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    
    // Update Modal Shipping safely
    const shippingEl = document.getElementById('modal-shipping-cost');
    if (shippingEl) {
        shippingEl.textContent = shippingText;
        shippingEl.className = shippingAmount > 0 ? 'text-gray-900 font-medium' : 'text-green-600 font-medium';
    }
    
    document.getElementById('modal-total-amount').textContent = `₹${grandTotal.toFixed(2)}`;
};

// --- MAIN LISTENER ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('userAuthToken')) {
        window.location.href = '/signin.html';
        return;
    }

    const container = document.getElementById('delivered-items-container');
    const searchInput = document.getElementById('search-delivered-input');
    
    // Modals
    const returnModal = document.getElementById('return-reason-modal');
    const cancelReturnBtn = document.getElementById('cancel-return-btn');
    const submitReturnBtn = document.getElementById('submit-return-btn');
    const returnTextarea = document.getElementById('return-reason-textarea');
    
    const otpModal = document.getElementById('otp-verify-modal');
    const otpInput = document.getElementById('otp-input');
    const cancelOtpBtn = document.getElementById('cancel-otp-btn');
    const submitOtpBtn = document.getElementById('submit-otp-btn');
    
    const orderDetailsModal = document.getElementById('order-details-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal-btn');
    const orderModalLoader = document.getElementById('order-modal-loader');
    const orderModalContent = document.getElementById('order-modal-content');

    const reviewModal = document.getElementById('review-modal');
    const closeReviewModalBtn = document.getElementById('close-review-modal-btn');
    const cancelReviewBtn = document.getElementById('cancel-review-btn');
    const submitReviewBtn = document.getElementById('submit-review-btn');
    const reviewProductName = document.getElementById('review-product-name');
    const reviewRatingsContainer = document.getElementById('review-ratings-container');
    const reviewTextArea = document.getElementById('review-text-area');

    let allDeliveredItems = [];
    let currentReturnData = { itemId: null, reason: null };
    let currentReviewData = { itemId: null, category: null, productName: null };

    // Render Page
    const renderPage = (itemsToRender) => {
        if (itemsToRender.length === 0) {
            container.innerHTML = `
                <div class="text-center p-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <i class="fas fa-box-open text-6xl text-gray-200 mb-6 block"></i>
                    <h2 class="text-2xl font-bold text-gray-700">No Delivered Items Yet</h2>
                    <p class="text-gray-500 mt-2 mb-8">When you buy something, your delivered items will show up here.</p>
                    <a href="index.html" class="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-bold transition shadow-lg shadow-purple-200">Start Shopping</a>
                </div>`;
            return;
        }

        const groupedItems = groupItemsByMonth(itemsToRender);
        container.innerHTML = Object.entries(groupedItems).map(([monthYear, items]) => `
            <section class="animate-fadeIn">
                <div class="flex items-center gap-4 mb-6">
                    <h2 class="text-xl font-bold text-gray-700">${monthYear}</h2>
                    <div class="h-px bg-gray-200 flex-1"></div>
                </div>
                <div class="space-y-6">
                    ${items.map(item => {
                        const formattedDate = new Date(item.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        const today = new Date();
                        const deliveryDate = new Date(item.deliveryDate);
                        const daysDifference = Math.floor((today - deliveryDate) / (1000 * 3600 * 24));
                        
                        let returnButtonHtml = '';
                        if (daysDifference <= 4) {
                            returnButtonHtml = `<button class="return-btn text-sm text-red-600 hover:text-red-700 hover:underline font-medium" data-item-id="${item._id}">Return Item</button>`;
                        }

                        let reviewButtonHtml = '';
                        if (item.category && item.category !== 'Grocery') {
                            if (item.reviewed) {
                                reviewButtonHtml = `<button class="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-semibold text-sm cursor-default" disabled><i class="fas fa-check-circle mr-2"></i>Reviewed</button>`;
                            } else {
                                reviewButtonHtml = `<button class="write-review-btn bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition" data-item-id="${item._id}" data-product-name="${item.name}" data-category="${item.category}"><i class="far fa-star mr-2 text-yellow-500"></i>Rate Product</button>`;
                            }
                        }

                        return `
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 transition hover:shadow-md">
                            <div class="relative w-28 h-28 bg-gray-50 rounded-lg flex items-center justify-center p-2 flex-shrink-0 border border-gray-100">
                                <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full object-contain mix-blend-multiply">
                            </div>
                            <div class="flex-1 flex flex-col justify-between">
                                <div>
                                    <div class="flex justify-between items-start">
                                        <p class="font-bold text-lg text-gray-900 line-clamp-2">${item.name}</p>
                                    </div>
                                    <p class="text-sm text-green-700 font-semibold mt-2 flex items-center"><i class="fas fa-check-circle mr-2"></i>Delivered on ${formattedDate}</p>
                                </div>
                                <div class="mt-4 flex flex-wrap gap-3 items-center">
                                    <button class="buy-again-btn bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-medium text-sm transition shadow-sm" data-product-name="${encodeURIComponent(item.name)}"><i class="fas fa-redo-alt mr-2"></i>Buy Again</button>
                                    ${reviewButtonHtml}
                                    <button class="view-order-btn bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition" data-order-id="${item.orderId || ''}">View Invoice</button>
                                </div>
                            </div>
                            <div class="flex flex-col justify-between items-end gap-2 border-t sm:border-t-0 sm:border-l sm:pl-6 pt-4 sm:pt-0 border-gray-100 min-w-[120px]">
                                ${returnButtonHtml}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </section>
        `).join('');
    };

    // Load Data
    const loadPageData = async () => {
        try {
            const userData = await fetchUserData();
            allDeliveredItems = (userData.deliveredItems || []).sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));
            renderPage(allDeliveredItems);
        } catch (error) {
            console.error("Failed to load delivered items:", error);
            container.innerHTML = `<p class="text-center text-red-500 py-10">Could not load items.</p>`;
        }
    };

    await loadPageData();
    
    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = allDeliveredItems.filter(item => item.name.toLowerCase().includes(searchTerm));
        renderPage(filteredItems);
    });

    container.addEventListener('click', async (event) => {
        const target = event.target;
        
        if (target.closest('.return-btn')) {
            const itemId = target.closest('.return-btn').dataset.itemId;
            currentReturnData.itemId = itemId;
            returnTextarea.value = "";
            returnModal.classList.remove('hidden');
        }
        
        if (target.closest('.write-review-btn')) {
            const button = target.closest('.write-review-btn');
            currentReviewData.itemId = button.dataset.itemId;
            currentReviewData.category = button.dataset.category;
            currentReviewData.productName = button.dataset.productName;
            reviewProductName.textContent = currentReviewData.productName;
            buildReviewModal(currentReviewData.category);
            reviewTextArea.value = '';
            reviewModal.classList.remove('hidden');
        }

        // --- UPDATED BUY AGAIN LOGIC ---
        if (target.closest('.buy-again-btn')) {
            const button = target.closest('.buy-again-btn');
            const productName = decodeURIComponent(button.dataset.productName);
            // Redirect to detail page
            window.location.href = `detail.html?name=${encodeURIComponent(productName)}`;
        }
        // --------------------------------
        
        if (target.closest('.view-order-btn')) {
            const orderId = target.closest('.view-order-btn').dataset.orderId;
            if (!orderId) { showToast("Order details missing.", true); return; }

            orderDetailsModal.classList.remove('hidden');
            orderModalLoader.style.display = 'block';
            orderModalContent.style.display = 'none';

            try {
                const order = await fetchOrderDetails(orderId);
                populateOrderModal(order);
                orderModalLoader.style.display = 'none';
                orderModalContent.style.display = 'block';
            } catch (error) {
                showToast(`Error: ${error.message}`, true);
                orderDetailsModal.classList.add('hidden');
            }
        }
    });

    // Modal Action Listeners
    cancelReturnBtn.addEventListener('click', () => returnModal.classList.add('hidden'));
    submitReturnBtn.addEventListener('click', async () => {
        const reason = returnTextarea.value.trim();
        if (!reason) { showToast("Please provide a reason.", true); return; }
        currentReturnData.reason = reason;
        try {
            await requestReturnOtp(currentReturnData.itemId, currentReturnData.reason);
            showToast("OTP sent to email.");
            returnModal.classList.add('hidden');
            otpInput.value = "";
            otpModal.classList.remove('hidden');
        } catch (error) { showToast(error.message, true); }
    });

    cancelOtpBtn.addEventListener('click', () => otpModal.classList.add('hidden'));
    submitOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        if (otp.length !== 6) { showToast("Enter 6-digit OTP.", true); return; }
        try {
            await finalizeReturn(currentReturnData.itemId, otp);
            showToast("Return successful!");
            otpModal.classList.add('hidden');
            await loadPageData(); 
        } catch (error) { showToast(error.message, true); }
    });

    closeOrderModalBtn.addEventListener('click', () => orderDetailsModal.classList.add('hidden'));
    
    document.getElementById('download-invoice-btn').addEventListener('click', () => {
        const orderData = document.getElementById('current-order-data').dataset.order;
        if (orderData) {
            generateInvoice(JSON.parse(orderData));
        } else {
            showToast("Order data missing.", true);
        }
    });

    closeReviewModalBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));
    cancelReviewBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));
    
    reviewRatingsContainer.addEventListener('click', (e) => {
        const star = e.target.closest('.review-stars i');
        if (!star) return;
        const value = parseInt(star.dataset.value, 10);
        const ratingGroup = star.closest('.rating-group');
        ratingGroup.dataset.ratingValue = value;
        ratingGroup.querySelectorAll('i').forEach(s => {
            s.className = parseInt(s.dataset.value, 10) <= value ? 'fas fa-star text-yellow-400 transition hover:scale-110' : 'far fa-star text-gray-300 transition hover:scale-110';
        });
    });

    submitReviewBtn.addEventListener('click', async () => {
        const reviewText = reviewTextArea.value.trim();
        const ratingGroups = reviewRatingsContainer.querySelectorAll('.rating-group');
        let overallRating = 0;
        const subRatings = {};
        let allValid = true;

        ratingGroups.forEach(group => {
            const key = group.dataset.ratingKey;
            const value = parseInt(group.dataset.ratingValue, 10);
            if (value === 0) allValid = false;
            if (key === 'overallRating') overallRating = value;
            else subRatings[key] = value;
        });

        if (!allValid) { showToast('Please rate all fields.', true); return; }
        if (!reviewText) { showToast('Please write a comment.', true); return; }

        try {
            submitReviewBtn.disabled = true;
            submitReviewBtn.textContent = 'Submitting...';
            await submitReview({ itemId: currentReviewData.itemId, productName: currentReviewData.productName, category: currentReviewData.category, overallRating, reviewText, subRatings });
            showToast('Review submitted!');
            reviewModal.classList.add('hidden');
            await loadPageData();
        } catch (error) {
            showToast(error.message, true);
        } finally {
            submitReviewBtn.disabled = false;
            submitReviewBtn.textContent = 'Submit Review';
        }
    });
});