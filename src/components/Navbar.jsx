// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, userName, userData, wishlistCount, cartCount, logout, setAiOverlayOpen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      localStorage.setItem('lastSearch', searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const categories = [
    { label: 'Electronics', path: '/category/electronics' },
    { label: 'Home & Appliances', path: '/category/homeappliances' },
    { label: 'Mobiles', path: '/category/mobile' },
    { label: 'Fashion', path: '/category/fashion' },
    { label: 'Laptops', path: '/category/laptop' },
    { label: 'Grocery', path: '/category/grocery' },
    { label: 'Top Deals', path: '/deals' },
  ];

  const isCurrentActive = (catPath) => {
    if (location.pathname === catPath) return true;
    if (location.pathname === '/category' && location.search.includes(catPath.replace('/category/', ''))) return true;
    if (catPath === '/deals' && (location.pathname === '/deals' || location.pathname === '/topDeals.html')) return true;
    return false;
  };

  return (
    <header className="gradient-bg text-white shadow-lg sticky-header z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <i className="fas fa-atom logo-spin"></i>
            </div>
            <Link to="/" className="text-2xl font-bold tracking-tight">
              NexsusMarket
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                id="searchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full py-2 px-4 rounded-full text-gray-800 focus:outline-none search-bar"
              />
              <button
                id="searchBtn"
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-yellow-400 text-gray-800 rounded-r-full hover:bg-yellow-500 transition"
                aria-label="Search"
              >
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>

          {/* Right Navigation */}
          <nav id="main-navigation" className="flex items-center space-x-6">
            <div className="flex items-center">
              {/* AI Trigger */}
              <button
                id="nex-trigger"
                type="button"
                className="header-ai-trigger"
                title="Ask NEX AI"
                onClick={() => setAiOverlayOpen(true)}
              >
                <i className="fas fa-microphone"></i>
              </button>

              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    id="account-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-white/10 transition"
                  >
                    {userData?.profileImage ? (
                      <img
                        src={userData.profileImage}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-white/50"
                      />
                    ) : (
                      <i className="fas fa-user-circle text-2xl"></i>
                    )}
                    <span className="font-semibold text-sm">Account</span>
                  </div>

                  {dropdownOpen && (
                    <div id="account-menu" className="absolute right-0 account-dropdown-menu-glass z-50">
                      <div className="glass-background-blur"></div>
                      <div className="dropdown-content-layer">
                        <div className="flex items-center space-x-3 px-4 py-3 border-b border-black/10 text-black">
                          {userData?.profileImage && (
                            <img
                              src={userData.profileImage}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover border border-black/20 flex-shrink-0"
                            />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs text-black leading-tight">Hello,</p>
                            <p className="font-bold text-md truncate text-black leading-snug">{userName || 'User'}</p>
                          </div>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <i className="fas fa-user-circle w-6 mr-2"></i>
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <i className="fas fa-box-open w-6 mr-2"></i>
                            <span>My Orders</span>
                          </Link>
                          <Link
                            to="/delivered"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <i className="fas fa-check-circle w-6 mr-2"></i>
                            <span>Delivered Items</span>
                          </Link>

                          <Link
                            to="/wishlist"
                            onClick={() => setDropdownOpen(false)}
                            className="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <span className="flex items-center">
                              <i className="fas fa-heart w-6 mr-2"></i>My Wishlist
                            </span>
                            <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          </Link>

                          <Link
                            to="/cart"
                            onClick={() => setDropdownOpen(false)}
                            className="flex justify-between items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <span className="flex items-center">
                              <i className="fas fa-shopping-cart w-6 mr-2"></i>My Cart
                            </span>
                            <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {cartCount}
                            </span>
                          </Link>

                          <hr className="my-1 border-white/20" />

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              logout();
                              navigate('/signin');
                            }}
                            className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-white/10 rounded-md text-white"
                          >
                            <i className="fas fa-sign-out-alt w-6 mr-2"></i>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="hidden md:block bg-white text-purple-700 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-100 transition mr-4"
                  >
                    Login
                  </Link>

                  <Link
                    to="/wishlist"
                    id="header-wishlist-icon"
                    className="relative hover:text-yellow-300 transition nav-link mr-4"
                    title="Wishlist"
                  >
                    <i className="fas fa-heart text-2xl"></i>
                    <span className="wishlist-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  </Link>

                  <Link
                    to="/cart"
                    id="header-cart-icon"
                    className="relative hover:text-yellow-300 transition nav-link"
                    title="Cart"
                  >
                    <i className="fas fa-shopping-cart text-2xl"></i>
                    <span className="cart-counter absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NexsusMarket"
              className="w-full py-2 px-4 rounded-full text-gray-800 focus:outline-none search-bar"
            />
            <button type="submit" className="absolute right-0 top-0 h-full px-4 text-gray-800">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>

        {/* Category Navigation Bar */}
        <div className="hidden md:flex items-center space-x-8 mt-4 pb-1 text-sm font-medium overflow-x-auto opacity-90">
          {categories.map((cat) => {
            const active = isCurrentActive(cat.path);
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className={`nav-item transition ${
                  active
                    ? 'text-yellow-300 font-bold border-b-2 border-yellow-300 pb-0.5'
                    : 'text-white hover:text-yellow-300'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
