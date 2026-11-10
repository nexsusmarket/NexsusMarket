// client/src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeOrder as apiPlaceOrder } from '../api/apiService';

function getShippingCost(address) {
  if (!address || !address.state) return 100;
  const cleanState = address.state.trim().toLowerCase().replace(/\s+/g, '');
  if (['andhrapradesh', 'telangana'].includes(cleanState)) {
    return 0;
  }
  return 100;
}

export default function CheckoutPage() {
  const { userData, refreshUserData, showToast } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  // Address
  const address = userData?.address || JSON.parse(localStorage.getItem('deliveryAddress') || '{}');

  // Cart
  const isBuyNow = localStorage.getItem('buyNowMode') === 'true';
  let cart = JSON.parse(localStorage.getItem('checkoutReadyCart') || '[]');
  if (!isBuyNow && cart.length === 0) {
    cart = userData?.cart || JSON.parse(localStorage.getItem('cartProducts') || '[]');
  }

  const subtotal = cart.reduce((sum, p) => {
    const itemPrice = p.pricePaid !== undefined ? p.pricePaid : p.price;
    return sum + (itemPrice * (p.quantity || 1));
  }, 0);

  const shipping = getShippingCost(address);
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('No items to checkout', true);
      navigate('/cart');
      return;
    }
    if (!address?.pincode) {
      showToast('Please provide a delivery address', true);
      navigate('/address');
      return;
    }

    setPlacing(true);
    try {
      const orderPayload = {
        items: cart.map(item => ({
          name: item.name,
          price: item.pricePaid !== undefined ? item.pricePaid : item.price,
          quantity: item.quantity || 1,
          image: item.image,
          category: item.category || 'General'
        })),
        shippingAddress: address,
        totalAmount: total,
        shippingCost: shipping
      };

      await apiPlaceOrder(orderPayload);
      localStorage.removeItem('checkoutReadyCart');
      localStorage.removeItem('buyNowMode');
      await refreshUserData();
      showToast('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      showToast(err.message || 'Error placing order', true);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Shipping Info & Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold border-b pb-3 mb-4">Shipping Information</h2>
          <div id="shipping-address-summary" className="mb-6 text-gray-700 space-y-1">
            {address?.pincode ? (
              <>
                <p className="font-bold text-gray-900">{address.name}</p>
                <p>{address.address}</p>
                <p>{address.city}, {address.state} - {address.pincode}</p>
                <p className="mt-2 text-sm text-gray-500">Phone: {address.mobile}</p>
                <Link to="/address" className="inline-block mt-3 text-sm text-indigo-600 font-semibold hover:underline">
                  Change Address
                </Link>
              </>
            ) : (
              <div className="text-red-500">
                <p>No delivery address found.</p>
                <Link to="/address" className="inline-block mt-2 text-sm text-indigo-600 font-semibold hover:underline">
                  Add Delivery Address
                </Link>
              </div>
            )}
          </div>

          <form id="checkout-form" onSubmit={handlePlaceOrder}>
            <button
              type="submit"
              id="place-order-btn"
              disabled={placing}
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition text-lg"
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-1">
          <aside className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold border-b pb-3 mb-4">Your Order</h2>
            <div id="order-summary-items" className="space-y-4 mb-4">
              {cart.map((item, idx) => {
                const itemPrice = item.pricePaid !== undefined ? item.pricePaid : item.price;
                return (
                  <div key={idx} className="flex items-center space-x-4 border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center p-1">
                      <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity || 1}</p>
                      <span className="font-bold text-sm text-gray-900 block mt-1">₹{(itemPrice * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span id="summary-subtotal">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span id="summary-shipping">
                  {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                <span>Total</span>
                <span id="summary-total">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
}
