import { fetchUserData, cancelOrder } from './apiService.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('userAuthToken')) {
        document.getElementById('orders-container').innerHTML = `
            <div class="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
                <h2 class="text-2xl font-bold text-gray-700">Sign in to track your orders</h2>
                <p class="text-gray-500 mt-2 mb-6">View past orders, track shipments, and download invoices.</p>
                <a href="./signin.html" class="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-indigo-700 transition">Sign In</a>
            </div>`;
        return;
    }
    
    const ordersContainer = document.getElementById('orders-container');
    const trackingModal = document.getElementById('tracking-modal');
    const closeTrackingBtn = document.getElementById('close-tracking-btn');
    const trackingBackdrop = document.getElementById('tracking-backdrop');
    
    // --- Cancel Modal Logic ---
    const cancelModal = document.getElementById('cancel-confirm-modal');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const denyCancelBtn = document.getElementById('deny-cancel-btn');
    let orderIdToCancel = null;

    const showCancelModal = (orderId) => {
        orderIdToCancel = orderId;
        cancelModal.classList.remove('hidden');
    };
    
    const hideCancelModal = () => {
        orderIdToCancel = null;
        cancelModal.classList.add('hidden');
    };

    denyCancelBtn.addEventListener('click', hideCancelModal);

    confirmCancelBtn.addEventListener('click', async () => {
        if (orderIdToCancel) {
            const originalText = confirmCancelBtn.innerText;
            confirmCancelBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cancelling...`;
            confirmCancelBtn.disabled = true;
            try {
                await cancelOrder(orderIdToCancel);
                hideCancelModal();
                await refreshAndRenderOrders();
            } catch (error) {
                alert("Failed to cancel order");
            } finally {
                confirmCancelBtn.innerText = "Yes, Cancel Order";
                confirmCancelBtn.disabled = false;
            }
        }
    });

    cancelModal.addEventListener('click', (e) => {
        if(e.target === cancelModal) hideCancelModal();
    });

    // --- Tracking Modal Logic ---
    const showTrackingModal = (order) => {
        const container = document.getElementById('tracking-timeline-container');
        document.getElementById('track-order-id').innerText = `#${order.orderId}`;
        
        const city = order.shippingAddress.city || "Destination City";
        const status = order.status;
        
        const formatDT = (dateString) => {
            const d = new Date(dateString);
            const date = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            return { date, time };
        };

        const d_ordered = formatDT(order.orderDate);
        const d_shipped = formatDT(order.shippedDate);
        const d_out = formatDT(order.outForDeliveryDate);
        
        const isDelivered = status === 'Delivered';
        const d_final = isDelivered 
            ? formatDT(order.actualDeliveryDate) 
            : formatDT(order.estimatedDelivery);

        const statusMap = { 'Ordered': 0, 'Processing': 0, 'Shipped': 1, 'Out for Delivery': 2, 'Delivered': 3 };
        const currentIdx = statusMap[status] || 0;

        const steps = [
            {
                title: "Order Placed",
                desc: "Order placed successfully",
                timeInfo: `${d_ordered.date}, ${d_ordered.time}`,
                active: currentIdx >= 0
            },
            {
                title: "Shipped",
                desc: "Package shipped from <strong>Hyderabad</strong> facility",
                timeInfo: currentIdx >= 1 ? `${d_shipped.date}, ${d_shipped.time}` : "Pending",
                active: currentIdx >= 1
            },
            {
                title: "Out for Delivery",
                desc: `Arrived at <strong>${city}</strong> hub & out for delivery`,
                timeInfo: currentIdx >= 2 ? `${d_out.date}, ${d_out.time}` : "Pending",
                active: currentIdx >= 2
            },
            {
                title: isDelivered ? "Delivered" : "Arriving By",
                desc: isDelivered ? "Package delivered to customer" : `Expected delivery by ${d_final.date}`,
                timeInfo: isDelivered ? `${d_final.date}, ${d_final.time}` : "",
                active: currentIdx >= 3
            }
        ];

        container.innerHTML = steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const icon = step.active ? 'fa-check' : 'fa-circle';
            const iconColor = step.active ? 'text-white bg-green-500 shadow-lg shadow-green-200' : 'text-gray-300 bg-white border-2 border-gray-200';
            const textColor = step.active ? 'text-gray-900' : 'text-gray-400';
            const lineClass = (step.active && !isLast && steps[index+1].active) ? 'bg-green-500' : 'bg-gray-200';
            
            const lineHTML = !isLast 
                ? `<div class="absolute left-[19px] top-10 w-[2px] h-full ${lineClass} -z-10 transition-colors duration-500"></div>` 
                : '';

            return `
            <div class="relative flex gap-6 pb-2">
                ${lineHTML}
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${iconColor} transition-all duration-300 relative z-10">
                        <i class="fas ${step.active ? 'fa-check' : 'fa-circle text-[8px]'}"></i>
                    </div>
                </div>
                <div class="liquid-node flex-grow p-4 rounded-xl border border-white/50 mb-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-lg ${textColor}">${step.title}</h4>
                            <p class="text-sm text-gray-600 mt-1">${step.desc}</p>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">${step.timeInfo}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        trackingModal.classList.remove('hidden');
    };

    const hideTrackingModal = () => {
        trackingModal.classList.add('hidden');
    };

    closeTrackingBtn.addEventListener('click', hideTrackingModal);
    trackingBackdrop.addEventListener('click', hideTrackingModal);

    // --- Main Render Logic ---
    const refreshAndRenderOrders = async () => {
        ordersContainer.innerHTML = '<div class="text-center py-20"><i class="fas fa-spinner fa-spin text-4xl text-gray-300"></i></div>';
        
        try {
            const userData = await fetchUserData();
            const allOrders = userData.orders || [];
            
            allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            const now = new Date();
            const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);

            const visibleOrders = allOrders.filter(order => {
                if (order.status !== 'Delivered') return true;
                if (order.actualDeliveryDate) {
                    return new Date(order.actualDeliveryDate).getTime() > twentyFourHoursAgo;
                }
                return false; 
            });

            // Count Active Orders Only
            const totalCountEl = document.getElementById('total-orders-count');
            if(totalCountEl) totalCountEl.innerText = visibleOrders.length;

            if (visibleOrders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-lg">
                        <div class="bg-gray-100 p-4 rounded-full mb-4">
                            <i class="fas fa-box-open text-4xl text-gray-400"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-800">No active orders</h2>
                        <p class="text-gray-500 mt-2">Looks like you haven't bought anything recently.</p>
                        <a href="./index.html" class="mt-6 text-indigo-600 font-semibold hover:underline">Start Shopping</a>
                    </div>`;
            } else {
                ordersContainer.innerHTML = visibleOrders.map(order => generateProfessionalOrderCard(order)).join('');
                
                document.querySelectorAll('.track-package-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const orderId = e.target.closest('button').dataset.orderId;
                        const orderData = allOrders.find(o => o.orderId === orderId);
                        if (orderData) showTrackingModal(orderData);
                    });
                });
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            ordersContainer.innerHTML = `<p class="text-center text-red-500 bg-red-50 p-4 rounded">Could not load your orders. Please try again.</p>`;
        }
    };
    
    ordersContainer.addEventListener('click', (event) => {
        const cancelButton = event.target.closest('.cancel-order-btn');
        if (cancelButton) {
            const orderId = cancelButton.dataset.orderId;
            showCancelModal(orderId);
        }
    });

    await refreshAndRenderOrders();
});

