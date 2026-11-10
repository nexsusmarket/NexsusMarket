// client/src/pages/CustomerServicePage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendSupportTicket } from '../api/apiService';

export default function CustomerServicePage() {
  const { userData, userName, isLoggedIn, showToast } = useAuth();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      setFeedback({ text: 'Please select an issue category.', isError: true });
      return;
    }
    if (!message.trim()) {
      setFeedback({ text: 'Please provide details about your issue.', isError: true });
      return;
    }

    setSubmitting(true);
    setFeedback({ text: '', isError: false });
    try {
      await sendSupportTicket(category, message.trim());
      setFeedback({
        text: 'Thank you! Your support request has been submitted. We will contact you soon.',
        isError: false
      });
      setMessage('');
      setCategory('');
      showToast('Support ticket submitted!');
    } catch (err) {
      setFeedback({
        text: err.message || 'Error submitting message. Please try again.',
        isError: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-12">
      {!isLoggedIn ? (
        <div id="logged-out-view" className="text-center max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
          <i className="fas fa-sign-in-alt text-5xl text-purple-500 mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to contact our customer support team.</p>
          <Link
            to="/signin"
            className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-transform transform hover:scale-105 inline-block"
          >
            Sign In to Continue
          </Link>
        </div>
      ) : (
        <div id="logged-in-view" className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <i className="fas fa-headset text-5xl text-purple-500 mb-4"></i>
              <h1 className="text-3xl font-bold text-gray-800">Contact Customer Support</h1>
              <p className="text-gray-500 mt-2">We're here to help. Please fill out the form below.</p>
            </div>

            <form id="support-form" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="user-info" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Information
                </label>
                <div className="flex items-center space-x-4 bg-gray-100 p-3 rounded-md">
                  <i className="fas fa-user-check text-gray-500"></i>
                  <div>
                    <p id="user-name" className="font-semibold text-gray-800">
                      {userName || 'Valued Customer'}
                    </p>
                    <p id="user-email" className="text-sm text-gray-500">
                      {userData?.email || userData?.phone || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="issue-category" className="block text-sm font-medium text-gray-700 mb-2">
                  How can we help you?
                </label>
                <div className="relative">
                  <i className="fas fa-list-alt absolute left-3 top-3.5 text-gray-400"></i>
                  <select
                    id="issue-category"
                    name="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 transition"
                  >
                    <option value="" disabled>Select an issue category...</option>
                    <option value="Payment Issues">Payment Issues</option>
                    <option value="Shipping & Delivery">Shipping & Delivery</option>
                    <option value="Coupon & Discount Problems">Coupon & Discount Problems</option>
                    <option value="Website Glitches or Errors">Website Glitches or Errors</option>
                    <option value="Product Questions">Product Questions</option>
                    <option value="Account Issues">Account Issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="issue-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe your issue
                </label>
                <textarea
                  id="issue-message"
                  name="message"
                  rows="6"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide as much detail as possible..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 transition"
                ></textarea>
              </div>

              <button
                type="submit"
                id="submit-btn"
                disabled={submitting}
                className="w-full bg-purple-600 text-white py-3 rounded-md font-bold hover:bg-purple-700 transition flex items-center justify-center space-x-2"
              >
                <i className="fas fa-paper-plane"></i>
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              </button>

              {feedback.text && (
                <div
                  id="form-feedback"
                  className={`mt-4 text-center text-sm font-semibold ${
                    feedback.isError ? 'text-red-500' : 'text-green-600'
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
