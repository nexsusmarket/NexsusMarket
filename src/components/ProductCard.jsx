// client/src/components/ProductCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product, variant = 'grid' }) {
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast, checkAuth } = useAuth();
  const navigate = useNavigate();

  if (!product) return null;

  const isInWishlist = (userData?.wishlist || []).some(
    item => item && item.name === product.name
  );

  const isInCart = (userData?.cart || []).some(
    item => item && item.name === product.name
  );

  const handleProductClick = () => {
    recordViewedItem(product);
    navigate(`/detail.html?name=${encodeURIComponent(product.name)}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    const success = await addToWishlist(product);
    if (success) {
      showToast(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    const success = await addToCart(product);
    if (success) {
      showToast('Added to cart!');
    }
  };

  if (variant === 'reco') {
    return (
      <div className="product-card reco-card" data-product-name={encodeURIComponent(product.name)}>
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="reco-card-img cursor-pointer product-image"
            onClick={handleProductClick}
          />
          <div
            onClick={handleWishlistToggle}
            className="wishlist-icon absolute top-1 right-1 text-xl text-gray-300 cursor-pointer"
          >
            <i className={`${isInWishlist ? 'fas text-red-500' : 'far'} fa-heart transition-colors duration-300`}></i>
          </div>
        </div>
        <h3
          onClick={handleProductClick}
          className="reco-card-name cursor-pointer product-name"
        >
          {product.name}
        </h3>
        <div className="reco-card-footer">
          <span className="reco-card-price">₹{Number(product.price).toFixed(2)}</span>
          {isInCart ? (
            <Link
              to="/cart"
              className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap block text-center"
              style={{ display: 'inline-block', padding: '0.25rem 0.75rem' }}
            >
              Go to Cart
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className="add-to-cart-btn bg-purple-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-purple-700 transition whitespace-nowrap"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="product-container animate-fadeIn bg-white" data-product-name={encodeURIComponent(product.name)}>
      <div className="product-image-container relative mb-4">
        <img
          className="product-image object-contain h-40 w-full cursor-pointer"
          src={product.image}
          alt={product.name}
          onClick={handleProductClick}
        />
        <button
          onClick={handleWishlistToggle}
          className="wishlist-icon absolute top-0 right-0 p-2 text-2xl transition-transform hover:scale-110"
          aria-label="Wishlist"
        >
          <i className={`${isInWishlist ? 'fas text-red-500' : 'far text-gray-400'} fa-heart transition-colors duration-300`}></i>
        </button>
      </div>
      <div
        onClick={handleProductClick}
        className="product-name font-semibold text-gray-800 mb-1 h-12 overflow-hidden cursor-pointer hover:text-purple-600 transition"
      >
        {product.name}
      </div>
      <div className="product-price font-bold text-gray-900 mb-3">
        Price ₹{Number(product.price).toLocaleString('en-IN')}
      </div>
      {isInCart ? (
        <Link
          to="/cart"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm text-center block"
        >
          Go to Cart
        </Link>
      ) : (
        <button
          onClick={handleAddToCart}
          className="add-to-cart-btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition w-full shadow-sm"
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}
