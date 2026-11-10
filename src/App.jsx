// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import LoginPromptModal from './components/LoginPromptModal';
import AIAssistantModal from './components/AIAssistantModal';

// Pages
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import CartPage from './pages/CartPage';
import DetailPage from './pages/DetailPage';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import OrderPage from './pages/OrderPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import AddressPage from './pages/AddressPage';
import AllTrendingPage from './pages/AllTrendingPage';
import BrandPage from './pages/BrandPage';
import CategoryPage from './pages/CategoryPage';
import CustomerServicePage from './pages/CustomerServicePage';
import DeliveredPage from './pages/DeliveredPage';
import ExplorePage from './pages/ExplorePage';
import TopDealsPage from './pages/TopDealsPage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-800">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:name" element={<DetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/address" element={<AddressPage />} />
          <Route path="/trending" element={<AllTrendingPage />} />
          <Route path="/brand/:name" element={<BrandPage />} />
          <Route path="/category/:name" element={<CategoryPage />} />
          <Route path="/support" element={<CustomerServicePage />} />
          <Route path="/delivered" element={<DeliveredPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/deals" element={<TopDealsPage />} />

          {/* Backward compatibility with .html extensions */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/signin.html" element={<Navigate to="/signin" replace />} />
          <Route path="/cart.html" element={<Navigate to="/cart" replace />} />
          <Route path="/detail.html" element={<DetailPage />} />
          <Route path="/search.html" element={<SearchPage />} />
          <Route path="/wishlist.html" element={<Navigate to="/wishlist" replace />} />
          <Route path="/order.html" element={<Navigate to="/orders" replace />} />
          <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
          <Route path="/checkout.html" element={<Navigate to="/checkout" replace />} />
          <Route path="/address.html" element={<Navigate to="/address" replace />} />
          <Route path="/allTrending.html" element={<Navigate to="/trending" replace />} />
          <Route path="/brand.html" element={<BrandPage />} />
          <Route path="/category.html" element={<CategoryPage />} />
          <Route path="/customer-service.html" element={<Navigate to="/support" replace />} />
          <Route path="/delivered.html" element={<Navigate to="/delivered" replace />} />
          <Route path="/explore.html" element={<Navigate to="/explore" replace />} />
          <Route path="/topDeals.html" element={<Navigate to="/deals" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <Toast />
      <LoginPromptModal />
      <AIAssistantModal />
    </div>
  );
}

