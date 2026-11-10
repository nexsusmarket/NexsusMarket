// client/src/pages/CartPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  updateCartOffer as apiUpdateCartOffer,
  requestDiscountCode as apiRequestDiscountCode,
  verifyDiscountCode as apiVerifyDiscountCode
} from '../api/apiService';

// Master list of all possible bank offers
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
  const { userData, updateCartQty, removeFromCart, refreshUserData, showToast } = useAuth();
  const navigate = useNavigate();

  // Custom Dropdown open state
  const [openDropdownProduct, setOpenDropdownProduct] = useState(null);

  // Bank offer modal
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [productForOffer, setProductForOffer] = useState(null);
  const [offerIdForOffer, setOfferIdForOffer] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankError, setBankError] = useState('');

  // Student discount modals
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [productForDiscount, setProductForDiscount] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [studentError, setStudentError] = useState('');

  const [loading, setLoading] = useState(false);

  const cartItems = userData?.cart || [];
  const deliveryAddress = userData?.address || JSON.parse(localStorage.getItem('deliveryAddress') || '{}');

  const deliveryLocationText = deliveryAddress?.city && deliveryAddress?.pincode 
    ? `${deliveryAddress.city} - ${deliveryAddress.pincode}` 
    : 'Select delivery address';

  // Calculate totals
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const subtotal = cartItems.reduce((sum, item) => {
    let itemPrice = item.price;
    if (item.discount > 0) {
      itemPrice *= (1 - item.discount / 100);
    }
    const selectedOffer = ALL_BANK_OFFERS.find(o => o.id === item.selectedOfferId);
    if (selectedOffer && selectedOffer.discount > 0) {
      itemPrice = selectedOffer.isFlat 
        ? Math.max(0, itemPrice - selectedOffer.discount) 
        : itemPrice * (1 - selectedOffer.discount / 100);
    }
    return sum + (itemPrice * (item.quantity || 1));
  }, 0);

  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total = subtotal + shipping;

  // Quantity handlers
  const handleQuantityMinus = async (productName, currentQty) => {
    if (currentQty <= 1) {
      await removeFromCart(productName);
    } else {
      await updateCartQty(productName, currentQty - 1);
    }
  };

  const handleQuantityPlus = async (productName, currentQty) => {
    await updateCartQty(productName, currentQty + 1);
  };

  const handleRemoveItem = async (productName) => {
    await removeFromCart(productName);
    showToast('Item removed from cart');
  };

  // Bank offer selection
  const handleSelectOffer = async (product, offer) => {
    setOpenDropdownProduct(null);
    if (offer.id === 'none') {
      try {
        await apiUpdateCartOffer(product.name, 'none', null);
        await refreshUserData();
        showToast('Offer removed');
      } catch (err) {
        showToast(`Error removing offer: ${err.message}`, true);
      }
    } else {
      setProductForOffer(product.name);
      setOfferIdForOffer(offer.id);
      setCardNumber('');
      setCvv('');
      setBankError('');
      setBankModalOpen(true);
    }
  };

  const handleBankFormSubmit = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 12) {
      setBankError('Please enter a valid card number');
      return;
    }
    setLoading(true);
    try {
      await apiUpdateCartOffer(productForOffer, offerIdForOffer, cardNumber);
      await refreshUserData();
      setBankModalOpen(false);
      showToast('Offer applied successfully!');
    } catch (err) {
      setBankError(err.message || 'Error applying offer');
    } finally {
      setLoading(false);
    }
  };

  // Student discount handlers
  const handleStudentEmailSubmit = async (e) => {
    e.preventDefault();
    if (!studentEmail.endsWith('.edu.in')) {
      setStudentError('Please enter a valid college email ending with .edu.in');
      return;
    }
    setLoading(true);
    setStudentError('');
    try {
      await apiRequestDiscountCode(studentEmail, productForDiscount);
      setStudentModalOpen(false);
      setVerifyModalOpen(true);
      showToast('Verification code sent to your email');
    } catch (err) {
      setStudentError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      showToast('Please enter a valid 6-digit code', true);
      return;
    }
    setLoading(true);
    try {
      await apiVerifyDiscountCode(studentEmail, verificationCode, productForDiscount);
      await refreshUserData();
      setVerifyModalOpen(false);
      showToast('10% student discount applied!');
    } catch (err) {
      showToast(err.message || 'Invalid code', true);
    } finally {
      setLoading(false);
    }
  };

  // Checkout handler
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Error: Your cart is empty.', true);
      return;
    }
    if (!deliveryAddress?.pincode) {
      showToast('Error: Please add a delivery address.', true);
      navigate('/address');
      return;
    }

    const checkoutCartItems = cartItems.map(item => {
      let finalPrice = item.price;
      if (item.discount > 0) {
        finalPrice *= (1 - item.discount / 100);
      }
      const selectedOffer = ALL_BANK_OFFERS.find(o => o.id === item.selectedOfferId);
      if (selectedOffer && selectedOffer.discount > 0) {
        finalPrice = selectedOffer.isFlat 
          ? Math.max(0, finalPrice - selectedOffer.discount)
          : finalPrice * (1 - selectedOffer.discount / 100);
      }
      return { ...item, pricePaid: finalPrice };
    });

    localStorage.setItem('checkoutReadyCart', JSON.stringify(checkoutCartItems));
    localStorage.setItem('buyNowMode', 'false');
    navigate('/checkout');
  };

  return (
    <div className="cart-body">
      {/* Delivery Bar */}
      <div className="delivery-bar">
        <div>
          <span className="text-gray-600">Deliver to:</span>
          <span id="delivery-location" className="font-bold text-gray-800 ml-2">
            {deliveryLocationText}
          </span>
        </div>
        <Link
          to="/address"
          className="border border-gray-300 px-4 py-1 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Change
        </Link>
      </div>

      <main className="cart-container">
        <header className="cart-header">
          <h1 className="cart-title">Your Cart</h1>
        </header>

        <div className="cart-layout-grid">
          <section className="cart-items-section">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md col-span-full">
                <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-6"></i>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
                <Link
                  to="/explore"
                  className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((product) => {
                const availableOffers = getBankOffersForPrice(product.price);
                const selectedOffer = availableOffers.find(o => o.id === product.selectedOfferId) || availableOffers[0];

                const isEligibleForStudentDiscount = product.price >= 1000 && 
                  ['laptop', 'mobile'].includes((product.category || '').toLowerCase());

                let finalPrice = product.price;
                if (product.discount > 0) {
                  finalPrice *= (1 - product.discount / 100);
                }
                if (selectedOffer && selectedOffer.discount > 0) {
                  finalPrice = selectedOffer.isFlat 
                    ? Math.max(0, finalPrice - selectedOffer.discount)
                    : finalPrice * (1 - selectedOffer.discount / 100);
                }

                return (
                  <div key={product.name} className="cart-item-row" data-product-name={encodeURIComponent(product.name)}>
                    <div className="cart-product-details">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="cart-product-image cursor-pointer"
                        onClick={() => navigate(`/detail.html?name=${encodeURIComponent(product.name)}`)}
                      />
                      <div className="cart-product-meta">
                        <h2
                          className="cart-product-name cursor-pointer"
                          onClick={() => navigate(`/detail.html?name=${encodeURIComponent(product.name)}`)}
                        >
                          {product.name}
                        </h2>

                        {/* Student Discount Button / Badge */}
                        {isEligibleForStudentDiscount && (
                          product.discount > 0 ? (
                            <span className="text-xs text-green-600 font-bold block mt-1">
                              {product.discount}% Student Discount Applied!
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="student-discount-btn text-xs text-purple-600 hover:underline block mt-1 text-left"
                              onClick={() => {
                                setProductForDiscount(product.name);
                                setStudentEmail('');
                                setStudentError('');
                                setStudentModalOpen(true);
                              }}
                            >
                              Apply Student Discount
                            </button>
                          )
                        )}

                        {/* Custom Bank Offer Dropdown */}
                        {product.price >= 1000 ? (
                          <div className={`custom-select-wrapper ${openDropdownProduct === product.name ? 'open' : ''}`}>
                            <div
                              className="custom-select-trigger"
                              onClick={() => setOpenDropdownProduct(openDropdownProduct === product.name ? null : product.name)}
                            >
                              {selectedOffer.logoUrl ? (
                                <img src={selectedOffer.logoUrl} alt={selectedOffer.text} className="offer-logo" />
                              ) : (
                                <div className="offer-logo"></div>
                              )}
                              <span>{selectedOffer.text}</span>
                              <i className="fas fa-chevron-down dropdown-arrow"></i>
                            </div>

                            <ul className="custom-options">
                              {availableOffers.map((offer) => (
                                <li
                                  key={offer.id}
                                  className={`custom-option ${offer.id === selectedOffer.id ? 'selected' : ''}`}
                                  onClick={() => handleSelectOffer(product, offer)}
                                >
                                  {offer.logoUrl ? (
                                    <img src={offer.logoUrl} alt={offer.text} className="offer-logo" />
                                  ) : (
                                    <div className="offer-logo"></div>
                                  )}
                                  <span>{offer.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-2 p-1">No bank offers available</div>
                        )}

                        {/* Applied Account Number Note */}
                        {product.accountNumber && product.selectedOfferId && product.selectedOfferId !== 'none' && (
                          <div className="text-xs text-green-600 font-bold mt-1">
                            Offer applied to A/C ****{product.accountNumber.slice(-4)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="cart-quantity-selector">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button
                          type="button"
                          className="quantity-minus px-3 py-2 text-red-500 hover:bg-red-100 transition"
                          onClick={() => handleQuantityMinus(product.name, product.quantity || 1)}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span className="quantity-display px-4 py-1 font-semibold">{product.quantity || 1}</span>
                        <button
                          type="button"
                          className="quantity-plus px-3 py-2 text-green-600 hover:bg-green-100 transition"
                          onClick={() => handleQuantityPlus(product.name, product.quantity || 1)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Price Display */}
                    <div className="cart-price-display">
                      {finalPrice < product.price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-red-500 font-bold text-lg">
                            ₹{(finalPrice * (product.quantity || 1)).toFixed(2)}
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            ₹{(product.price * (product.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-lg">
                          ₹{(product.price * (product.quantity || 1)).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Remove Item Button */}
                    <button
                      type="button"
                      className="cart-remove-button"
                      aria-label="Remove item"
                      onClick={() => handleRemoveItem(product.name)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </section>

          {cartItems.length > 0 && (
            <aside className="cart-summary">
              <h2 className="cart-summary-title">Order Summary</h2>
              <div className="cart-summary-line">
                <span>Items</span>
                <span id="cart-item-count">{totalItems}</span>
              </div>
              <div className="cart-summary-line">
                <span>Subtotal</span>
                <span id="cart-subtotal">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-line">
                <span id="shipping-label">Shipping</span>
                <span id="cart-shipping">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <hr className="cart-summary-divider" />
              <div className="cart-summary-total">
                <span>Total</span>
                <span id="cart-total">₹{total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="cart-checkout-button"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </button>
              <Link
                to="/explore"
                onClick={() => sessionStorage.setItem('isAddMoreMode', 'true')}
                className="cart-continue-link"
              >
                Add more
              </Link>
            </aside>
          )}
        </div>
      </main>

      {/* Student Email Modal */}
      {studentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Enter Student Email for Discount</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setStudentModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleStudentEmailSubmit} className="modal-body">
              <p className="text-sm text-gray-600 mb-4">Enter your college email to get a 10% discount on this item.</p>
              <input
                type="email"
                placeholder="College Mail (.edu.in)"
                required
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              {studentError && <p className="text-red-600 text-sm mt-1 mb-3">{studentError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mt-4"
              >
                {loading ? 'Processing...' : 'Get Verification Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Verification Code Modal */}
      {verifyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Enter Verification Code</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setVerifyModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleVerifyCodeSubmit} className="modal-body">
              <p className="text-sm text-gray-600 mb-4">Check your email for the 6-digit code we sent you.</p>
              <input
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-2 border rounded-md mb-4 text-center text-lg tracking-[5px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              >
                {loading ? 'Verifying...' : 'Verify and Apply Discount'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account / Card Number Modal */}
      {bankModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Enter Card Details</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setBankModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleBankFormSubmit} className="modal-body">
              <p className="text-sm text-gray-600 mb-4">Please enter your card number and CVV to apply this offer.</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="16-Digit Card Number"
                  required
                  maxLength={16}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="3-Digit CVV"
                  required
                  maxLength={3}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              {bankError && <p className="text-red-600 text-sm mt-2 mb-3">{bankError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 mt-4"
              >
                {loading ? 'Applying...' : 'Apply Offer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
