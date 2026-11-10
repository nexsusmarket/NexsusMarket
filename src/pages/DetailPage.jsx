// client/src/pages/DetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productsData from '../data/products.json';
import { fetchProductReviews, addToCart as apiAddToCart } from '../api/apiService';
import ProductCard from '../components/ProductCard';

export default function DetailPage() {
  const { name } = useParams();
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [reviewsData, setReviewsData] = useState({ reviews: [], average: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Decode product name
  const decodedName = decodeURIComponent(name || '');
  const product = productsData.find(
    p => p.name.trim().toLowerCase() === decodedName.trim().toLowerCase()
  ) || productsData.find(p => p.name.includes(decodedName));

  useEffect(() => {
    if (product) {
      recordViewedItem(product);
      setLoadingReviews(true);
      fetchProductReviews(product.name).then(data => {
        setReviewsData(data);
        setLoadingReviews(false);
      });
    }
  }, [decodedName, product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">Sorry, we couldn't find the product you're looking for.</p>
        <Link to="/explore" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold">
          Back to Products
        </Link>
      </div>
    );
  }

  const isInWishlist = (userData?.wishlist || []).some(item => item.name === product.name);
  const isInCart = (userData?.cart || []).some(item => item.name === product.name);

  // Related products from same category
  const relatedProducts = productsData
    .filter(p => p.category === product.category && p.name !== product.name)
    .slice(0, 6);

  const handleBuyNow = async () => {
    if (!checkAuth()) return;
    await addToCart(product);
    navigate('/checkout');
  };

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<i key={i} className="fas fa-star text-yellow-400 text-sm"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star text-gray-300 text-sm"></i>);
      }
    }
    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category}`} className="hover:text-indigo-600 capitalize">{product.category}</Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
        {/* Product Image */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl relative">
          <button
            onClick={() => addToWishlist(product)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition"
            title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <i className={`${isInWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400'} text-xl`}></i>
          </button>

          <img
            src={product.image}
            alt={product.name}
            className="max-h-80 md:max-h-96 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Details */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {product.category}
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {renderStars(reviewsData.average || 4.5)}
              </div>
              <span className="font-bold text-sm text-gray-800">
                {reviewsData.average > 0 ? reviewsData.average : '4.5'}
              </span>
              <span className="text-xs text-gray-400">
                ({reviewsData.totalReviews > 0 ? reviewsData.totalReviews : '24'} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="pt-2">
              <span className="text-3xl font-black text-gray-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 block mt-1">Inclusive of all taxes</span>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600 border border-gray-100">
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-indigo-600"></i>
              <span>100% Genuine & Brand Certified Product</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-truck text-emerald-600"></i>
              <span>Free Delivery on orders above ₹500</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-undo text-amber-600"></i>
              <span>3-Day Easy Return Policy</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-4">
              {isInCart ? (
                <Link
                  to="/cart"
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-center shadow-lg transition"
                >
                  <i className="fas fa-check mr-2"></i> Go to Cart
                </Link>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-cart-plus"></i> Add to Cart
                </button>
              )}

              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold rounded-xl shadow-lg transition"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <i className="fas fa-star text-yellow-400"></i>
          Customer Reviews
        </h2>

        {reviewsData.reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No customer reviews yet for this product. Be the first to review after receiving your order!
          </p>
        ) : (
          <div className="space-y-4 divide-y divide-gray-100">
            {reviewsData.reviews.map((rev, idx) => (
              <div key={idx} className="pt-4 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="font-semibold text-sm text-gray-800">{rev.userName}</span>
                  </div>
                  <div className="flex space-x-0.5">
                    {renderStars(rev.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 pt-1">{rev.reviewText}</p>
                {rev.date && (
                  <span className="text-xs text-gray-400 block">
                    {new Date(rev.date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Similar Products You Might Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedProducts.map((p, idx) => (
              <ProductCard key={idx} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

