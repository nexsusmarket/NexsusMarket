// client/src/pages/OrderPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cancelOrder as apiCancelOrder } from '../api/apiService';

export default function OrderPage() {
  const { userData, refreshUserData, isLoggedIn, showToast } = useAuth();
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [trackingModal, setTrackingModal] = useState({ open: false, order: null });
  const [cancelling, setCancelling] = useState(false);

  const orders = userData?.orders || [];

  const handleCancelConfirm = async () => {
    if (!cancelModal.orderId) return;
    setCancelling(true);
    try {
      await apiCancelOrder(cancelModal.orderId);
      await refreshUserData();
      showToast('Order cancelled successfully.');
      setCancelModal({ open: false, orderId: null });
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', true);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Out for Delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          <i className="fas fa-box-open"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Orders</h2>
        <p className="text-gray-500 mb-6">Sign in to view your active and past orders with live tracking.</p>
        <Link to="/signin" className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full shadow transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <i className="fas fa-boxes text-indigo-600"></i>
            Your Orders
          </h1>
          <p className="text-xs text-gray-500 mt-1">Manage and track your recent purchases</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
        </span>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="fas fa-box"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No orders placed yet</h2>
          <p className="text-gray-500 text-sm mb-6">Discover products you'll love and place your first order!</p>
          <Link
            to="/explore"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex flex-wrap gap-6 text-gray-600">
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-medium">Order Placed</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-medium">Total Amount</span>
                    <span className="font-bold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase font-medium">Ship To</span>
                    <span className="font-semibold text-gray-900 truncate max-w-[150px] block">
                      {order.shippingAddress?.name || userData?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-gray-400 font-mono text-xs">#{order.orderId}</span>
                </div>
              </div>

              {/* Delivery OTP Notice (if Out for Delivery) */}
              {order.status === 'Out for Delivery' && order.deliveryOTP && (
                <div className="bg-purple-50 border-b border-purple-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-purple-900">
                    <i className="fas fa-truck-fast text-2xl text-purple-600"></i>
                    <div>
                      <p className="font-bold text-sm">Package is Out for Delivery Today!</p>
                      <p className="text-xs text-purple-700">Share this verification OTP with the delivery agent:</p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-purple-400 px-4 py-1.5 rounded-lg text-xl font-mono font-black text-purple-700 tracking-widest">
                    {order.deliveryOTP}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-4 sm:p-6 space-y-4">
                {order.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl p-1 flex-shrink-0 flex items-center justify-center border border-gray-100">
                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${encodeURIComponent(item.name)}`}
                        className="font-semibold text-sm text-gray-900 hover:text-indigo-600 truncate block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Quantity: {item.quantity || 1} &bull; Price: ₹{(item.pricePaid || item.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions Footer */}
              <div className="p-4 sm:p-6 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Estimated Delivery:</span>{' '}
                  {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '3-4 business days'}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTrackingModal({ open: true, order })}
                    className="px-4 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition"
                  >
                    <i className="fas fa-route mr-1"></i> Track Shipment
                  </button>

                  {order.status === 'Processing' && (
                    <button
                      onClick={() => setCancelModal({ open: true, orderId: order.orderId })}
                      className="px-4 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRACKING TIMELINE MODAL */}
      {trackingModal.open && trackingModal.order && (
        <div className="modal-overlay" onClick={() => setTrackingModal({ open: false, order: null })}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Shipment Tracking</h2>
              <button className="close-button" onClick={() => setTrackingModal({ open: false, order: null })}>&times;</button>
            </div>
            <div className="p-2 space-y-6">
              <p className="text-xs text-gray-500">
                Order <span className="font-mono font-bold text-gray-800">#{trackingModal.order.orderId}</span>
              </p>

              {/* Timeline Steps */}
              <div className="space-y-6 relative pl-6 border-l-2 border-indigo-200">
                {/* Step 1: Confirmed */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                  <h4 className="font-bold text-sm text-gray-900">Order Confirmed</h4>
                  <p className="text-xs text-gray-500">Your order has been placed and confirmed.</p>
                </div>

                {/* Step 2: Shipped */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${
                    ['Shipped', 'Out for Delivery', 'Delivered'].includes(trackingModal.order.status)
                      ? 'bg-emerald-500 ring-4 ring-emerald-100'
                      : 'bg-gray-300'
                  }`}></span>
                  <h4 className="font-bold text-sm text-gray-900">Shipped</h4>
                  <p className="text-xs text-gray-500">Package has been dispatched via courier partner.</p>
                </div>

                {/* Step 3: Out for Delivery */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${
                    ['Out for Delivery', 'Delivered'].includes(trackingModal.order.status)
                      ? 'bg-purple-600 ring-4 ring-purple-100'
                      : 'bg-gray-300'
                  }`}></span>
                  <h4 className="font-bold text-sm text-gray-900">Out for Delivery</h4>
                  <p className="text-xs text-gray-500">Courier agent is on the way to your delivery address.</p>
                </div>

                {/* Step 4: Delivered */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${
                    trackingModal.order.status === 'Delivered'
                      ? 'bg-emerald-500 ring-4 ring-emerald-100'
                      : 'bg-gray-300'
                  }`}></span>
                  <h4 className="font-bold text-sm text-gray-900">Delivered</h4>
                  <p className="text-xs text-gray-500">Package delivered safely to recipient.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {cancelModal.open && (
        <div className="modal-overlay" onClick={() => setCancelModal({ open: false, orderId: null })}>
          <div className="modal-content text-center p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Cancel This Order?</h2>
            <p className="text-gray-500 text-xs mb-6">
              Are you sure you want to cancel order #{cancelModal.orderId}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal({ open: false, orderId: null })}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

