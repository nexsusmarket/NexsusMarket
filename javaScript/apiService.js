// javascript/apiService.js

// 1. Import the lookup map from our new central data handler.
import { productLookupMap } from './productData.js';

const API_URL = 'http://localhost:3000/api/user';
const AUTH_URL = 'http://localhost:3000'; // FIX: Added this line to define the missing AUTH_URL constant

function getAuthHeaders() {
    const token = localStorage.getItem('userAuthToken'); // This token is now the phone number
    return {
        'Content-Type': 'application/json',
        'x-phone': token || '' // MODIFIED: Changed header key for clarity
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

export async function sendSignupOtp({ name, phone, email }) {
    const response = await fetch(`http://localhost:3000/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
}

// ... add this function to the end of javascript/apiService.js

export async function sendSupportTicket(category, message) {
    try {
        const response = await fetch(`${API_URL}/contact-support`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ category, message })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send message.');
        }
        return data;
    } catch (error) {
        console.error("[sendSupportTicket API Error]", error);
        throw error;
    }
}

export async function createAccount({ name, phone, email, password, otp }) {
    const response = await fetch(`http://localhost:3000/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, otp }),
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

export async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/data`, { headers: getAuthHeaders() });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error("[fetchUserData API Error]", `Status: ${response.status} ${response.statusText}`, "Details:", errorData);
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
    const fullProduct = getFullProduct(product); // <-- Use helper to get complete data
    if (!fullProduct) return; // Stop if product is not found

    try {
        const response = await fetch(`${API_URL}/wishlist`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product: fullProduct }) // <-- Send the complete object
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[updateWishlist API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to update wishlist: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[updateWishlist API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[updateWishlist API Network/Fetch Error]", error);
        throw error;
    }
}

export async function addToCart(product) {
    const fullProduct = getFullProduct(product); // <-- Use helper to get complete data
    if (!fullProduct) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product: fullProduct }) // <-- Send the complete object
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[addToCart API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to add to cart: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[addToCart API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[addToCart API Network/Fetch Error]", error);
        throw error;
    }
}

export async function updateAddress(address) {
    try {
        const response = await fetch(`${API_URL}/address`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ address })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[updateAddress API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to update address: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[updateAddress API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[updateAddress API Network/Fetch Error]", error);
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
            console.error(`[placeOrder API Error] Status: ${response.status} ${response.statusText}, Body:`, errorBody);
            throw new Error(errorBody.message || `Failed to place order: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[placeOrder API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[placeOrder API Network/Fetch Error]", error);
        throw error;
    }
}

export async function postViewedItem(product) {
    const fullProduct = getFullProduct(product); // <-- Use helper to get complete data
    if (!fullProduct) return;

    try {
        const response = await fetch(`${API_URL}/viewed`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product: fullProduct }) // <-- Send the complete object
        });

        if (!response.ok) {
            const errorBody = await response.text(); 
            console.error(`[postViewedItem API Error] Status: ${response.status} ${response.statusText}, Response Body: ${errorBody}`);
            throw new Error(`Failed to post viewed item: ${response.statusText} - ${errorBody}`);
        } else {
            const successData = await response.json();
            console.log("[postViewedItem API Success]", successData);
            return successData;
        }
    } catch (error) {
        console.error("[postViewedItem API Network/Fetch Error]", error);
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
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[updateCartQuantity API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to update cart quantity: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[updateCartQuantity API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[updateCartQuantity API Network/Fetch Error]", error);
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
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[removeFromCart API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to remove from cart: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[removeFromCart API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[removeFromCart API Network/Fetch Error]", error);
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
            const errorBody = await response.text();
            console.error(`[cancelOrder API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to cancel order: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[cancelOrder API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[cancelOrder API Network/Fetch Error]", error);
        throw error;
    }
}

export async function updateRecommendations(products) {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ products })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[updateRecommendations API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to update recommendations: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[updateRecommendations API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[updateRecommendations API Network/Fetch Error]", error);
        throw error;
    }
}

export async function clearRecommendations() {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[clearRecommendations API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to clear recommendations: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[clearRecommendations API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[clearRecommendations API Network/Fetch Error]", error);
        throw error;
    }
}

export async function clearViewedItems() {
    try {
        const response = await fetch(`${API_URL}/viewed`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[clearViewedItems API Error] Status: ${response.status} ${response.statusText}, Body: ${errorBody}`);
            throw new Error(`Failed to clear viewed items: ${response.statusText}`);
        }
        const successData = await response.json();
        console.log("[clearViewedItems API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[clearViewedItems API Network/Fetch Error]", error);
        throw error;
    }
}
// --- javascript/apiService.js ---

export async function updateProfileImage(base64Image) {
    try {
        const response = await fetch(`${API_URL}/profile-image`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ image: base64Image })
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to update image: ${response.statusText}`);
        }
        
        const successData = await response.json();
        console.log("[updateProfileImage API Success]", successData);
        return successData;
    } catch (error) {
        console.error("[updateProfileImage API Error]", error);
        throw error;
    }
}
// --- javascript/apiService.js ---

export async function deleteProfileImage() {
    try {
        const response = await fetch(`${API_URL}/profile-image`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete image: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("[deleteProfileImage API Error]", error);
        throw error;
    }
}