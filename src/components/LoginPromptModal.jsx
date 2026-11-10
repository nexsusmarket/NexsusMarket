// client/src/components/LoginPromptModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPromptModal() {
  const { loginModalOpen, setLoginModalOpen } = useAuth();
  const navigate = useNavigate();

  if (!loginModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setLoginModalOpen(false)}>
      <div 
        className="modal-content text-center p-6 bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
          <i className="fas fa-lock text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Login Required</h2>
        <p className="text-gray-600 text-sm mb-6">
          Please sign in to your account to add items to your cart, save to wishlist, or access personal features.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setLoginModalOpen(false)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Not Now
          </button>
          <button
            onClick={() => {
              setLoginModalOpen(false);
              navigate('/signin');
            }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md transition"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

