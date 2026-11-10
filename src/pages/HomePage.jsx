// client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import productsData from '../data/products.json';
import { clearRecommendations as apiClearRecommendations } from '../api/apiService';

export default function HomePage() {
  const { userData, isLoggedIn, login, refreshUserData, showToast } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle Magic Link token authentication
  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    if (token && name) {
      login(token, name);
      searchParams.delete('token');
      searchParams.delete('name');
      setSearchParams(searchParams);
      showToast(`Welcome back, ${name}!`);
    }
  }, [searchParams, login, setSearchParams, showToast]);

  // Slider items config
  const sliderConfig = [
    {
      name: "Samsung Galaxy S25 Ultra 5G Smartphone with Galaxy AI (Titanium Black, 12GB RAM, 512GB Storage)",
      ad: "Experience Galaxy AI",
      image: "https://m.media-amazon.com/images/I/717Q2swzhBL._AC_UY436_FMwebp_QL65_.jpg"
    },
    {
      name: "Apple 2024 MacBook Pro Laptop with M4 chip with 10‑core CPU and 10‑core GPU",
      ad: "Supercharged by M4",
      image: "https://m.media-amazon.com/images/I/61hpKVB9X2L._AC_UY436_FMwebp_QL65_.jpg"
    },
    {
      name: "Sunfeast YiPPee! Magic Masala, Instant Noodles (Pack of 4), 240g ITC​",
      ad: "Instant Hunger Solution",
      image: "https://m.media-amazon.com/images/I/71x4z0mFq+L._AC_UL480_FMwebp_QL65_.jpg"
    },
    {
      name: "Maroon patta anarkali winter dress women dress",
      ad: "Winter Anarkali Edition",
      image: "https://m.media-amazon.com/images/I/61WfQfN+LTL._AC_UL480_FMwebp_QL65_.jpg"
    }
  ];

  // Map to actual products in products.json if possible, or fallback to config
  const sliderItems = sliderConfig.map(cfg => {
    const p = productsData.find(item => item.name === cfg.name);
    return {
      name: cfg.name,
      adText: cfg.ad,
      image: p ? p.image : cfg.image
    };
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderItems.length]);

  const handleRemoveRecs = async () => {
    try {
      await apiClearRecommendations();
      await refreshUserData();
      showToast('Recommendations cleared');
    } catch (err) {
      showToast('Failed to clear recommendations', true);
    }
  };

  // Recommendations: user recommendations or fallback to sample products
  const recommendations = (userData?.recommendations && userData.recommendations.length > 0)
    ? userData.recommendations
    : productsData.slice(0, 10);

  return (
    <div className="bg-gray-50">
      {/* 1. Advanced Slider Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="relative rounded-lg overflow-hidden shadow-lg slider-container">
          <div
            className="slider flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {sliderItems.map((product, idx) => (
              <div key={idx} className="slide">
                <div
                  className="w-full h-full relative cursor-pointer"
                  onClick={() => navigate(`/detail.html?name=${encodeURIComponent(product.name)}`)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 text-white">
                    <p className="text-yellow-400 font-bold text-2xl drop-shadow-md tracking-wide">
                      {product.adText}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="slider-btn btn-prev absolute top-1/2 left-3 transform -translate-y-1/2"
            onClick={() => setCurrentSlide((currentSlide - 1 + sliderItems.length) % sliderItems.length)}
            aria-label="Previous Slide"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="slider-btn btn-next absolute top-1/2 right-3 transform -translate-y-1/2"
            onClick={() => setCurrentSlide((currentSlide + 1) % sliderItems.length)}
            aria-label="Next Slide"
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          <div className="dots-container absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
            {sliderItems.map((_, idx) => (
              <div
                key={idx}
                className={`dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              >
                <div
                  className="progress-fill"
                  style={{ width: idx === currentSlide ? '100%' : '0%' }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="relative">
        <div className="gradient-bg h-40 md:h-80 flex items-center">
          <div className="container mx-auto px-2 text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fadeIn">
              Welcome to the Future of Shopping
            </h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl animate-fadeIn cotaions" style={{ animationDelay: '0.2s' }}>
              Shop the extraordinary Fashion,Get super cool Gadgets,Top Deals
            </p>
            <Link to="/explore">
              <button
                className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-500 transition animate-fadeIn explore-button"
                style={{ animationDelay: '0.4s' }}
              >
                Explore Now <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </Link>
          </div>
        </div>

        {/* 6 Category Domain Cards Row */}
        <div className="container mx-auto px-4 -mt-10 md:-mt-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Link to="/category/fashion">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-green-600 text-3xl mb-2">
                  <img
                    className="icons"
                    src="https://rukminim2.flixcart.com/fk-p-flap/128/128/image/ec2982e5564fe07c.png?q=100"
                    alt="Fashion"
                  />
                </div>
                <h3 className="font-bold">Fashion</h3>
              </div>
            </Link>

            <Link to="/category/mobile">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-blue-600 text-3xl mb-2">
                  <img
                    className="icons"
                    src="https://rukminim2.flixcart.com/fk-p-flap/128/128/image/cd6aca4f61e8ea95.png?q=100"
                    alt="Mobiles"
                  />
                </div>
                <h1 className="font-bold">Mobiles</h1>
              </div>
            </Link>

            <Link to="/category/homeappliances">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-red-600 text-3xl mb-2">
                  <img
                    className="icons"
                    src="https://rukminim2.flixcart.com/fk-p-flap/128/128/image/febcb9896245caf4.png?q=100"
                    alt="Home Appliances"
                  />
                </div>
                <h3 className="font-bold">Home Appliances</h3>
              </div>
            </Link>

            <Link to="/category/laptop">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-blue-600 text-3xl mb-2">
                  <img
                    className="icons"
                    src="https://rukminim2.flixcart.com/fk-p-flap/128/128/image/4d6b13d5a0e0724a.png?q=100"
                    alt="Laptops"
                  />
                </div>
                <h1 className="font-bold">Laptops</h1>
              </div>
            </Link>

            <Link to="/category/grocery">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-green-600 text-3xl mb-2">
                  <img
                    className="icons"
                    src="https://rukminim2.flixcart.com/fk-p-flap/128/128/image/2ebb95ec20eae8f1.png?q=100"
                    alt="Grocery"
                  />
                </div>
                <h3 className="font-bold">Grocery</h3>
              </div>
            </Link>

            <Link to="/deals">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer text-center">
                <div className="text-red-600 text-3xl mb-2">
                  <img className="icons" src="/images/top_deals.png" alt="Top Deals" />
                </div>
                <h3 className="font-bold">Top Deals</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Recommendations Section */}
      <hr className="my-8" />
      <div className="recom-header" id="recomContainer">
        <h2>Your Recommendations</h2>
        <button id="remove-recs-btn" className="remove" onClick={handleRemoveRecs}>
          Remove
        </button>
      </div>
      <div id="recommendations-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 recomandations">
        {recommendations.map((product, idx) => (
          <ProductCard key={idx} product={product} variant="reco" />
        ))}
      </div>

      {/* 4. Trending Brands Section */}
      <section className="py-12 bg-gray-50">
        <div className="trending-section">
          <div className="trending-header">
            <h2>Trending Brands</h2>
            <Link to="/trending" className="see-all-link">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 place-items-center">
            <Link to="/brand?name=Apple">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-16 object-contain" src="/images/apple.png" alt="Apple" />
                </div>
              </div>
            </Link>

            <Link to="/brand?name=HP">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-16 object-contain" src="/images/hp.png" alt="HP" />
                </div>
              </div>
            </Link>

            <Link to="/brand?name=Nike">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-16 object-contain" src="/images/nike.png" alt="Nike" />
                </div>
              </div>
            </Link>

            <Link to="/brand?name=Levi's">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-16 object-contain" src="/images/levis.png" alt="Levi's" />
                </div>
              </div>
            </Link>

            <Link to="/brand?name=Samsung">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-16 object-contain" src="/images/samsung.png" alt="Samsung" />
                </div>
              </div>
            </Link>

            <Link to="/brand?name=ITC">
              <div className="bg-white rounded-full overflow-hidden shadow-sm transition cursor-pointer Tre-product-card w-48 h-48">
                <div className="flex items-center justify-center">
                  <img className="h-12 object-contain" src="/images/Itc.png" alt="ITC" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
