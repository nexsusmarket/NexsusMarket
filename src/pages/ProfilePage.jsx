// client/src/pages/ProfilePage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { userData, userName, wishlistCount, cartCount, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <Link to="/signin" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const ordersCount = (userData?.orders || []).length;

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-white/50 overflow-hidden mb-10 relative animate-card">
        <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 space-y-4 md:space-y-0 md:space-x-6 relative z-10">
          <div className="relative">
            <div className="relative group w-32 h-32 transition-all duration-300 transform hover:scale-105">
              <div className="w-full h-full bg-white p-1 rounded-full shadow-lg relative z-10 overflow-hidden">
                <div id="profile-placeholder" className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-5xl">
                  <i className="fas fa-user"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left flex-1 mb-2">
            <h1 className="text-3xl font-bold text-gray-900" id="profile-welcome-header">
              Welcome Back{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-gray-500">Manage your digital life at NexsusMarket</p>
          </div>

          <div className="flex space-x-8 text-center bg-gray-50/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-100">
            <div>
              <span className="block text-xl font-bold text-indigo-600">{ordersCount}</span>
              <span className="text-xs font-medium text-gray-500">Orders</span>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <span className="block text-xl font-bold text-purple-600">{wishlistCount}</span>
              <span className="text-xs font-medium text-gray-500">Wishlist</span>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <span className="block text-xl font-bold text-pink-600">{cartCount}</span>
              <span className="text-xs font-medium text-gray-500">In Cart</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/orders"
          className="group animate-card delay-1 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-box"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Your Orders</h3>
              <p className="text-sm text-gray-500 font-medium">Track, return, or buy again</p>
            </div>
          </div>
        </Link>

        <Link
          to="/wishlist"
          className="group animate-card delay-2 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center text-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-heart"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-500 transition-colors">Wishlist</h3>
              <p className="text-sm text-gray-500 font-medium">Your saved products</p>
            </div>
          </div>
        </Link>

        <Link
          to="/cart"
          className="group animate-card delay-3 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Shopping Cart</h3>
              <p className="text-sm text-gray-500 font-medium">View items ready to buy</p>
            </div>
          </div>
        </Link>

        <Link
          to="/delivered"
          className="group animate-card delay-4 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-check-circle"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Delivered Items</h3>
              <p className="text-sm text-gray-500 font-medium">History & invoices</p>
            </div>
          </div>
        </Link>

        <Link
          to="/address"
          className="group animate-card delay-5 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors">Addresses</h3>
              <p className="text-sm text-gray-500 font-medium">Delivery locations</p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full text-left group animate-card delay-6 relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center text-2xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-sm">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-500 transition-colors">Logout</h3>
              <p className="text-sm text-gray-500 font-medium">Sign out securely</p>
            </div>
          </div>
        </button>
      </div>
    </main>
  );
}
