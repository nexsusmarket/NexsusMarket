// client/src/pages/TopDealsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productsData from '../data/products.json';

// Deterministic Cycle generator from topDeals.js
function getCurrentDealCycle() {
  const msPerDay = 1000 * 60 * 60 * 24;
  const cycleDurationDays = 14;
  const startTime = new Date('2024-01-01').getTime();
  const currentTime = new Date().getTime();
  const cycleId = Math.floor((currentTime - startTime) / (msPerDay * cycleDurationDays));
  const nextCycleStart = startTime + ((cycleId + 1) * cycleDurationDays * msPerDay);
  const endDate = new Date(nextCycleStart);
  return { cycleId, endDate };
}

function seededRandom(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function shuffleWithSeed(array, seed) {
  let m = array.length, t, i;
  let newArray = [...array];
  while (m) {
    let r = seededRandom(seed + m);
    i = Math.floor(r * m--);
    t = newArray[m];
    newArray[m] = newArray[i];
    newArray[i] = t;
  }
  return newArray;
}

function generateStableDeals(allProducts) {
  if (!allProducts || allProducts.length === 0) return [];
  const { cycleId } = getCurrentDealCycle();

  const highPriorityCats = ['mobile', 'mobiles', 'laptop', 'laptops', 'electronics', 'electronic'];
  const priorityItems = [];
  const normalItems = [];

  allProducts.forEach(p => {
    const cat = (p.category || 'other').toLowerCase().trim();
    if (highPriorityCats.some(hp => cat.includes(hp))) {
      priorityItems.push(p);
    } else {
      normalItems.push(p);
    }
  });

  const shuffledPriority = shuffleWithSeed(priorityItems, cycleId);
  const shuffledNormal = shuffleWithSeed(normalItems, cycleId + 500);

  const selectedPriority = shuffledPriority.slice(0, 14);
  const selectedNormal = shuffledNormal.slice(0, 6);
  let finalSelection = [...selectedPriority, ...selectedNormal];

  if (finalSelection.length < 20) {
    const extra = shuffledNormal.slice(6, 6 + (20 - finalSelection.length));
    finalSelection = [...finalSelection, ...extra];
  }

  finalSelection = shuffleWithSeed(finalSelection, cycleId + 999);

  return finalSelection.map((product, index) => {
    const itemSeed = cycleId + index;
    const discountMultiplier = 0.5 + (seededRandom(itemSeed) * 0.3); // 50% - 80% of MRP
    const originalPrice = product.price;
    const calculatedDealPrice = Math.round(originalPrice * discountMultiplier);
    const calculatedMrp = Math.round(originalPrice * 1.25);
    const finalDealPrice = Math.min(calculatedDealPrice, originalPrice);
    const discountPercentage = Math.round(((calculatedMrp - finalDealPrice) / calculatedMrp) * 100);

    return {
      ...product,
      dealPrice: finalDealPrice,
      mrpPrice: calculatedMrp,
      discountText: `${discountPercentage}% OFF`
    };
  });
}

export default function TopDealsPage() {
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);

  useEffect(() => {
    const stableDeals = generateStableDeals(productsData);
    setDeals(stableDeals);
  }, []);

  const handleCardClick = (item) => {
    recordViewedItem({
      name: item.name,
      image: item.image,
      price: item.dealPrice,
      category: item.category
    });
    navigate(`/detail.html?name=${encodeURIComponent(item.name)}&dealPrice=${item.dealPrice}`);
  };

  const handleWishlistClick = async (e, item) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    const success = await addToWishlist({
      name: item.name,
      image: item.image,
      price: item.dealPrice,
      category: item.category
    });
    if (success) {
      showToast('Wishlist updated');
    }
  };

  const handleAddToCartClick = async (e, item) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    const success = await addToCart({
      name: item.name,
      image: item.image,
      price: item.dealPrice,
      category: item.category
    });
    if (success) {
      showToast('Added to cart!');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-10 text-center relative">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Deals</span>
        </h1>
        <p className="text-gray-500 text-lg">Handpicked offers just for you. Limited time only.</p>
      </div>

      {/* Deals Grid */}
      <section className="top-product-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {deals.map((item, idx) => {
          const isWished = (userData?.wishlist || []).some(w => w && w.name === item.name);
          const inCart = (userData?.cart || []).some(c => c && c.name === item.name);

          return (
            <article
              key={idx}
              className="deal-card flex flex-col bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 relative group border border-gray-100"
              data-name={encodeURIComponent(item.name)}
            >
              {/* Product Image Box */}
              <div
                className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center p-4 cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                  {item.discountText}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleWishlistClick(e, item)}
                  className="wishlist-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all z-10"
                  title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <i className={`${isWished ? 'fas fa-heart text-red-500' : 'far fa-heart'}`}></i>
                </button>

                <img
                  src={item.image}
                  alt={item.name}
                  className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Meta & Actions */}
              <div className="flex flex-col flex-grow">
                <div className="text-[11px] font-bold tracking-wider text-purple-600 uppercase mb-1">
                  {item.category || 'Deal'}
                </div>

                <h3
                  onClick={() => handleCardClick(item)}
                  className="font-bold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors cursor-pointer"
                  title={item.name}
                >
                  {item.name}
                </h3>

                <div className="deal-price-row flex items-baseline gap-2 mb-4 mt-auto">
                  <span className="current-price text-xl font-bold text-gray-900">
                    ₹{item.dealPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="old-price text-xs text-gray-400 line-through">
                    ₹{item.mrpPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                {inCart ? (
                  <Link
                    to="/cart"
                    className="deal-cart-btn added w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-green-100 text-green-700"
                  >
                    <i className="fas fa-check"></i> <span>Go to Cart</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleAddToCartClick(e, item)}
                    className="action-cart-btn w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-gray-900 text-white hover:bg-purple-600"
                  >
                    <i className="fas fa-shopping-cart"></i> <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
