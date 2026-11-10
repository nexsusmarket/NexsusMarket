// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  fetchUserData, 
  updateWishlist as apiUpdateWishlist, 
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
  postViewedItem as apiPostViewedItem
} from '../api/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('userAuthToken') || null);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState({ show: false, message: '', isError: false });
  const [aiOverlayOpen, setAiOverlayOpen] = useState(false);

  const showToast = useCallback((message, isError = false) => {
    setToastInfo({ show: true, message, isError });
    setTimeout(() => {
      setToastInfo(prev => ({ ...prev, show: false }));
    }, 3200);
  }, []);

  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem('userAuthToken');
    if (!token) {
      setUserData(null);
      return null;
    }
    try {
      setLoading(true);
      const data = await fetchUserData();
      setUserData(data);
      localStorage.setItem('wishlistProducts', JSON.stringify(data.wishlist || []));
      localStorage.setItem('cartProducts', JSON.stringify(data.cart || []));
      return data;
    } catch (err) {
      console.warn('Failed to fetch user data:', err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      refreshUserData();
    } else {
      setUserData(null);
    }
  }, [authToken, refreshUserData]);

  const login = (token, name) => {
    localStorage.setItem('userAuthToken', token);
    localStorage.setItem('userName', name);
    setAuthToken(token);
    setUserName(name);
    refreshUserData();
  };

  const logout = () => {
    localStorage.clear();
    setAuthToken(null);
    setUserName(null);
    setUserData(null);
  };

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('userAuthToken');
    if (token) return true;
    setLoginModalOpen(true);
    return false;
  }, []);

  const addToWishlist = async (product) => {
    if (!checkAuth()) return false;
    try {
      await apiUpdateWishlist(product);
      await refreshUserData();
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  };

  const addToCart = async (product) => {
    if (!checkAuth()) return false;
    try {
      await apiAddToCart(product);
      await refreshUserData();
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  };

  const updateCartQty = async (productName, qty) => {
    if (!checkAuth()) return false;
    try {
      await apiUpdateCartQuantity(productName, qty);
      await refreshUserData();
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  };

  const removeFromCart = async (productName) => {
    if (!checkAuth()) return false;
    try {
      await apiRemoveFromCart(productName);
      await refreshUserData();
      showToast('Item removed from cart');
      return true;
    } catch (err) {
      showToast(err.message, true);
      return false;
    }
  };

  const recordViewedItem = (product) => {
    if (authToken && product) {
      apiPostViewedItem(product);
    }
  };

  const wishlistCount = userData?.wishlist?.length || 0;
  const cartCount = userData?.cart?.length || 0;

  return (
    <AuthContext.Provider value={{
      isLoggedIn: !!authToken,
      authToken,
      userName,
      userData,
      loading,
      wishlistCount,
      cartCount,
      login,
      logout,
      checkAuth,
      refreshUserData,
      addToWishlist,
      addToCart,
      updateCartQty,
      removeFromCart,
      recordViewedItem,
      loginModalOpen,
      setLoginModalOpen,
      toastInfo,
      showToast,
      aiOverlayOpen,
      setAiOverlayOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

