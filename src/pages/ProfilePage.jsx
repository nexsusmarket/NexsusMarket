// client/src/pages/ProfilePage.jsx
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfileImage as apiUpdateProfileImage, deleteProfileImage as apiDeleteProfileImage } from '../api/apiService';

export default function ProfilePage() {
  const { userData, refreshUserData, logout, isLoggedIn, showToast } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6">Please log in to manage your account details.</p>
        <Link to="/signin" className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full shadow transition">
          Sign In
        </Link>
      </div>
    );
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large. Max 5MB.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        await apiUpdateProfileImage(reader.result);
        await refreshUserData();
        showToast('Profile image updated successfully!');
      } catch (err) {
        showToast(err.message || 'Failed to update image', true);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async () => {
    setUploading(true);
    try {
      await apiDeleteProfileImage();
      await refreshUserData();
      showToast('Profile image removed.');
    } catch (err) {
      showToast(err.message || 'Failed to remove image', true);
    } finally {
      setUploading(false);
    }
  };

  const cards = [
    { title: 'My Orders', desc: 'Track, return, or buy items again', icon: 'fa-box-open', color: 'from-blue-500 to-indigo-600', link: '/orders' },
    { title: 'My Wishlist', desc: 'Your saved favorite items', icon: 'fa-heart', color: 'from-pink-500 to-rose-600', link: '/wishlist' },
    { title: 'Delivered Items', desc: 'Review products & request returns', icon: 'fa-check-circle', color: 'from-emerald-500 to-teal-600', link: '/delivered' },
    { title: 'Shopping Cart', desc: 'View cart and checkout', icon: 'fa-shopping-cart', color: 'from-purple-500 to-indigo-600', link: '/cart' },
    { title: 'Manage Address', desc: 'Edit delivery and billing address', icon: 'fa-map-marked-alt', color: 'from-amber-500 to-orange-600', link: '/address' },
    { title: 'Customer Support', desc: '24/7 dedicated helpdesk', icon: 'fa-headset', color: 'from-cyan-500 to-blue-600', link: '/support' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-28 h-28 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-white/10 flex items-center justify-center text-4xl font-bold">
            {userData?.profileImage ? (
              <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{userData?.name ? userData.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>

          {/* Camera Upload Badge */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white text-indigo-700 shadow-lg flex items-center justify-center hover:scale-110 transition cursor-pointer"
            title="Upload photo"
          >
            <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'} text-sm`}></i>
          </button>

          {/* Delete Photo Button if photo exists */}
          {userData?.profileImage && (
            <button
              onClick={handleDeleteImage}
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white shadow flex items-center justify-center hover:scale-110 transition cursor-pointer"
              title="Remove photo"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {userData?.name || 'Valued Shopper'}
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2">
            <i className="fas fa-envelope text-xs"></i> {userData?.email || 'N/A'}
          </p>
          <p className="text-indigo-200 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2">
            <i className="fas fa-phone text-xs"></i> {userData?.phone || 'N/A'}
          </p>
        </div>

        {/* Rewards Badge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px]">
          <span className="block text-xs uppercase text-indigo-200 font-semibold tracking-wider">Reward Points</span>
          <span className="text-3xl font-black text-yellow-300 mt-1 block">
            {userData?.rewardPoints || 0}
          </span>
          <span className="text-[10px] text-gray-300">Earn 5-50 pts per order</span>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex items-start gap-4 group hover:-translate-y-1"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center text-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {card.desc}
              </p>
            </div>
          </Link>
        ))}

        {/* Logout Card */}
        <div
          onClick={() => {
            logout();
            navigate('/signin');
          }}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100 flex items-start gap-4 group hover:-translate-y-1 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
            <i className="fas fa-sign-out-alt"></i>
          </div>
          <div>
            <h3 className="font-bold text-red-600 group-hover:text-red-700 transition">
              Sign Out
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Log out of your NexsusMarket account safely
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

