// client/src/components/ProductCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast } = useAuth();
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
    navigate(`/product/${encodeURIComponent(product.name)}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    const success = await addToWishlist(product);
    if (success) {
      showToast(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const success = await addToCart(product);
    if (success) {
      showToast('Added to cart!');
    }
  };

  return (
    <div className="product-container bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between p-4 border border-gray-100 hover:-translate-y-1">
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="wishlist-icon absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center transition-transform hover:scale-110"
        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <i className={`${isInWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400 hover:text-red-500'} text-base transition-colors`}></i>
      </button>

      {/* Product Image */}
      <div 
        onClick={handleProductClick} 
        className="product-image-container h-44 flex items-center justify-center p-2 cursor-pointer overflow-hidden rounded-lg mb-3"
      >
        <img
          src={product.image}
          alt={product.name}
          className="product-image max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between">
        <h3
          onClick={handleProductClick}
          className="product-name text-sm font-semibold text-gray-800 hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors mb-2"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="card-footer mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="product-price text-sm font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>

          {isInCart ? (
            <Link
              to="/cart"
              onClick={(e) => e.stopPropagation()}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow transition"
            >
              Go to Cart
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className="add-to-cart-button text-xs font-semibold px-3.5 py-1.5 rounded-full shadow transition"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

