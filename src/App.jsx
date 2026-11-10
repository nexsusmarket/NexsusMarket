// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isSignInPage = location.pathname.toLowerCase() === '/signin' || location.pathname.toLowerCase() === '/signin.html';

  return (
    <div className={isSignInPage ? '' : 'flex flex-col min-h-screen bg-gray-50 text-gray-800'}>
      {!isSignInPage && <Navbar />}

      <main className={isSignInPage ? '' : 'flex-1'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/cart" element={<CartPage />} />
          
          {/* Detail routes */}
          <Route path="/product/:name" element={<DetailPage />} />
          <Route path="/detail" element={<DetailPage />} />
          <Route path="/detail.html" element={<DetailPage />} />

          {/* Search routes */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search.html" element={<SearchPage />} />

          {/* Wishlist routes */}
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/wishlist.html" element={<WishlistPage />} />

          {/* Orders routes */}
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/order.html" element={<OrderPage />} />

          {/* Profile routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile.html" element={<ProfilePage />} />

          {/* Checkout routes */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout.html" element={<CheckoutPage />} />

          {/* Address routes */}
          <Route path="/address" element={<AddressPage />} />
          <Route path="/address.html" element={<AddressPage />} />

          {/* Trending routes */}
          <Route path="/trending" element={<AllTrendingPage />} />
          <Route path="/all-trending" element={<AllTrendingPage />} />
          <Route path="/allTrending.html" element={<AllTrendingPage />} />

          {/* Brand routes */}
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/brand/:name" element={<BrandPage />} />
          <Route path="/brand.html" element={<BrandPage />} />

          {/* Category routes */}
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:name" element={<CategoryPage />} />
          <Route path="/category.html" element={<CategoryPage />} />

          {/* Customer Service routes */}
          <Route path="/support" element={<CustomerServicePage />} />
          <Route path="/customer-service" element={<CustomerServicePage />} />
          <Route path="/customer-service.html" element={<CustomerServicePage />} />

          {/* Delivered routes */}
          <Route path="/delivered" element={<DeliveredPage />} />
          <Route path="/delivered.html" element={<DeliveredPage />} />

          {/* Explore routes */}
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore.html" element={<ExplorePage />} />

          {/* Top Deals routes */}
          <Route path="/deals" element={<TopDealsPage />} />
          <Route path="/top-deals" element={<TopDealsPage />} />
          <Route path="/topDeals.html" element={<TopDealsPage />} />

          {/* Legacy index.html */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/signin.html" element={<Navigate to="/signin" replace />} />
          <Route path="/cart.html" element={<Navigate to="/cart" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isSignInPage && <Footer />}
      <Toast />
      {!isSignInPage && <LoginPromptModal />}
      {!isSignInPage && <AIAssistantModal />}
    </div>
  );
}
