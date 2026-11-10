// client/src/pages/DeliveredPage.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  requestReturnOtp as apiRequestReturnOtp, 
  finalizeReturn as apiFinalizeReturn,
  fetchSingleOrder as apiFetchSingleOrder,
  submitReview as apiSubmitReview
} from '../api/apiService';

export default function DeliveredPage() {
  const { userData, refreshUserData, addToCart, isLoggedIn, showToast } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Review Modal state
  const [reviewModal, setReviewModal] = useState({ open: false, item: null });
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Return Modal state
  const [returnModal, setReturnModal] = useState({ open: false, item: null });
  const [returnReason, setReturnReason] = useState('');
  const [otpModal, setOtpModal] = useState({ open: false, item: null });
  const [returnOtp, setReturnOtp] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Order Details Modal
  const [orderModal, setOrderModal] = useState({ open: false, order: null, loading: false });

  const deliveredItems = userData?.deliveredItems || [];

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return deliveredItems;
    const term = searchTerm.toLowerCase();
    return deliveredItems.filter(item => item.name?.toLowerCase().includes(term));
  }, [deliveredItems, searchTerm]);

  // Group items by Month & Year
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const date = new Date(item.deliveryDate || Date.now());
      const key = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
        <Link to="/signin" className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full shadow transition">
          Sign In
        </Link>
      </div>
    );
  }

  // Handle Review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast('Please enter your review comments.', true);
      return;
    }
    setSubmittingReview(true);
    try {
      await apiSubmitReview({
        itemId: reviewModal.item._id,
        category: reviewModal.item.category || 'General',
        productName: reviewModal.item.name,
        rating,
        reviewText: reviewText.trim()
      });
      await refreshUserData();
      showToast('Thank you! Review submitted successfully.');
      setReviewModal({ open: false, item: null });
      setReviewText('');
    } catch (err) {
      showToast(err.message || 'Error submitting review', true);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Return Step 1: Request OTP
  const handleReturnReasonSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      showToast('Please specify a reason for return.', true);
      return;
    }
    setReturnLoading(true);
    try {
      await apiRequestReturnOtp(returnModal.item._id, returnReason.trim());
      showToast('Return verification OTP sent to your registered email.');
      const it = returnModal.item;
      setReturnModal({ open: false, item: null });
      setOtpModal({ open: true, item: it });
    } catch (err) {
      showToast(err.message || 'Failed to request return', true);
    } finally {
      setReturnLoading(false);
    }
  };

  // Handle Return Step 2: Finalize OTP
  const handleFinalizeReturn = async (e) => {
    e.preventDefault();
    if (!returnOtp.trim()) {
      showToast('Please enter the OTP.', true);
      return;
    }
    setReturnLoading(true);
    try {
      await apiFinalizeReturn(otpModal.item._id, returnOtp.trim());
      await refreshUserData();
      showToast('Return accepted! Courier will pick up within 48 hours.');
      setOtpModal({ open: false, item: null });
      setReturnOtp('');
      setReturnReason('');
    } catch (err) {
      showToast(err.message || 'Incorrect verification OTP', true);
    } finally {
      setReturnLoading(false);
    }
  };

  // View full invoice
  const handleViewOrder = async (orderId) => {
    setOrderModal({ open: true, order: null, loading: true });
    try {
      const order = await apiFetchSingleOrder(orderId);
      setOrderModal({ open: true, order, loading: false });
    } catch (err) {
      showToast(err.message || 'Failed to load order invoice', true);
      setOrderModal({ open: false, order: null, loading: false });
    }
  };

  const isReturnEligible = (deliveryDate) => {
    if (!deliveryDate) return false;
    const now = new Date();
    const delivered = new Date(deliveryDate);
    const diffDays = Math.floor((now - delivered) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <i className="fas fa-check-circle text-emerald-600"></i>
            Delivered Items History
          </h1>
          <p className="text-xs text-gray-500 mt-1">Review past purchases and access invoices anytime</p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search delivered products..."
            className="w-full border border-gray-300 rounded-full pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
        </div>
      </div>

      {deliveredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="fas fa-box-open"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No delivered items yet</h2>
          <p className="text-gray-500 text-sm mb-6">When your orders are marked delivered, they will appear here.</p>
          <Link to="/explore" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-full text-sm">
            Shop Products
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedItems).map((monthYear) => (
            <div key={monthYear} className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider bg-gray-100 px-4 py-1.5 rounded-lg inline-block">
                {monthYear}
              </h2>

              <div className="space-y-4">
                {groupedItems[monthYear].map((item, idx) => {
                  const eligible = isReturnEligible(item.deliveryDate);
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-indigo-200 transition"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-100 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/product/${encodeURIComponent(item.name)}`}
                            className="font-bold text-sm text-gray-900 hover:text-indigo-600 line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            Delivered on: {new Date(item.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-bold text-gray-800">
                            Paid: ₹{(item.pricePaid || item.price).toLocaleString('en-IN')} (Qty: {item.quantity || 1})
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                        {item.reviewed ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <i className="fas fa-star text-yellow-400"></i> Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ open: true, item })}
                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition"
                          >
                            <i className="fas fa-pen mr-1"></i> Write a Review
                          </button>
                        )}

                        {item.orderId && (
                          <button
                            onClick={() => handleViewOrder(item.orderId)}
                            className="text-xs text-gray-600 hover:text-gray-900 underline font-medium"
                          >
                            View Invoice
                          </button>
                        )}

                        {eligible ? (
                          <button
                            onClick={() => setReturnModal({ open: true, item })}
                            className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
                          >
                            Return Item
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">Return Window Closed</span>
                        )}

                        <button
                          onClick={async () => {
                            await addToCart(item);
                            navigate('/cart');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Buy Again
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal.open && reviewModal.item && (
        <div className="modal-overlay" onClick={() => setReviewModal({ open: false, item: null })}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rate & Review Product</h2>
              <button className="close-button" onClick={() => setReviewModal({ open: false, item: null })}>&times;</button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {reviewModal.item.name}
              </p>

              {/* Star Rating Widget */}
              <div className="flex items-center justify-center space-x-2 py-3 bg-gray-50 rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentScore = hoverRating || rating;
                  const isFilled = star <= currentScore;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl focus:outline-none transition-transform hover:scale-125"
                    >
                      <i className={`fas fa-star ${
                        isFilled 
                          ? (currentScore <= 2 ? 'text-red-500' : currentScore === 3 ? 'text-amber-500' : 'text-emerald-500')
                          : 'text-gray-200'
                      }`}></i>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Detailed Experience</label>
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you like or dislike? How was the build quality and performance?"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RETURN REASON MODAL */}
      {returnModal.open && returnModal.item && (
        <div className="modal-overlay" onClick={() => setReturnModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Item Return</h2>
              <button className="close-button" onClick={() => setReturnModal({ open: false, item: null })}>&times;</button>
            </div>
            <form onSubmit={handleReturnReasonSubmit} className="space-y-4">
              <p className="text-xs text-gray-500">
                Returns must be initiated within 3 days of delivery. Please provide a reason:
              </p>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Defective piece, wrong size delivered, item damaged in transit"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={returnLoading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition"
              >
                {returnLoading ? 'Sending Code...' : 'Request Return OTP'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RETURN OTP MODAL */}
      {otpModal.open && otpModal.item && (
        <div className="modal-overlay" onClick={() => setOtpModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify Return Request</h2>
              <button className="close-button" onClick={() => setOtpModal({ open: false, item: null })}>&times;</button>
            </div>
            <form onSubmit={handleFinalizeReturn} className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter the 6-digit confirmation OTP sent to your email to authorize the return pickup.
              </p>
              <input
                type="text"
                required
                maxLength={6}
                value={returnOtp}
                onChange={(e) => setReturnOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full border border-gray-300 rounded-xl p-3 text-center tracking-widest font-bold text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={returnLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
              >
                {returnLoading ? 'Verifying...' : 'Confirm Return'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER INVOICE MODAL */}
      {orderModal.open && (
        <div className="modal-overlay" onClick={() => setOrderModal({ open: false, order: null, loading: false })}>
          <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Invoice</h2>
              <button className="close-button" onClick={() => setOrderModal({ open: false, order: null, loading: false })}>&times;</button>
            </div>
            {orderModal.loading ? (
              <div className="py-8 text-center text-gray-500">Loading invoice details...</div>
            ) : orderModal.order ? (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-bold text-sm text-gray-900">NexsusMarket Order #{orderModal.order.orderId}</p>
                    <p className="text-gray-500">{new Date(orderModal.order.orderDate).toLocaleString()}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full self-start">
                    {orderModal.order.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 uppercase mb-1">Delivered To:</h4>
                  <p>{orderModal.order.shippingAddress?.name}</p>
                  <p>{orderModal.order.shippingAddress?.address}, {orderModal.order.shippingAddress?.city}</p>
                  <p>{orderModal.order.shippingAddress?.state} - {orderModal.order.shippingAddress?.pincode}</p>
                </div>

                <div className="divide-y border-t border-b py-2 space-y-2">
                  {orderModal.order.items?.map((it, i) => (
                    <div key={i} className="flex justify-between pt-1">
                      <span>{it.name} (x{it.quantity || 1})</span>
                      <span className="font-semibold">₹{((it.pricePaid || it.price) * (it.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">₹{(orderModal.order.totalAmount || 0).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                >
                  <i className="fas fa-print mr-2"></i> Print Invoice
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

