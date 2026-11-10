// client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import productsData from '../data/products.json';
import { clearRecommendations as apiClearRecommendations } from '../api/apiService';

export default function HomePage() {
  const { userData, isLoggedIn, login, refreshUserData, showToast } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Magic link token login
  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    if (token && name) {
      login(token, name);
      // Clean params
      searchParams.delete('token');
      searchParams.delete('name');
      setSearchParams(searchParams);
      showToast(`Welcome back, ${name}!`);
    }
  }, [searchParams, login, setSearchParams, showToast]);

  // Slider items config matching original
  const sliderItems = [
    {
      name: "Samsung Galaxy S25 Ultra 5G Smartphone with Galaxy AI (Titanium Black, 12GB RAM, 512GB Storage)",
      ad: "Experience Galaxy AI",
      img: "https://m.media-amazon.com/images/I/717Q2swzhBL._AC_UY436_FMwebp_QL65_.jpg"
    },
    {
      name: "Apple 2024 MacBook Pro Laptop with M4 chip with 10‑core CPU and 10‑core GPU",
      ad: "Supercharged by M4",
      img: "https://m.media-amazon.com/images/I/61hpKVB9X2L._AC_UY436_FMwebp_QL65_.jpg"
    },
    {
      name: "Sony PlayStation5 Gaming Console (Slim)",
      ad: "Play Has No Limits",
      img: "https://m.media-amazon.com/images/I/51ljnEaW0pL._AC_UY436_FMwebp_QL65_.jpg"
    },
    {
      name: "Maroon patta anarkali winter dress women dress",
      ad: "Winter Anarkali Edition",
      img: "https://m.media-amazon.com/images/I/61WfQfN+LTL._AC_UL480_FMwebp_QL65_.jpg"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderItems.length]);

  const handleClearRecs = async () => {
    try {
      await apiClearRecommendations();
      await refreshUserData();
      showToast('Personalized recommendations cleared');
    } catch (err) {
      showToast('Failed to clear recommendations', true);
    }
  };

  // Recommendations: prioritize user recommendations, or fall back to sample products
  const recommendations = (userData?.recommendations && userData.recommendations.length > 0)
    ? userData.recommendations
    : productsData.slice(0, 8);

  const categories = [
    { name: 'Fashion', icon: 'fa-tshirt', link: '/category/fashion', bg: 'from-pink-500 to-rose-500' },
    { name: 'Mobiles', icon: 'fa-mobile-alt', link: '/category/mobiles', bg: 'from-blue-500 to-indigo-600' },
    { name: 'Home Appliances', icon: 'fa-blender', link: '/category/home', bg: 'from-amber-500 to-orange-500' },
    { name: 'Laptops', icon: 'fa-laptop', link: '/category/laptops', bg: 'from-violet-500 to-purple-600' },
    { name: 'Grocery', icon: 'fa-shopping-basket', link: '/category/grocery', bg: 'from-emerald-500 to-green-600' },
    { name: 'Top Deals', icon: 'fa-tags', link: '/deals', bg: 'from-red-500 to-yellow-500' },
  ];

  const featuredBrands = [
    { name: 'Apple', logo: '/images/google.png', label: 'Apple' }, // or brand image
    { name: 'HP', logo: '/images/hp.png', label: 'HP' },
    { name: 'Nike', logo: '/images/nike.png', label: 'Nike' },
    { name: "Levi's", logo: '/images/levis.png', label: "Levi's" },
    { name: 'Samsung', logo: '/images/samsung.png', label: 'Samsung' },
    { name: 'Sony', logo: '/images/sony.png', label: 'Sony' },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Carousel */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-gray-900 via-indigo-950 to-slate-900 text-white flex items-center">
          {sliderItems.map((item, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-12 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="md:w-1/2 space-y-4 text-center md:text-left z-10">
                <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
                  Featured Deal
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  {item.ad}
                </h2>
                <p className="text-gray-300 text-xs md:text-sm line-clamp-2">
                  {item.name}
                </p>
                <div>
                  <Link
                    to={`/product/${encodeURIComponent(item.name)}`}
                    className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition transform"
                  >
                    Shop Now <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>

              <div className="md:w-1/2 h-full flex items-center justify-center p-4">
                <img
                  src={item.img}
                  alt={item.name}
                  className="max-h-48 md:max-h-72 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] transform hover:scale-105 transition duration-500"
                />
              </div>
            </div>
          ))}

          {/* Slider Prev / Next Controls */}
          <button
            onClick={() => setCurrentSlide((currentSlide - 1 + sliderItems.length) % sliderItems.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            onClick={() => setCurrentSlide((currentSlide + 1) % sliderItems.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition"
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {sliderItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-8 bg-yellow-400' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cyberpunk Futuristic Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
              Welcome to the Future of Shopping
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
              Explore thousands of curated products from top tier global brands with AI-powered recommendations and lightning-fast checkout.
            </p>
            <div>
              <Link
                to="/explore"
                className="inline-block bg-white text-indigo-900 font-extrabold px-8 py-3 rounded-full hover:bg-yellow-300 transition shadow-lg transform hover:-translate-y-0.5"
              >
                Explore All Products <i className="fas fa-compass ml-2"></i>
              </Link>
            </div>
          </div>
          {/* Ambient background glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <i className="fas fa-layer-group text-indigo-600"></i>
            Shop By Category
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group hover:-translate-y-1 flex flex-col items-center justify-center"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${cat.bg} text-white flex items-center justify-center text-xl shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <span className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="recom-header flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow text-white mb-6">
          <div className="flex items-center space-x-3">
            <i className="fas fa-magic text-2xl text-yellow-300"></i>
            <h2 className="text-xl md:text-2xl font-bold">
              Recommended For You
            </h2>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleClearRecs}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm transition"
              title="Reset recommendation algorithm"
            >
              Clear History
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {recommendations.slice(0, 8).map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </section>

      {/* Trending Brands Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="trending-header flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow text-white mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <i className="fas fa-fire text-yellow-300"></i>
            Trending Brands
          </h2>
          <Link
            to="/trending"
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-full shadow transition"
          >
            See All Brands <i className="fas fa-arrow-right ml-1"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 justify-items-center">
          {featuredBrands.map((brand, idx) => (
            <Link
              key={idx}
              to={`/brand/${encodeURIComponent(brand.name)}`}
              className="Tre-product-card bg-white shadow-md hover:shadow-2xl transition group relative cursor-pointer"
              title={`View ${brand.name} products`}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <span className="text-lg font-extrabold text-gray-800 group-hover:text-purple-600 transition tracking-wide">
                  {brand.label}
                </span>
                <span className="text-xs text-gray-400 mt-1 uppercase font-semibold">Explore</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

