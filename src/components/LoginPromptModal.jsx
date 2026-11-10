// client/src/components/LoginPromptModal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPromptModal() {
  const { loginModalOpen, setLoginModalOpen } = useAuth();

  if (!loginModalOpen) return null;

  return (
    <div id="login-prompt-modal" className="modal-overlay" onClick={() => setLoginModalOpen(false)}>
      <div className="modal-content text-center max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-gray-600 mb-6">You need an account to add items to your cart and wishlist.</p>
        <div className="flex justify-center space-x-4">
          <button
            id="close-prompt-btn"
            type="button"
            onClick={() => setLoginModalOpen(false)}
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
          >
            Not Now
          </button>
          <Link
            to="/signin"
            onClick={() => setLoginModalOpen(false)}
            className="block px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-semibold"
          >
            Sign In / Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
