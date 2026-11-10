// client/src/pages/AddressPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateAddress as apiUpdateAddress } from '../api/apiService';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

export default function AddressPage() {
  const { userData, refreshUserData, showToast } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [addressText, setAddressText] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const saved = userData?.address || JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (saved) {
      if (saved.name) setName(saved.name);
      if (saved.mobile) setMobile(saved.mobile);
      if (saved.pincode) setPincode(saved.pincode);
      if (saved.city) setCity(saved.city);
      if (saved.address) setAddressText(saved.address);
      if (saved.state) setState(saved.state);
    }
  }, [userData]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setPincode(addr.postcode || '');
            setCity(addr.city || addr.town || addr.village || '');
            setState(addr.state || '');
            setAddressText(`${addr.suburb || ''} ${addr.road || ''}`.trim());
            showToast('Location fetched successfully!');
          }
        } catch (err) {
          showToast('Could not fetch address details', true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        showToast('Location access denied', true);
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile.trim())) {
      showToast('Please enter a valid 10-digit mobile number', true);
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      showToast('Please enter a valid 6-digit pincode', true);
      return;
    }

    setLoading(true);
    const newAddress = {
      name: name.trim(),
      mobile: mobile.trim(),
      pincode: pincode.trim(),
      city: city.trim(),
      address: addressText.trim(),
      state: state.trim()
    };

    try {
      await apiUpdateAddress(newAddress);
      localStorage.setItem('deliveryAddress', JSON.stringify(newAddress));
      await refreshUserData();
      showToast('Address saved successfully!');
      navigate(-1);
    } catch (err) {
      showToast(err.message || 'Error saving address', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Edit Your Address</h1>

        <div className="mb-6">
          <button
            type="button"
            id="use-location-btn"
            onClick={handleUseLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"
          >
            <i className="fas fa-location-arrow"></i>
            <span>{locating ? 'Detecting Location...' : 'Use My Current Location'}</span>
          </button>
        </div>

        <form id="address-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              id="name-input"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-md"
            />
            <input
              type="tel"
              id="mobile-input"
              placeholder="10-digit Mobile Number"
              required
              pattern="[0-9]{10}"
              maxLength="10"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full p-3 border rounded-md"
            />
            <input
              type="text"
              id="pincode-input"
              placeholder="Pincode"
              required
              pattern="[0-9]{6}"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full p-3 border rounded-md"
            />
            <input
              type="text"
              id="city-input"
              placeholder="City / Town"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 border rounded-md"
            />
          </div>

          <textarea
            id="address-textarea"
            placeholder="Address (Area, Street, House No.)"
            required
            rows="3"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            className="w-full p-3 border rounded-md"
          ></textarea>

          <input
            type="text"
            id="state-input"
            list="states-list"
            placeholder="State"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full p-3 border rounded-md"
          />
          <datalist id="states-list">
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-md font-bold hover:bg-purple-700 transition"
          >
            {loading ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      </div>
    </main>
  );
}
