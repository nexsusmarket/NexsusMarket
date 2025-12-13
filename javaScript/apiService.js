// javascript/apiService.js

// 1. Import the lookup map.
import { productLookupMap } from './productData.js';

// ==========================================================
// 🧠 SMART SWITCH CONFIGURATION
// ==========================================================

// 1. Define your Local and Live Backend URLs
const LOCAL_BACKEND_URL = 'http://localhost:3000';
// 👇 REPLACE THIS with your actual Render URL after deploying backend
const LIVE_BACKEND_URL = 'https://your-app-name.onrender.com'; 

let CURRENT_BACKEND_URL = '';

// 2. The Logic: Check where the website is running
// If browser URL says "127.0.0.1" or "localhost", we use Local Backend.
// Otherwise (e.g., "netlify.app"), we use Live Backend.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log("🔧 Environment: Localhost detected. Connecting to:", LOCAL_BACKEND_URL);
    CURRENT_BACKEND_URL = LOCAL_BACKEND_URL;
} else {
    console.log("🚀 Environment: Production detected. Connecting to:", LIVE_BACKEND_URL);
    CURRENT_BACKEND_URL = LIVE_BACKEND_URL;
}

const API_URL = `${CURRENT_BACKEND_URL}/api/user`;
const AUTH_URL = CURRENT_BACKEND_URL;

function getAuthHeaders() {
    // This 'token' is just the phone number used as an ID
    const token = localStorage.getItem('userAuthToken'); 
    return {
        'Content-Type': 'application/json',
        'x-phone': token || '' 
    };
}

// 2. Helper function to get the complete product details using the map.
function getFullProduct(product) {
    if (!product || !product.name) {
        console.error("Invalid product data received:", product);
        return null;
    }
    if (product.price !== undefined && product.image && product.category) {
        return product;
    }
    const fullProduct = productLookupMap.get(product.name);
    if (!fullProduct) {
        console.error(`Product "${product.name}" not found in the lookup map.`);
        return null;
    }
    return fullProduct;
}

// --- AUTHENTICATION FUNCTIONS ---

export async function sendSignupOtp({ name, phone, email }) {
    const response = await fetch(`${AUTH_URL}/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

export async function createAccount({ name, phone, email, password, otp }) {
    const response = await fetch(`${AUTH_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

export async function signin({ identifier, password }) {
    const response = await fetch(`${AUTH_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

export async function requestPasswordReset(email) {
    const response = await fetch(`${AUTH_URL}/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

export async function verifyOtp(email, otp) {
    const response = await fetch(`${AUTH_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

export async function verifyOtpAndReset({ email, otp, newPassword }) {
    const response = await fetch(`${AUTH_URL}/verify-otp-and-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

// --- USER DATA & CART FUNCTIONS ---

export async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/data`, { headers: getAuthHeaders() });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Could not fetch user data: ${errorData.message}`);
        }
        const data = await response.json();
        console.log("[fetchUserData API Success]", data);
        return data;
    } catch (error) {
        console.error("[fetchUserData API Network/Fetch Error]", error);
        throw error;
    }
}

export async function updateWishlist(product) {
    const fullProduct = getFullProduct(product); 
    if (!fullProduct) return; 

    try {
        const response = await fetch(`${API_URL}/wishlist`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product: fullProduct }) 
        });
        if (!response.ok) throw new Error(`Failed to update wishlist: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[updateWishlist API Error]", error);
        throw error;
    }
}

export async function addToCart(product) {
    const fullProduct = getFullProduct(product);
    if (!fullProduct) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product: fullProduct })
        });
        if (!response.ok) throw new Error(`Failed to add to cart: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[addToCart API Error]", error);
        throw error;
    }
}

export async function updateCartQuantity(productName, newQuantity) {
    try {
        const response = await fetch(`${API_URL}/cart/quantity`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productName, newQuantity })
        });
        if (!response.ok) throw new Error(`Failed to update cart quantity: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[updateCartQuantity API Error]", error);
        throw error;
    }
}

export async function removeFromCart(productName) {
    try {
        const response = await fetch(`${API_URL}/cart/remove`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productName })
        });
        if (!response.ok) throw new Error(`Failed to remove from cart: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[removeFromCart API Error]", error);
        throw error;
    }
}