function generateProfessionalOrderCard(order) {
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    
    const addr = order.shippingAddress || {};
    const shipName = addr.name || "Customer";
    const shipStreet = addr.address || "Address not available";
    const shipCity = addr.city || "";
    const shipState = addr.state || "";
    const shipPin = addr.pincode || "";
    const shipPhone = addr.mobile || "";

    let statusClass = "text-orange-600";
    let statusMessage = `Arriving ${deliveryDate}`;
    if (order.status === 'Delivered') {
        statusClass = "text-green-700";
        statusMessage = `Delivered on ${new Date(order.actualDeliveryDate || order.estimatedDelivery).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}`;
    } else if (order.status === 'Cancelled') {
        statusClass = "text-red-600";
        statusMessage = "Order Cancelled";
    }

    const itemsHTML = order.items.map(item => `
        <div class="flex gap-4 mb-6 last:mb-0">
            <div class="flex-shrink-0 w-24 h-24 bg-gray-50 border border-gray-200 rounded-md p-1 flex items-center justify-center">
                <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full object-contain cursor-pointer" onclick="window.location.href='./detail.html?name=${encodeURIComponent(item.name)}'">
            </div>
            <div class="flex-grow">
                <h4 class="font-bold text-gray-800 text-sm md:text-base line-clamp-2 hover:text-indigo-600 cursor-pointer">
                    <a href="./detail.html?name=${encodeURIComponent(item.name)}">${item.name}</a>
                </h4>
                <div class="text-xs text-gray-500 mt-1">Category: ${item.category || 'General'}</div>
                <div class="mt-2 text-sm font-medium text-gray-900">₹${item.price} <span class="text-gray-500 text-xs font-normal">x ${item.quantity}</span></div>
                
                <div class="mt-3 flex gap-3">
                    <button class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm" onclick="event.stopPropagation(); window.location.href='./detail.html?name=${encodeURIComponent(item.name)}'">
                        Buy it again
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const cancelButtonHTML = (order.status !== 'Delivered' && order.status !== 'Cancelled') ? 
        `<button class="cancel-order-btn w-full text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-md shadow-sm transition mt-2" data-order-id="${order.orderId}">
            Cancel Order
        </button>` : '';

    return `
        <div class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            
            <div class="bg-gray-100 px-6 py-4 flex flex-wrap justify-between items-start gap-y-4 text-sm text-gray-600 border-b border-gray-200">
                <div class="flex gap-8">
                    <div class="flex flex-col">
                        <span class="uppercase text-xs font-bold text-gray-500">Order Placed</span>
                        <span class="text-gray-800">${orderDate}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="uppercase text-xs font-bold text-gray-500">Total</span>
                        <span class="text-gray-800 font-medium">₹${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="hidden md:flex flex-col relative group">
                        <span class="uppercase text-xs font-bold text-gray-500">Ship To</span>
                        <span class="text-indigo-600 cursor-pointer flex items-center gap-1 group-hover:underline">
                            ${shipName} <i class="fas fa-chevron-down text-xs"></i>
                        </span>
                        <div class="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-md p-3 hidden group-hover:block z-10 text-xs text-gray-700">
                            <p class="font-bold mb-1">${shipName}</p>
                            <p>${shipStreet}</p>
                            <p>${shipCity}, ${shipState} ${shipPin}</p>
                            <p class="mt-1">Phone: ${shipPhone}</p>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="uppercase text-xs font-bold text-gray-500">Order # ${order.orderId}</span>
                </div>
            </div>

            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    <div class="lg:col-span-3">
                        <h3 class="text-lg font-bold ${statusClass} mb-4">${statusMessage}</h3>
                        <div class="mt-4">
                            ${itemsHTML}
                        </div>
                    </div>

                    <div class="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-6 lg:pt-0 space-y-6">
                        
                        <div class="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Delivery Address</h4>
                            <div class="text-sm text-gray-800 leading-relaxed">
                                <p class="font-bold">${shipName}</p>
                                <p>${shipStreet}</p>
                                <p>${shipCity}, ${shipState}</p>
                                <p class="font-medium">${shipPin}</p>
                                <p class="mt-2 text-xs text-gray-500">Phone: ${shipPhone}</p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            ${order.status !== 'Cancelled' ? 
                            `<button class="track-package-btn w-full text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-yellow-500 font-medium py-2 rounded-md shadow-sm transition" data-order-id="${order.orderId}">
                                Track Package
                            </button>` : ''}
                            ${cancelButtonHTML}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}