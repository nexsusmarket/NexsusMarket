// client/src/pages/CustomerServicePage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendSupportTicket as apiSendSupportTicket } from '../api/apiService';

export default function CustomerServicePage() {
  const { userData, isLoggedIn, showToast } = useAuth();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !message.trim()) {
      showToast('Please select a category and enter your message.', true);
      return;
    }
    setSubmitting(true);
    try {
      await apiSendSupportTicket(category, message.trim());
      setSubmitted(true);
      showToast('Support ticket sent successfully!');
      setMessage('');
      setCategory('');
    } catch (err) {
      showToast(err.message || 'Error submitting ticket', true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
          <i className="fas fa-headset"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          NexsusMarket Customer Helpdesk
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Need help with an order, refund, delivery, or product query? Our priority support team is available 24/7.
        </p>
      </div>

      {!isLoggedIn ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 max-w-md mx-auto space-y-4">
          <i className="fas fa-user-lock text-4xl text-gray-400"></i>
          <h2 className="text-xl font-bold text-gray-800">Login to Contact Support</h2>
          <p className="text-gray-500 text-sm">
            Please log in to your registered NexsusMarket account so we can automatically link your orders and account history.
          </p>
          <Link
            to="/signin"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full shadow transition"
          >
            Sign In Now
          </Link>
        </div>
      ) : submitted ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-emerald-100 max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Ticket Submitted Successfully!</h2>
          <p className="text-gray-500 text-sm">
            Our support desk has received your ticket. A confirmation has been logged and an agent will reply to your registered email (<strong>{userData?.email}</strong>) within 2-4 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs text-indigo-600 font-bold hover:underline"
          >
            Submit Another Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Meta Readonly */}
            <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 border border-gray-100">
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Account Name</span>
                <span className="font-bold text-sm text-gray-900">{userData?.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold uppercase">Registered Email</span>
                <span className="font-bold text-sm text-gray-900">{userData?.email}</span>
              </div>
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="">Select an issue category</option>
                <option value="Payment Issue">Payment or Refund Failure</option>
                <option value="Shipping & Delivery">Shipping & Tracking Delay</option>
                <option value="Coupon or Discount">Coupon / Student Discount Issue</option>
                <option value="Product Quality">Damaged / Defective Product</option>
                <option value="Account Management">Account Login or Password</option>
                <option value="Other Query">General Inquiry or Feedback</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Detailed Message <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue with relevant details like Order ID or product name..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting Ticket...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