export async function updateCartOffer(productName, offerId, accountNumber) {
    try {
        const response = await fetch(`${API_URL}/cart/offer`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productName, offerId, accountNumber })
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || 'Failed to update offer');
        }
        return await response.json();
    } catch (error) {
        console.error("[updateCartOffer API Error]", error);
        throw error;
    }
}

// --- ORDER & ADDRESS FUNCTIONS ---

export async function updateAddress(address) {
    try {
        const response = await fetch(`${API_URL}/address`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ address })
        });
        if (!response.ok) throw new Error(`Failed to update address: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[updateAddress API Error]", error);
        throw error;
    }
}

export async function placeOrder(order) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ order })
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorBody.message || `Failed to place order: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("[placeOrder API Error]", error);
        throw error;
    }
}

export async function cancelOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderId })
        });
        if (!response.ok) {
            throw new Error(`Failed to cancel order: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("[cancelOrder API Error]", error);
        throw error;
    }
}

export async function fetchOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/order/${orderId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch order details.');
        }
        return await response.json();
    } catch (error) {
        console.error("[fetchOrderDetails API Error]", error);
        throw error;
    }
}

// --- STUDENT DISCOUNT & RETURNS ---

export async function requestDiscountCode(studentEmail, productName) {
    try {
        const response = await fetch(`${API_URL}/request-discount-code`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ studentEmail, productName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        console.error("[requestDiscountCode API Error]", error);
        throw error;
    }
}

export async function verifyDiscountCode(verificationCode, productName) {
    try {
        const response = await fetch(`${API_URL}/verify-discount-code`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ verificationCode, productName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        console.error("[verifyDiscountCode API Error]", error);
        throw error;
    }
}

export async function requestReturnOtp(itemId, reason) {
    try {
        const response = await fetch(`${API_URL}/returns/request-otp`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ itemId, reason })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to request OTP.');
        }
        return await response.json();
    } catch (error) {
        console.error("[requestReturnOtp API Error]", error);
        throw error;
    }
}

export async function finalizeReturn(itemId, otp) {
    try {
        const response = await fetch(`${API_URL}/returns/finalize`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ itemId, otp })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to finalize return.');
        }
        return await response.json();
    } catch (error) {
        console.error("[finalizeReturn API Error]", error);
        throw error;
    }
}

// --- SUPPORT, REVIEWS & HISTORY ---

export async function sendSupportTicket(category, message) {
    try {
        const response = await fetch(`${API_URL}/contact-support`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ category, message })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send message.');
        return data;
    } catch (error) {
        console.error("[sendSupportTicket API Error]", error);
        throw error;
    }
}

export async function submitReview(reviewData) {
    try {
        const response = await fetch(`${API_URL}/review`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reviewData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit review.');
        }
        return await response.json();
    } catch (error) {
        console.error("[submitReview API Error]", error);
        throw error;
    }
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
        if (!response.ok) throw new Error(`Failed to post viewed item: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[postViewedItem API Error]", error);
        throw error;
    }
}

// --- RECOMMENDATIONS & PROFILE ---

export async function updateRecommendations(products) {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ products })
        });
        if (!response.ok) throw new Error(`Failed to update recommendations: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[updateRecommendations API Error]", error);
        throw error;
    }
}

export async function clearRecommendations() {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`Failed to clear recommendations: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[clearRecommendations API Error]", error);
        throw error;
    }
}

export async function clearViewedItems() {
    try {
        const response = await fetch(`${API_URL}/viewed`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`Failed to clear viewed items: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[clearViewedItems API Error]", error);
        throw error;
    }
}

export async function deleteProfileImage() {
    try {
        const response = await fetch(`${API_URL}/profile-image`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`Failed to delete image: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[deleteProfileImage API Error]", error);
        throw error;
    }
}

export async function updateProfileImage(base64Image) {
    try {
        const response = await fetch(`${API_URL}/profile-image`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ image: base64Image })
        });
        if (!response.ok) throw new Error(`Failed to update image: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[updateProfileImage API Error]", error);
        throw error;
    }
}