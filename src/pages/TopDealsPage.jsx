// client/src/pages/TopDealsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { topDeals as topDealsData } from '../data/topDealsData';

export default function TopDealsPage() {
  const { userData, addToWishlist, addToCart, recordViewedItem, showToast } = useAuth();
  const navigate = useNavigate();

  // Flatten items
  const deals = topDealsData[0]?.items || [];

  const handleProductClick = (item) => {
    recordViewedItem({
      name: item.name,
      price: item.dealprice,
      image: item.image,
      category: item.category
    });
    navigate(`/product/${encodeURIComponent(item.name)}`);
  };

  const handleAddToCart = async (item, e) => {
    e.stopPropagation();
    const product = {
      name: item.name,
      price: item.dealprice,
      image: item.image,
      category: item.category
    };
    const ok = await addToCart(product);
    if (ok) showToast('Deal item added to cart!');
  };

  const handleWishlist = async (item, e) => {
    e.stopPropagation();
    const product = {
      name: item.name,
      price: item.dealprice,
      image: item.image,
      category: item.category
    };
    await addToWishlist(product);
    showToast('Wishlist updated');
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Cyber Hero Banner */}
        <div className="bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden border border-red-500/30">
          <span className="inline-block bg-white text-red-600 font-black text-xs uppercase px-4 py-1 rounded-full shadow mb-3">
            Limited Time Offers
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg">
            ⚡ Mega Flash Sale & Top Deals
          </h1>
          <p className="text-gray-100 text-sm sm:text-base max-w-xl mx-auto mt-2">
            Unbeatable prices on flagship smartphones, gaming laptops, and high-performance audio. Claim before stock ends!
          </p>
        </div>

        {/* Deals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((item, idx) => {
            const discountPct = Math.round(((item.mrpprice - item.dealprice) / item.mrpprice) * 100);
            const isInWishlist = (userData?.wishlist || []).some(w => w.name === item.name);

            return (
              <div
                key={idx}
                className="bg-[#1f2937] rounded-3xl p-5 border border-gray-700 hover:border-cyan-400 transition-all duration-300 shadow-xl flex flex-col justify-between group hover:-translate-y-1 relative"
              >
                {/* Discount Badge */}
                <span className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-md z-10">
                  {discountPct}% OFF
                </span>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleWishlist(item, e)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-750 flex items-center justify-center text-sm z-10"
                >
                  <i className={`${isInWishlist ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400'}`}></i>
                </button>

                {/* Image */}
                <div 
                  onClick={() => handleProductClick(item)}
                  className="h-48 flex items-center justify-center p-4 bg-white/5 rounded-2xl cursor-pointer mb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
                  />
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    {item.category}
                  </span>

                  <h3
                    onClick={() => handleProductClick(item)}
                    className="font-bold text-sm text-gray-100 hover:text-cyan-300 cursor-pointer line-clamp-2"
                  >
                    {item.name}
                  </h3>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-xl font-black text-white">
                      ₹{item.dealprice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{item.mrpprice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(item, e)}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-bolt text-yellow-300"></i> Claim Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

