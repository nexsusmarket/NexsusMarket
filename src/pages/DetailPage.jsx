// client/src/pages/DetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productsData from '../data/products.json';
import { fetchProductReviews, addToCart as apiAddToCart } from '../api/apiService';
import ProductCard from '../components/ProductCard';

export default function DetailPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Find product by URL param or query string
  const rawName = params.name || searchParams.get('name') || '';
  const decodedName = decodeURIComponent(rawName).trim();

  const product = productsData.find(
    p => p.name.trim().toLowerCase() === decodedName.toLowerCase()
  ) || productsData.find(
    p => p.name.toLowerCase().includes(decodedName.toLowerCase())
  );

  const dealPriceParam = searchParams.get('dealPrice');
  const displayPrice = dealPriceParam ? parseInt(dealPriceParam) : (product ? product.price : 0);
  const isSpecialDeal = Boolean(dealPriceParam);
  const originalPrice = Math.round(displayPrice * (isSpecialDeal ? 1.4 : 1.25));
  const discount = originalPrice > 0 ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

  const [selectedImage, setSelectedImage] = useState(product ? product.image : '');
  const [reviewsData, setReviewsData] = useState({ reviews: [], average: 0, totalReviews: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      recordViewedItem(product);
      fetchProductReviews(product.name).then(data => {
        setReviewsData(data || { reviews: [], average: 0, totalReviews: 0 });
      });
    }
  }, [decodedName, product]);

  if (!product) {
    return (
      <main className="container mx-auto px-0 py-0">
        <div id="product-detail-container" className="min-h-[500px] flex flex-col items-center justify-center p-10">
          <h2 className="text-xl font-bold text-gray-700">Product Not Found</h2>
          <p className="text-gray-500 mt-1">The product "{decodedName}" does not exist.</p>
          <Link to="/" className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full font-semibold">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const isInWishlist = (userData?.wishlist || []).some(p => p && p.name === product.name);
  const isInCart = (userData?.cart || []).some(p => p && p.name === product.name);

  const thumbnails = [product.image, ...(product.moreImages || [])];

  const cat = (product.category || '').toLowerCase();
  const isEligibleForStudentDiscount = displayPrice >= 1000 &&
    (cat.includes('mobile') || cat.includes('laptop') || cat.includes('phone') || cat.includes('iphone'));

  // Related products
  const relatedProducts = productsData
    .filter(p => p.category === product.category && p.name !== product.name)
    .slice(0, 8);

  const handleWishlistToggle = async () => {
    if (!checkAuth()) return;
    const success = await addToWishlist({ ...product, price: displayPrice });
    if (success) {
      showToast(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    }
  };

  const handleAddToCartClick = async () => {
    if (!checkAuth()) return;
    const success = await addToCart({ ...product, price: displayPrice });
    if (success) {
      showToast('Added to cart!');
    }
  };

  const handleBuyNow = async () => {
    if (!checkAuth()) return;
    const checkoutItem = {
      ...product,
      price: displayPrice,
      pricePaid: displayPrice,
      quantity: 1
    };
    localStorage.setItem('checkoutReadyCart', JSON.stringify([checkoutItem]));
    localStorage.setItem('buyNowMode', 'true');
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!checkAuth()) return;
    if (!reviewText.trim()) {
      showToast('Please enter your review text.', true);
      return;
    }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('userAuthToken');
      const userName = localStorage.getItem('userName') || 'User';
      const res = await fetch('/api/product/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: product.name,
          rating: reviewRating,
          reviewText: reviewText.trim(),
          userName
        })
      });
      if (res.ok) {
        showToast('Thank you! Review posted.');
        setReviewText('');
        const fresh = await fetchProductReviews(product.name);
        setReviewsData(fresh);
      } else {
        showToast('Failed to post review', true);
      }
    } catch (err) {
      showToast(err.message || 'Error posting review', true);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main className="container mx-auto px-0 py-0">
      <div id="product-detail-container" className="min-h-[500px]">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Left Column (5 cols): Main Image + Thumbnails */}
              <div className="lg:col-span-5 bg-gray-50 p-6 flex flex-col">
                <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 aspect-[4/3] flex items-center justify-center mb-4 overflow-hidden group">
                  <img
                    id="main-product-image"
                    src={selectedImage}
                    alt={product.name}
                    className="max-w-[90%] max-h-[90%] object-contain transform transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Nexus Verified
                  </span>
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="wishlist-icon absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition shadow-sm z-10"
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className={`${isInWishlist ? 'fas text-red-500' : 'far'} fa-heart text-lg`}></i>
                  </button>
                </div>

                {/* Thumbnails Row */}
                {thumbnails.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scroll">
                    {thumbnails.map((imgSrc, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(imgSrc)}
                        className={`thumbnail-btn flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === imgSrc
                            ? 'border-purple-600 ring-1 ring-purple-100'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={imgSrc} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (7 cols): Meta & Actions */}
              <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-md">
                      {product.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-400">SKU: NX-{product.name.length}94</span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">
                    {product.name}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                      <span className="font-bold text-sm text-yellow-800">
                        {reviewsData.average > 0 ? reviewsData.average : '4.2'}
                      </span>
                      <div className="text-xs flex text-yellow-400">
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star-half-alt"></i>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      ({reviewsData.totalReviews > 0 ? reviewsData.totalReviews : '128'} ratings & reviews)
                    </span>
                  </div>

                  {/* Special Deal Badge */}
                  {isSpecialDeal && (
                    <div className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-md inline-block mb-3 border border-red-100">
                      <i className="fas fa-tag mr-1"></i> Special Deal Applied
                    </div>
                  )}

                  {/* Price Row */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-green-600">{discount}% OFF</span>
                  </div>

                  {/* Perks Grid */}
                  <div className={`grid ${isEligibleForStudentDiscount ? 'grid-cols-4' : 'grid-cols-3'} gap-2 py-3 border-y border-gray-100 mb-6`}>
                    <div className="flex flex-col items-center text-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-0.5">
                        <i className="fas fa-truck-fast text-xs"></i>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight">Free<br />Delivery</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-0.5">
                        <i className="fas fa-shield-halved text-xs"></i>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight">1 Year<br />Warranty</span>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-0.5">
                        <i className="fas fa-rotate-left text-xs"></i>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight">7 Days<br />Replacement</span>
                    </div>

                    {isEligibleForStudentDiscount && (
                      <div className="flex flex-col items-center text-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mb-0.5">
                          <i className="fas fa-user-graduate text-xs"></i>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 leading-tight">Student<br />Offer</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {(product.highlights || ['Premium Quality', 'Best in class performance', '1 Year Warranty']).map((h, i) => (
                        <li key={i} className="flex items-start text-gray-600 mb-1.5 text-sm">
                          <i className="fas fa-check-circle text-green-500 mt-0.5 mr-2.5 flex-shrink-0"></i>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions: Add to Cart & Buy Now */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  {isInCart ? (
                    <Link
                      to="/cart"
                      className="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-green-600 hover:bg-green-700 text-white border-transparent"
                    >
                      <i className="fas fa-check"></i> <span>Go to Cart</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddToCartClick}
                      className="flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <i className="fas fa-shopping-cart"></i> <span>Add to Cart</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="buy-now-btn flex-1 py-3 px-6 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md shadow-purple-200"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <i className="fas fa-star text-yellow-400"></i>
              Customer Ratings & Reviews
            </h2>

            {/* Existing Reviews */}
            <div className="space-y-6 mb-8">
              {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((r, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {r.userName ? r.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{r.userName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-yellow-500 font-bold">{r.rating} ★</span>
                              <span className="text-xs text-gray-400">&bull; {new Date(r.date).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-1 rounded-full flex items-center">
                            <i className="fas fa-check-circle mr-1"></i> Certified Buyer
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-3 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                          "{r.reviewText}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No reviews yet. Be the first to review this product!
                </div>
              )}
            </div>

            {/* Write a Review Box */}
            <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Write a Customer Review</h3>
              <div className="flex items-center gap-4 mb-3">
                <label className="text-xs text-gray-600 font-semibold">Rating:</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-semibold text-gray-700"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Good</option>
                  <option value={2}>2 Stars - Fair</option>
                  <option value={1}>1 Star - Poor</option>
                </select>
              </div>

              <textarea
                rows={3}
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* Similar Products (Explore Style Grid) */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4 border-l-4 border-purple-600">
                Similar Products
              </h2>
              <div id="related-products-grid" className="products-grid">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.name} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
