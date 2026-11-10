// client/src/pages/WishlistPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const { userData, addToWishlist, addToCart, isLoggedIn, showToast } = useAuth();
  const navigate = useNavigate();

  const wishlist = userData?.wishlist || [];

  const handleMoveToCart = async (product) => {
    await addToCart(product);
    await addToWishlist(product); // Toggles off from wishlist
    showToast('Moved to Cart!');
  };

  const handleRemove = async (product) => {
    await addToWishlist(product);
    showToast('Removed from Wishlist');
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          <i className="fas fa-heart"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In to See Your Wishlist</h2>
        <p className="text-gray-500 mb-6">Save your favorite items here and shop them anytime.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <i className="fas fa-heart text-red-500 text-2xl"></i>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            My Wishlist
          </h1>
        </div>
        <span className="bg-pink-100 text-pink-800 text-xs font-bold px-3 py-1 rounded-full">
          {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} Saved
        </span>
      </div>

      {/* Grid */}
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-pink-50 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="far fa-heart"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Explore our collections and tap the heart icon on any product to save it here for later.
          </p>
          <Link
            to="/explore"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition"
          >
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {wishlist.map((product, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col justify-between"
            >
              <div 
                className="h-44 flex items-center justify-center p-2 cursor-pointer mb-3"
                onClick={() => navigate(`/product/${encodeURIComponent(product.name)}`)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain hover:scale-105 transition duration-300"
                />
              </div>

              <div className="space-y-2">
                <h3
                  onClick={() => navigate(`/product/${encodeURIComponent(product.name)}`)}
                  className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-indigo-600 cursor-pointer"
                  title={product.name}
                >
                  {product.name}
                </h3>
                <span className="block font-bold text-sm text-gray-900">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Move to Cart
                </button>
                <button
                  onClick={() => handleRemove(product)}
                  className="w-full py-1 text-xs text-red-500 hover:text-red-700 font-medium transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

