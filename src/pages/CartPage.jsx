// client/src/pages/CartPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  updateCartOffer as apiUpdateCartOffer,
  requestDiscountCode as apiRequestDiscountCode,
  verifyDiscountCode as apiVerifyDiscountCode
} from '../api/apiService';

// Master list of bank offers
const ALL_BANK_OFFERS = [
  { id: 'none', text: 'No offer', discount: 0, logoUrl: null },
  { id: 'ICICI5_MID', text: '5% ICICI', discount: 5, logoUrl: 'https://cdn.worldvectorlogo.com/logos/icici-bank-1.svg' },
  { id: 'HDFC250_MID', text: '₹250 HDFC', discount: 250, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/hdfc-bank-logo.svg' },
  { id: 'AXIS7_MID', text: '7% Axis Bank', discount: 7, logoUrl: 'https://cdn.worldvectorlogo.com/logos/axis-bank-logo-1.svg' },
  { id: 'KOTAK300_MID', text: '₹300 Kotak', discount: 300, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/kotak-mahindra-bank-logo.svg' },
  { id: 'HDFC10_HIGH', text: '10% HDFC', discount: 10, logoUrl: 'https://cdn.worldvectorlogo.com/logos/hdfc-bank-logo.svg' },
  { id: 'SBI1000_HIGH', text: '₹1000 SBI', discount: 1000, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/sbi-3.svg' },
  { id: 'AMEX8_HIGH', text: '8% Amex', discount: 8, logoUrl: 'https://cdn.worldvectorlogo.com/logos/american-express-1.svg' },
  { id: 'YES1200_HIGH', text: '₹1200 Yes Bank', discount: 1200, isFlat: true, logoUrl: 'https://cdn.worldvectorlogo.com/logos/yes-bank.svg' }
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

export default function CartPage() {
  const { userData, updateCartQty, removeFromCart, refreshUserData, showToast, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [activeBankModal, setActiveBankModal] = useState({ open: false, product: null, offerId: null });
  const [accountNumber, setAccountNumber] = useState('');
  const [cvv, setCvv] = useState('');

  const [studentModal, setStudentModal] = useState({ open: false, product: null });
  const [studentEmail, setStudentEmail] = useState('');
  const [verifyModal, setVerifyModal] = useState({ open: false, product: null });
  const [verificationCode, setVerificationCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const cartItems = userData?.cart || [];
  const address = userData?.address;

  // Calculation logic
  let subtotal = 0;
  let totalDiscount = 0;

  cartItems.forEach(item => {
    const qty = item.quantity || 1;
    const basePrice = item.price * qty;
    subtotal += basePrice;

    // Student discount
    if (item.discount) {
      totalDiscount += (basePrice * (item.discount / 100));
    }

    // Bank offer discount
    if (item.selectedOfferId && item.selectedOfferId !== 'none') {
      const offer = ALL_BANK_OFFERS.find(o => o.id === item.selectedOfferId);
      if (offer) {
        if (offer.isFlat) {
          totalDiscount += offer.discount;
        } else {
          totalDiscount += (basePrice * (offer.discount / 100));
        }
      }
    }
  });

  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const finalTotal = Math.max(0, subtotal - totalDiscount + shipping);

  // Bank offer selection
  const handleOfferChange = (product, offerId) => {
    if (offerId === 'none') {
      apiUpdateCartOffer(product.name, 'none', null).then(() => {
        refreshUserData();
        showToast('Bank offer removed');
      });
      return;
    }
    // Open Account Number modal
    setActiveBankModal({ open: true, product, offerId });
  };

  const handleBankModalSubmit = async (e) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.length < 12) {
      showToast('Please enter a valid card / account number.', true);
      return;
    }
    setModalLoading(true);
    try {
      await apiUpdateCartOffer(activeBankModal.product.name, activeBankModal.offerId, accountNumber);
      await refreshUserData();
      showToast('Bank offer applied successfully!');
      setActiveBankModal({ open: false, product: null, offerId: null });
      setAccountNumber('');
      setCvv('');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setModalLoading(false);
    }
  };

  // Student discount requests
  const handleStudentEmailSubmit = async (e) => {
    e.preventDefault();
    if (!studentEmail.endsWith('.edu.in')) {
      showToast('Must be a valid .edu.in college email', true);
      return;
    }
    setModalLoading(true);
    try {
      const res = await apiRequestDiscountCode(studentEmail, studentModal.product.name);
      showToast(res.message || 'Verification code sent to your email.');
      const prod = studentModal.product;
      setStudentModal({ open: false, product: null });
      setVerifyModal({ open: true, product: prod });
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      showToast('Please enter verification code', true);
      return;
    }
    setModalLoading(true);
    try {
      await apiVerifyDiscountCode(verificationCode, verifyModal.product.name);
      await refreshUserData();
      showToast('10% Student Discount applied!');
      setVerifyModal({ open: false, product: null });
      setVerificationCode('');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setModalLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          <i className="fas fa-shopping-cart"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Waiting</h2>
        <p className="text-gray-500 mb-6">Sign in to view your saved cart items and enjoy fast checkout.</p>
        <Link
          to="/signin"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-full shadow transition"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-body min-h-screen pb-16">
      {/* Delivery Bar */}
      <div className="delivery-bar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 text-gray-700">
          <i className="fas fa-map-marker-alt text-indigo-600"></i>
          <span className="text-gray-500">Deliver to:</span>
          <span className="font-semibold text-gray-900">
            {address?.city ? `${address.name || ''}, ${address.city} - ${address.pincode}` : 'No address selected'}
          </span>
        </div>
        <Link
          to="/address"
          className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs border border-indigo-200 rounded-md px-3 py-1 hover:bg-indigo-50 transition"
        >
          {address?.city ? 'Change Address' : 'Add Address'}
        </Link>
      </div>

      <div className="cart-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
          <i className="fas fa-shopping-bag text-indigo-600"></i>
          Shopping Cart ({cartItems.length} items)
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-4xl">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link
              to="/explore"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-full shadow-md transition"
            >
              Start Shopping <i className="fas fa-arrow-right ml-2"></i>
            </Link>
          </div>
        ) : (
          <div className="cart-layout-grid grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, idx) => {
                const offers = getBankOffersForPrice(item.price);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6"
                  >
                    {/* Image */}
                    <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center p-2 bg-gray-50 rounded-xl">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain cursor-pointer"
                        onClick={() => navigate(`/product/${encodeURIComponent(item.name)}`)}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3
                        onClick={() => navigate(`/product/${encodeURIComponent(item.name)}`)}
                        className="font-bold text-gray-900 text-base line-clamp-2 hover:text-indigo-600 cursor-pointer"
                      >
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="font-extrabold text-lg text-gray-900">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                        {item.discount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.discount}% Student Discount
                          </span>
                        )}
                        {item.selectedOfferId && item.selectedOfferId !== 'none' && (
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            Bank Offer Active
                          </span>
                        )}
                      </div>

                      {/* Bank Offers Dropdown */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-xs text-gray-500 font-medium">Bank Offer:</span>
                        <select
                          value={item.selectedOfferId || 'none'}
                          onChange={(e) => handleOfferChange(item, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {offers.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.text} {o.discount > 0 ? (o.isFlat ? `(Save ₹${o.discount})` : `(Save ${o.discount}%)`) : ''}
                            </option>
                          ))}
                        </select>

                        {/* Student Discount Button */}
                        {!item.discount && (
                          <button
                            onClick={() => setStudentModal({ open: true, product: item })}
                            className="text-xs text-purple-600 hover:text-purple-700 font-semibold underline ml-2"
                          >
                            Student Discount?
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateCartQty(item.name, (item.quantity || 1) - 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                        >
                          <i className="fas fa-minus text-xs"></i>
                        </button>
                        <span className="w-10 text-center font-bold text-sm">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.name, (item.quantity || 1) + 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                        >
                          <i className="fas fa-plus text-xs"></i>
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition"
                      >
                        <i className="fas fa-trash-alt"></i> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar (1 col) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Total Discounts Applied</span>
                    <span>-₹{Math.round(totalDiscount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <span className="font-semibold text-gray-900">
                    {shipping === 0 ? <span className="text-emerald-600 uppercase font-bold">Free</span> : `₹${shipping}`}
                  </span>
                </div>

                <hr className="border-gray-100 my-2" />

                <div className="flex justify-between text-base font-extrabold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 text-xl">₹{Math.round(finalTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <i className="fas fa-arrow-right"></i>
              </button>

              <Link
                to="/explore"
                className="block text-center text-xs text-indigo-600 hover:underline pt-2 font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Bank Account / Card Modal */}
      {activeBankModal.open && (
        <div className="modal-overlay" onClick={() => setActiveBankModal({ open: false, product: null, offerId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify Bank Card</h2>
              <button className="close-button" onClick={() => setActiveBankModal({ open: false, product: null, offerId: null })}>
                &times;
              </button>
            </div>
            <p className="modal-prompt-text">
              Enter your debit/credit card number to verify bank offer eligibility.
            </p>
            <form onSubmit={handleBankModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Card / Account Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9101 1121"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">CVV / PIN</label>
                <input
                  type="password"
                  placeholder="•••"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
              >
                {modalLoading ? 'Verifying...' : 'Apply Offer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Student Discount Email */}
      {studentModal.open && (
        <div className="modal-overlay" onClick={() => setStudentModal({ open: false, product: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Discount</h2>
              <button className="close-button" onClick={() => setStudentModal({ open: false, product: null })}>&times;</button>
            </div>
            <p className="modal-prompt-text">
              Enter your verified college email address ending with <strong>.edu.in</strong> to get an instant 10% discount.
            </p>
            <form onSubmit={handleStudentEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="student@university.edu.in"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                required
              />
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
              >
                {modalLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Student Verification Code */}
      {verifyModal.open && (
        <div className="modal-overlay" onClick={() => setVerifyModal({ open: false, product: null })}>
          <div className="modal-content" onClick={(e) => setVerifyModal({ open: false, product: null })}>
            <div className="modal-header">
              <h2>Enter Discount Code</h2>
              <button className="close-button" onClick={() => setVerifyModal({ open: false, product: null })}>&times;</button>
            </div>
            <p className="modal-prompt-text">
              Enter the 6-digit verification code sent to your student email.
            </p>
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="6-digit OTP"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm tracking-widest text-center font-bold text-lg"
                required
              />
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
              >
                {modalLoading ? 'Applying...' : 'Apply 10% Discount'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

