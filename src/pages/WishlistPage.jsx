// client/src/pages/WishlistPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const { userData, addToWishlist, addToCart, isLoggedIn, showToast } = useAuth();
  const navigate = useNavigate();

  const wishlist = (userData?.wishlist || []).filter(item => item);
  const cart = (userData?.cart || []).filter(item => item);

  const handleRemove = async (product) => {
    await addToWishlist(product);
    showToast('Removed from Wishlist');
  };

  const handleMoveToCart = async (product) => {
    await addToCart(product);
    showToast('Moved to Cart!');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center bg-white p-10 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link to="/signin" className="text-purple-600 font-bold hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Wishlist <span className="text-red-500">❤️</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Save your favorite items now, buy them later.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span id="wishlist-count-badge" className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-semibold">
            {wishlist.length} Items Saved
          </span>
        </div>
      </div>

      <div id="wishlist-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {wishlist.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <i className="far fa-heart text-4xl text-purple-300"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-500 mb-8 max-w-md text-center">
              Looks like you haven't found anything you like yet. Browse our categories to find your next favorite item.
            </p>
            <Link
              to="/explore"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          wishlist.map((product) => {
            const isInCart = cart.some(p => p && p.name === product.name);
            const btnText = isInCart ? 'Go to Cart' : 'Move to Cart';
            const btnClass = isInCart
              ? 'go-to-cart-btn bg-green-600 hover:bg-green-700'
              : 'add-to-cart-btn bg-gray-900 hover:bg-purple-600';
            const btnIcon = isInCart ? 'fa-check' : 'fa-shopping-cart';

            return (
              <div
                key={product.name}
                className="wishlist-card group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col"
                data-product-name={encodeURIComponent(product.name)}
              >
                <button
                  type="button"
                  onClick={() => handleRemove(product)}
                  className="wishlist-remove-btn absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-gray-400 hover:text-red-500 hover:bg-red-50 transition z-10"
                  title="Remove from Wishlist"
                >
                  <i className="fas fa-times"></i>
                </button>

                <div
                  className="product-image-container relative h-48 mb-4 overflow-hidden rounded-xl bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/detail.html?name=${encodeURIComponent(product.name)}`)}
                >
                  <img
                    className="product-image w-full h-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-110"
                    src={product.image}
                    alt={product.name}
                  />
                </div>

                <div className="flex-grow flex flex-col">
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Nexus Approved</div>
                  <h3
                    className="product-name font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 hover:text-purple-600 cursor-pointer transition-colors"
                    onClick={() => navigate(`/detail.html?name=${encodeURIComponent(product.name)}`)}
                  >
                    {product.name}
                  </h3>

                  <div className="mt-auto mb-4">
                    <span className="text-xl font-extrabold text-gray-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isInCart ? (
                    <Link
                      to="/cart"
                      className={`${btnClass} w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
                    >
                      <i className={`fas ${btnIcon}`}></i>
                      <span>{btnText}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(product)}
                      className={`${btnClass} w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg`}
                    >
                      <i className={`fas ${btnIcon}`}></i>
                      <span>{btnText}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
