// client/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-white tracking-tight">
              <i className="fas fa-atom text-cyan-400"></i>
              <span className="bg-gradient-to-r from-white via-indigo-200 to-yellow-300 bg-clip-text text-transparent">
                NexsusMarket
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Your next-generation shopping destination powered by intelligent recommendations and seamless experience. Discover premium electronics, mobiles, fashion, and home appliances.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-600 transition">
                <i className="fab fa-facebook-f text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-cyan-500 transition">
                <i className="fab fa-twitter text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-pink-600 transition">
                <i className="fab fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-700 transition">
                <i className="fab fa-linkedin-in text-sm"></i>
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/electronics" className="hover:text-white transition">Electronics</Link></li>
              <li><Link to="/category/mobiles" className="hover:text-white transition">Smartphones</Link></li>
              <li><Link to="/category/laptops" className="hover:text-white transition">Laptops & PC</Link></li>
              <li><Link to="/category/fashion" className="hover:text-white transition">Fashion</Link></li>
              <li><Link to="/category/home" className="hover:text-white transition">Home & Appliances</Link></li>
              <li><Link to="/deals" className="text-yellow-400 font-semibold hover:text-yellow-300 transition">Top Deals 🔥</Link></li>
            </ul>
          </div>

          {/* Customer Service & Help */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Help & Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/support" className="hover:text-white transition">Customer Service</Link></li>
              <li><Link to="/orders" className="hover:text-white transition">Track Orders</Link></li>
              <li><Link to="/delivered" className="hover:text-white transition">Delivered Items</Link></li>
              <li><Link to="/address" className="hover:text-white transition">Manage Addresses</Link></li>
              <li><Link to="/profile" className="hover:text-white transition">Account Settings</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/explore" className="hover:text-white transition">All Products</Link></li>
              <li><Link to="/trending" className="hover:text-white transition">Trending Brands</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition">My Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Shopping Cart</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} NexsusMarket. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-gray-400 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

