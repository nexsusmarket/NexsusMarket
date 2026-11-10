// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, userName, wishlistCount, cartCount, logout, setAiOverlayOpen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category navigation items
  const categories = [
    { label: 'Electronics', path: '/category/electronics' },
    { label: 'Home & Appliances', path: '/category/home' },
    { label: 'Mobiles', path: '/category/mobiles' },
    { label: 'Fashion', path: '/category/fashion' },
    { label: 'Laptops', path: '/category/laptops' },
    { label: 'Grocery', path: '/category/grocery' },
    { label: 'Top Deals', path: '/deals' },
  ];

  const isCurrentActive = (catPath) => {
    return location.pathname === catPath || location.pathname + location.search === catPath;
  };

  return (
    <header className="sticky top-0 z-50 gradient-bg text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight hover:opacity-90 transition">
            <i className="fas fa-atom text-2xl logo-spin text-cyan-300"></i>
            <span className="bg-gradient-to-r from-white via-indigo-100 to-yellow-200 bg-clip-text text-transparent">
              NexsusMarket
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands and more..."
              className="w-full bg-white text-gray-800 rounded-full pl-5 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              <i className="fas fa-search text-xs"></i>
            </button>
          </form>

          {/* Right Navigation */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden text-xl p-2 hover:text-yellow-300 transition"
              title="Search"
            >
              <i className="fas fa-search"></i>
            </button>

            {/* AI Assistant Mic Button */}
            <button
              onClick={() => setAiOverlayOpen(true)}
              className="header-ai-trigger"
              title="Ask NEX AI"
            >
              <i className="fas fa-microphone"></i>
            </button>

            {isLoggedIn ? (
              /* Logged In: Account Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <i className="fas fa-user-circle text-2xl text-yellow-300"></i>
                  <span className="font-semibold text-sm max-w-[120px] truncate hidden sm:inline">
                    {userName || 'Account'}
                  </span>
                  <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 text-gray-800 overflow-hidden z-50 animate-fadeIn">
                    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <p className="text-xs text-indigo-100">Welcome back,</p>
                      <p className="font-bold text-base truncate">{userName}</p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-700 transition"
                      >
                        <i className="fas fa-user-circle w-6 text-indigo-500"></i>
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-700 transition"
                      >
                        <i className="fas fa-box-open w-6 text-indigo-500"></i>
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/delivered"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-700 transition"
                      >
                        <i className="fas fa-check-circle w-6 text-green-500"></i>
                        <span>Delivered Items</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-700 transition"
                      >
                        <div className="flex items-center">
                          <i className="fas fa-heart w-6 text-red-500"></i>
                          <span>My Wishlist</span>
                        </div>
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {wishlistCount}
                        </span>
                      </Link>

                      <Link
                        to="/cart"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 text-gray-700 transition"
                      >
                        <div className="flex items-center">
                          <i className="fas fa-shopping-cart w-6 text-indigo-600"></i>
                          <span>My Cart</span>
                        </div>
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      </Link>

                      <hr className="my-1 border-gray-100" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/signin');
                        }}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <i className="fas fa-sign-out-alt w-6"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged Out State */
              <div className="flex items-center space-x-3">
                <Link
                  to="/signin"
                  className="bg-white text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-yellow-300 hover:text-gray-900 shadow transition"
                >
                  Login
                </Link>

                <Link
                  to="/wishlist"
                  className="relative p-2 hover:text-yellow-300 transition"
                  title="Wishlist"
                >
                  <i className="fas fa-heart text-xl"></i>
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                    0
                  </span>
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 hover:text-yellow-300 transition"
                  title="Cart"
                >
                  <i className="fas fa-shopping-cart text-xl"></i>
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                    0
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white text-gray-800 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none shadow"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                <i className="fas fa-search text-xs"></i>
              </button>
            </div>
          </form>
        )}

        {/* Categories Bar */}
        <nav className="flex items-center space-x-6 pb-2 overflow-x-auto text-sm scrollbar-none">
          {categories.map((cat) => {
            const active = isCurrentActive(cat.path);
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className={`whitespace-nowrap transition-all duration-200 py-1 ${
                  active
                    ? 'text-yellow-300 font-bold border-b-2 border-yellow-300 pb-0.5'
                    : 'text-white/90 hover:text-yellow-300'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

