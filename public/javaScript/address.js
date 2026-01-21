import { fetchUserData, updateAddress } from './apiService.js';

const INDIAN_STATES_DISPLAY = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const INDIAN_STATES_VALIDATION = INDIAN_STATES_DISPLAY.map(s => s.toLowerCase().replace(/\s+/g, ''));

function showToast(message, isError = false) {
    const toastContainer = document.getElementById('toast-notification');
    if (!toastContainer) return;
    const iconClass = isError ? 'fas fa-times-circle text-red-500' : 'fas fa-check-circle text-green-500';
    toastContainer.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    toastContainer.classList.add('toast-show');
    setTimeout(() => {
        toastContainer.classList.remove('toast-show');
    }, 3000);
}

// ⭐ POPULATE FORM ⭐
function populateForm(address) {
    document.getElementById('pincode-input').value = address.postcode || '';
    document.getElementById('city-input').value = address.city || address.town || address.village || '';
    document.getElementById('state-input').value = address.state || '';
    // Combine several fields for a more complete address line
    const addressLine = [address.road, address.neighbourhood, address.suburb]
        .filter(Boolean) // Remove any empty parts
        .join(', ');
    document.getElementById('address-textarea').value = addressLine;
}

// ⭐ FETCH ADDRESS FROM COORDS ⭐
async function fetchAddressFromCoords(lat, lon) {
    const useLocationBtn = document.getElementById('use-location-btn');
    if (!useLocationBtn) return; // Guard clause if button doesn't exist

    const originalButtonText = useLocationBtn.querySelector('span').textContent;
    useLocationBtn.disabled = true;
    useLocationBtn.querySelector('span').textContent = 'Fetching Address...';

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            throw new Error('Failed to fetch address from coordinates.');
        }
        const data = await response.json();
        
        if (data && data.address) {
            populateForm(data.address);
            showToast('Address details filled successfully!');
        } else {
            showToast('Could not find address details for this location.', true);
        }
    } catch (error) {
        console.error("Reverse Geocoding Error:", error);
        showToast('Error fetching address data.', true);
    } finally {
        useLocationBtn.disabled = false;
        useLocationBtn.querySelector('span').textContent = originalButtonText;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('userAuthToken')) {
        window.location.href = './signin.html';
        return;
    }

    const statesDatalist = document.getElementById('states-list');
    if (statesDatalist) {
        INDIAN_STATES_DISPLAY.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            statesDatalist.appendChild(option);
        });
    }
    
    // ⭐ GEOLOCATION BUTTON LOGIC ⭐
    const useLocationBtn = document.getElementById('use-location-btn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => { // Success
                        const { latitude, longitude } = position.coords;
                        fetchAddressFromCoords(latitude, longitude);
                    },
                    (error) => { // Error
                        let errorMessage = 'An unknown error occurred.';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = "You denied the request for Geolocation.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = "Location information is unavailable.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = "The request to get user location timed out.";
                                break;
                        }
                        showToast(errorMessage, true);
                    }
                );
            } else {
                showToast("Geolocation is not supported by your browser.", true);
            }
        });
    }

    const addressForm = document.getElementById('address-form');
    if (!addressForm) return;

    try {
        const userData = await fetchUserData();
        const address = userData.address || {};
        
        document.getElementById('name-input').value = address.name || '';
        document.getElementById('mobile-input').value = address.mobile || '';
        document.getElementById('pincode-input').value = address.pincode || '';
        document.getElementById('city-input').value = address.city || '';
        document.getElementById('address-textarea').value = address.address || '';
        document.getElementById('state-input').value = address.state || '';
    } catch (error) {
        console.error("Error fetching initial user data", error);
    }

    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mobileInput = document.getElementById('mobile-input');
        const stateInputRaw = document.getElementById('state-input').value;
        const stateError = document.getElementById('state-error');
        stateError.classList.add('hidden');

        if (!/^\d{10}$/.test(mobileInput.value.trim())) {
            showToast("Please enter a valid 10-digit mobile number.", true);
            mobileInput.focus();
            return;
        }

        const stateInputNormalized = stateInputRaw.trim().toLowerCase().replace(/\s+/g, '');
        if (!INDIAN_STATES_VALIDATION.includes(stateInputNormalized)) {
            stateError.classList.remove('hidden');
            return;
        }

        const newAddress = {
            name: document.getElementById('name-input').value.trim(),
            mobile: mobileInput.value.trim(),
            pincode: document.getElementById('pincode-input').value.trim(),
            city: document.getElementById('city-input').value.trim(),
            address: document.getElementById('address-textarea').value.trim(),
            state: stateInputRaw.trim(),
        };

        try {
            await updateAddress(newAddress);
            localStorage.setItem('deliveryAddress', JSON.stringify(newAddress));
            showToast('Address saved! Taking you back...');

            // ⭐ REDIRECT LOGIC START ⭐
            // This logic checks where the user came from and sends them back there
            setTimeout(() => {
                const previousUrl = document.referrer;
                
                // 1. If we have a previous URL and it is NOT the address page itself (prevent loop)
                // and NOT the signin page, go back to it.
                if (previousUrl && !previousUrl.includes('address.html') && !previousUrl.includes('signin.html')) {
                    window.location.href = previousUrl;
                } 
                // 2. Fallback: If opened directly, go to Profile
                else {
                    window.location.href = './profile.html';
                }
            }, 1500);
            // ⭐ REDIRECT LOGIC END ⭐

        } catch (error) {
            console.error("Failed to save address:", error);
            showToast("Error: Could not save address.", true);
        }
    });
});