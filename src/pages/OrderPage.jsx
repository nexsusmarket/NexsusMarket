// client/src/pages/OrderPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cancelOrder as apiCancelOrder } from '../api/apiService';

export default function OrderPage() {
  const { userData, refreshUserData, showToast, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Please Sign In to View Orders</h2>
          <Link to="/signin" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const allOrders = [...(userData?.orders || [])].sort(
    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
  );

  const now = new Date();
  const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);

  const visibleOrders = allOrders.filter(order => {
    if (order.status !== 'Delivered') return true;
    if (order.actualDeliveryDate) {
      return new Date(order.actualDeliveryDate).getTime() > twentyFourHoursAgo;
    }
    return false;
  });

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      await apiCancelOrder(orderToCancel);
      await refreshUserData();
      showToast('Order cancelled successfully');
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      showToast(err.message || 'Error cancelling order', true);
    } finally {
      setCancelling(false);
    }
  };

  const getTrackingSteps = (order) => {
    const isCancelled = order.status === 'Cancelled';
    const isDelivered = order.status === 'Delivered';
    const isShipped = order.status === 'Shipped' || isDelivered;

    const orderDateStr = new Date(order.orderDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    });
    const estDateStr = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    });

    if (isCancelled) {
      return [
        { title: 'Ordered', desc: 'Order was placed', timeInfo: orderDateStr, active: true, done: true },
        { title: 'Cancelled', desc: 'Order was cancelled', timeInfo: 'Cancelled', active: true, isRed: true }
      ];
    }

    return [
      { title: 'Ordered', desc: 'Order placed & confirmed', timeInfo: orderDateStr, active: true, done: true },
      { title: 'Shipped', desc: isShipped ? 'Package has left courier facility' : 'Preparing dispatch', timeInfo: isShipped ? 'In Transit' : 'Pending', active: isShipped, done: isShipped },
      { title: 'Out for Delivery', desc: isDelivered ? 'Delivered by courier' : 'Expected soon', timeInfo: isDelivered ? 'Completed' : estDateStr, active: isDelivered, done: isDelivered }
    ];
  };

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex items-baseline justify-between mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
        <div className="text-sm text-gray-500">
          <span id="total-orders-count" className="font-bold text-gray-900">
            {visibleOrders.length}
          </span>{' '}
          active orders
        </div>
      </div>

      <div id="orders-container" className="space-y-8 min-h-[50vh]">
        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <i className="fas fa-box-open text-4xl text-gray-400"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">No active orders</h2>
            <p className="text-gray-500 mt-2">Looks like you haven't bought anything recently.</p>
            <Link to="/" className="mt-6 text-indigo-600 font-semibold hover:underline">
              Start Shopping
            </Link>
          </div>
        ) : (
          visibleOrders.map((order) => {
            const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            });
            const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short'
            });

            const addr = order.shippingAddress || {};
            const shipName = addr.name || 'Customer';
            const shipStreet = addr.address || 'Address not available';
            const shipCity = addr.city || '';
            const shipState = addr.state || '';
            const shipPin = addr.pincode || '';
            const shipPhone = addr.mobile || '';

            let statusClass = 'text-orange-600';
            let statusMessage = `Arriving ${deliveryDate}`;
            if (order.status === 'Delivered') {
              statusClass = 'text-green-700';
              statusMessage = `Delivered on ${new Date(order.actualDeliveryDate || order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
            } else if (order.status === 'Cancelled') {
              statusClass = 'text-red-600';
              statusMessage = 'Order Cancelled';
            }

            return (
              <div
                key={order.orderId}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header Strip */}
                <div className="bg-gray-100 px-6 py-4 flex flex-wrap justify-between items-start gap-y-4 text-sm text-gray-600 border-b border-gray-200">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="uppercase text-xs font-bold text-gray-500">Order Placed</span>
                      <span className="text-gray-800">{orderDate}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="uppercase text-xs font-bold text-gray-500">Total</span>
                      <span className="text-gray-800 font-medium">₹{Number(order.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="hidden md:flex flex-col relative group">
                      <span className="uppercase text-xs font-bold text-gray-500">Ship To</span>
                      <span className="text-indigo-600 cursor-pointer flex items-center gap-1 group-hover:underline">
                        {shipName} <i className="fas fa-chevron-down text-xs"></i>
                      </span>
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-md p-3 hidden group-hover:block z-10 text-xs text-gray-700">
                        <p className="font-bold mb-1">{shipName}</p>
                        <p>{shipStreet}</p>
                        <p>{shipCity}, {shipState} {shipPin}</p>
                        <p className="mt-1">Phone: {shipPhone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="uppercase text-xs font-bold text-gray-500">Order # {order.orderId}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                      <h3 className={`text-lg font-bold ${statusClass} mb-4`}>{statusMessage}</h3>
                      <div className="mt-4">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex gap-4 mb-6 last:mb-0">
                            <div className="flex-shrink-0 w-24 h-24 bg-gray-50 border border-gray-200 rounded-md p-1 flex items-center justify-center">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain cursor-pointer"
                                onClick={() => navigate(`/detail.html?name=${encodeURIComponent(item.name)}`)}
                              />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 hover:text-indigo-600 cursor-pointer">
                                <Link to={`/detail.html?name=${encodeURIComponent(item.name)}`}>
                                  {item.name}
                                </Link>
                              </h4>
                              <div className="text-xs text-gray-500 mt-1">
                                Category: {item.category || 'General'}
                              </div>
                              <div className="mt-2 text-sm font-medium text-gray-900">
                                ₹{item.price}{' '}
                                <span className="text-gray-500 text-xs font-normal">x {item.quantity}</span>
                              </div>

                              <div className="mt-3 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/detail.html?name=${encodeURIComponent(item.name)}`)}
                                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm"
                                >
                                  Buy it again
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-6 lg:pt-0 space-y-6">
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Delivery Address</h4>
                        <div className="text-sm text-gray-800 leading-relaxed">
                          <p className="font-bold">{shipName}</p>
                          <p>{shipStreet}</p>
                          <p>{shipCity}, {shipState}</p>
                          <p className="font-medium">{shipPin}</p>
                          <p className="mt-2 text-xs text-gray-500">Phone: {shipPhone}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingOrder(order);
                              setTrackingModalOpen(true);
                            }}
                            className="track-package-btn w-full text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-yellow-500 font-medium py-2 rounded-md shadow-sm transition"
                          >
                            Track Package
                          </button>
                        )}

                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToCancel(order.orderId);
                              setCancelModalOpen(true);
                            }}
                            className="cancel-order-btn w-full text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-md shadow-sm transition mt-2"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancel Confirm Modal */}
      {cancelModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Cancel this order?</h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-4 text-base">Are you sure you want to cancel?</p>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 text-sm"></i>
                <span className="text-sm text-red-600 font-medium">Warning: This action cannot be undone.</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition shadow-sm"
              >
                Don't Cancel
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow-md shadow-red-200"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModalOpen && trackingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => setTrackingModalOpen(false)}
          ></div>
          <div className="liquid-glass-modal w-full max-w-2xl relative p-8 transform transition-all scale-100 opacity-100 overflow-hidden bg-white/95">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Track Package</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Order ID: <span className="font-mono text-indigo-600">{trackingOrder.orderId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-600 transition shadow-sm"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="relative z-10 pl-4 py-2">
              <div className="space-y-8">
                {getTrackingSteps(trackingOrder).map((step, idx) => (
                  <div key={idx} className="relative flex gap-6 pb-2">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                          step.isRed
                            ? 'bg-red-500 text-white'
                            : step.active
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <i className={`fas ${step.active ? 'fa-check' : 'fa-circle text-[8px]'}`}></i>
                      </div>
                    </div>
                    <div className="liquid-node flex-grow p-4 rounded-xl border border-white/50 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{step.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {step.timeInfo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
