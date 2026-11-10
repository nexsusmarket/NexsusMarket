// client/src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeOrder as apiPlaceOrder } from '../api/apiService';

export default function CheckoutPage() {
  const { userData, refreshUserData, showToast, isLoggedIn } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  const cartItems = userData?.cart || [];
  const address = userData?.address;

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Please Sign In to Checkout</h2>
        <Link to="/signin" className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full shadow transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <i className="fas fa-shopping-cart"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Items in Cart to Checkout</h2>
        <Link to="/explore" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-full shadow transition">
          Browse Products
        </Link>
      </div>
    );
  }

  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;

  cartItems.forEach(item => {
    const qty = item.quantity || 1;
    const basePrice = item.price * qty;
    subtotal += basePrice;
    if (item.discount) {
      totalDiscount += (basePrice * (item.discount / 100));
    }
  });

  const shipping = subtotal > 500 ? 0 : 40;
  const finalTotal = Math.max(0, subtotal - totalDiscount + shipping);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address || !address.address || !address.city || !address.pincode) {
      showToast('Please add a delivery address first.', true);
      navigate('/address');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderId = Math.floor(100000 + Math.random() * 900000).toString();
      const orderPayload = {
        orderId,
        orderDate: new Date().toISOString(),
        items: cartItems.map(item => ({
          name: item.name,
          price: item.price,
          pricePaid: item.discount ? item.price * (1 - item.discount / 100) : item.price,
          quantity: item.quantity || 1,
          image: item.image,
          category: item.category || 'General'
        })),
        totalAmount: finalTotal,
        shippingAddress: address,
        paymentMethod
      };

      await apiPlaceOrder(orderPayload);
      await refreshUserData();
      showToast(`Order #${orderId} placed successfully! Confirmation email sent.`);
      navigate('/orders');
    } catch (err) {
      showToast(err.message || 'Failed to place order. Try again.', true);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
        <i className="fas fa-shield-alt text-indigo-600"></i>
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Address & Payment (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-indigo-600"></i>
                1. Delivery Address
              </h2>
              <Link to="/address" className="text-xs text-indigo-600 font-bold hover:underline">
                {address?.city ? 'Change Address' : '+ Add Address'}
              </Link>
            </div>

            {address?.city ? (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1 border border-gray-100">
                <p className="font-bold text-gray-900">{address.name}</p>
                <p>{address.address}</p>
                <p>{address.city}, {address.state} - <span className="font-semibold">{address.pincode}</span></p>
                <p className="text-xs text-gray-500 pt-1">
                  <i className="fas fa-phone mr-1"></i> Phone: {address.mobile || userData?.phone}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-center justify-between">
                <span>No delivery address found. Please enter your address to proceed.</span>
                <Link to="/address" className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
                  Add Address Now
                </Link>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <i className="fas fa-credit-card text-indigo-600"></i>
              2. Payment Options
            </h2>

            <div className="space-y-3">
              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center justify-between flex-1">
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">Cash on Delivery (COD)</span>
                    <span className="text-xs text-gray-500">Pay cash or scan QR upon physical package arrival</span>
                  </div>
                  <i className="fas fa-money-bill-wave text-xl text-emerald-600"></i>
                </div>
              </label>

              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center justify-between flex-1">
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">UPI / Google Pay / PhonePe</span>
                    <span className="text-xs text-gray-500">Fast & zero surcharge instant payment</span>
                  </div>
                  <i className="fas fa-qrcode text-xl text-indigo-600"></i>
                </div>
              </label>

              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center justify-between flex-1">
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">Credit / Debit Card</span>
                    <span className="text-xs text-gray-500">Visa, Mastercard, RuPay, Amex</span>
                  </div>
                  <i className="far fa-credit-card text-xl text-blue-600"></i>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Order Review & Place (1 col) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            Review Order
          </h2>

          {/* Items preview list */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded border p-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-gray-500">Qty: {item.quantity || 1}</p>
                </div>
                <span className="font-bold text-gray-800">
                  ₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Price breakdown */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discounts Applied:</span>
                <span>-₹{Math.round(totalDiscount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span className="font-bold text-gray-900">
                {shipping === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>Order Total:</span>
              <span className="text-indigo-600 text-lg">₹{Math.round(finalTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Placing Order...
              </>
            ) : (
              <>
                <i className="fas fa-lock"></i> Place Order (₹{Math.round(finalTotal).toLocaleString('en-IN')})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

