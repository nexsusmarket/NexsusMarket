// client/src/pages/DeliveredPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DeliveredPage() {
  const { userData, isLoggedIn, addToCart, showToast } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <Link to="/signin" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const allDeliveredItems = [...(userData?.deliveredItems || [])].sort(
    (a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate)
  );

  const filteredItems = allDeliveredItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group items by Month Year
  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = new Date(item.deliveryDate);
    const monthYear = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(item);
    return groups;
  }, {});

  const handleBuyAgain = async (item) => {
    await addToCart(item);
    showToast('Added to cart!');
    navigate('/cart');
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Your Delivered Items</h1>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            id="search-delivered-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in your items..."
            className="w-full py-2 pl-4 pr-10 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
          <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <div id="delivered-items-container" className="space-y-8 min-h-[50vh]">
        {filteredItems.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <i className="fas fa-box-open text-6xl text-gray-200 mb-6 block"></i>
            <h2 className="text-2xl font-bold text-gray-700">No Delivered Items Yet</h2>
            <p className="text-gray-500 mt-2 mb-8">When you buy something, your delivered items will show up here.</p>
            <Link
              to="/"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-bold transition shadow-lg shadow-purple-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          Object.entries(groupedItems).map(([monthYear, items]) => (
            <section key={monthYear} className="animate-fadeIn">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-700">{monthYear}</h2>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              <div className="space-y-6">
                {items.map((item, idx) => {
                  const formattedDate = new Date(item.deliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                  });
                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 transition hover:shadow-md"
                    >
                      <Link
                        to={`/detail.html?name=${encodeURIComponent(item.name)}`}
                        className="relative w-28 h-28 bg-gray-50 rounded-lg flex items-center justify-center p-2 flex-shrink-0 border border-gray-100 block hover:border-purple-400 transition cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <Link
                              to={`/detail.html?name=${encodeURIComponent(item.name)}`}
                              className="font-bold text-lg text-gray-900 line-clamp-2 hover:text-purple-600 hover:underline transition-colors cursor-pointer"
                            >
                              {item.name}
                            </Link>
                          </div>
                          <p className="text-sm text-green-700 font-semibold mt-2 flex items-center">
                            <i className="fas fa-check-circle mr-2"></i>Delivered on {formattedDate}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 items-center">
                          <button
                            type="button"
                            onClick={() => handleBuyAgain(item)}
                            className="buy-again-btn bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-medium text-sm transition shadow-sm"
                          >
                            <i className="fas fa-redo-alt mr-2"></i>Buy Again
                          </button>
                          <Link
                            to={`/detail.html?name=${encodeURIComponent(item.name)}`}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
                          >
                            <i className="far fa-star mr-2 text-yellow-500"></i>Rate Product
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
