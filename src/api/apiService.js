// client/src/api/apiService.js

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

export const BASE_URL = isLocal ? 'http://localhost:3000' : 'https://nexsusmarket.onrender.com';
export const API_URL = `${BASE_URL}/api/user`;
export const AUTH_URL = BASE_URL;

export function getAuthHeaders() {
  const token = localStorage.getItem('userAuthToken') || '';
  return {
    'Content-Type': 'application/json',
    'x-phone': token
  };
}

export function getFullProduct(product) {
  if (!product || !product.name) return null;
  return product;
}

// --- AUTHENTICATION FUNCTIONS ---

export async function sendSignupOtp({ name, phone, email }) {
  const response = await fetch(`${AUTH_URL}/signup/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error sending OTP');
  return data;
}

export async function createAccount({ name, phone, email, password, otp }) {
  const response = await fetch(`${AUTH_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password, otp }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error creating account');
  return data;
}

export async function signIn({ identifier, password }) {
  const response = await fetch(`${AUTH_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${AUTH_URL}/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error requesting password reset');
  return data;
}

export async function verifyOtp(email, otp) {
  const response = await fetch(`${AUTH_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error verifying OTP');
  return data;
}

export async function verifyOtpAndReset({ email, otp, newPassword }) {
  const response = await fetch(`${AUTH_URL}/verify-otp-and-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error resetting password');
  return data;
}

// --- USER DATA & ACTIONS ---

export async function fetchUserData() {
  const response = await fetch(`${API_URL}/data`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Could not fetch user data');
  }
  return await response.json();
}

export async function updateWishlist(product) {
  const fullProduct = getFullProduct(product);
  if (!fullProduct) return;
  const response = await fetch(`${API_URL}/wishlist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ product: fullProduct })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update wishlist');
  return data;
}

export async function addToCart(product) {
  const fullProduct = getFullProduct(product);
  if (!fullProduct) return;
  const response = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ product: fullProduct })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to add to cart');
  return data;
}

export async function updateCartQuantity(productName, newQuantity) {
  const response = await fetch(`${API_URL}/cart/quantity`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productName, newQuantity })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update quantity');
  return data;
}

export async function removeFromCart(productName) {
  const response = await fetch(`${API_URL}/cart/remove`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productName })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to remove from cart');
  return data;
}

export async function updateCartOffer(productName, offerId, accountNumber) {
  const response = await fetch(`${API_URL}/cart/offer`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productName, offerId, accountNumber })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update offer');
  return data;
}

export async function requestDiscountCode(studentEmail, productName) {
  const response = await fetch(`${API_URL}/request-discount-code`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentEmail, productName })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to request discount code');
  return data;
}

export async function verifyDiscountCode(verificationCode, productName) {
  const response = await fetch(`${API_URL}/verify-discount-code`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ verificationCode, productName })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to verify code');
  return data;
}

export async function updateAddress(address) {
  const response = await fetch(`${API_URL}/address`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ address })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update address');
  return data;
}

export async function placeOrder(order) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ order })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to place order');
  return data;
}

export async function cancelOrder(orderId) {
  const response = await fetch(`${API_URL}/orders/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to cancel order');
  return data;
}

export async function fetchSingleOrder(orderId) {
  const response = await fetch(`${API_URL}/order/${orderId}`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch order details');
  return data;
}

export async function requestReturnOtp(itemId, reason) {
  const response = await fetch(`${API_URL}/returns/request-otp`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId, reason })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to request OTP');
  return data;
}

export async function finalizeReturn(itemId, otp) {
  const response = await fetch(`${API_URL}/returns/finalize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId, otp })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to finalize return');
  return data;
}

export async function submitReview(reviewData) {
  const response = await fetch(`${API_URL}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(reviewData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit review');
  return data;
}

export async function fetchProductReviews(productName) {
  const response = await fetch(`${BASE_URL}/api/product/reviews?productName=${encodeURIComponent(productName)}`);
  if (!response.ok) return { reviews: [], average: 0, totalReviews: 0 };
  return await response.json();
}

export async function postViewedItem(product) {
  const fullProduct = getFullProduct(product);
  if (!fullProduct) return;
  try {
    const response = await fetch(`${API_URL}/viewed`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product: fullProduct })
    });
    return await response.json();
  } catch (err) {
    // Non-blocking
  }
}

export async function clearRecommendations() {
  const response = await fetch(`${API_URL}/recommendations`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to clear recommendations');
  return data;
}

export async function updateProfileImage(base64Image) {
  const response = await fetch(`${API_URL}/profile-image`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ image: base64Image })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update profile image');
  return data;
}

export async function deleteProfileImage() {
  const response = await fetch(`${API_URL}/profile-image`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to remove profile image');
  return data;
}

export async function sendSupportTicket(category, message) {
  const response = await fetch(`${API_URL}/contact-support`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, message })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send message');
  return data;
}

