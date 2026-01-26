// --- javascript/profile.js ---
import { fetchUserData, updateProfileImage, deleteProfileImage } from './apiService.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Authentication
    const userToken = localStorage.getItem('userAuthToken');
    if (!userToken) {
        const modal = document.getElementById('login-prompt-modal');
        if (modal) modal.classList.remove('hidden');
        return;
    }

    // 2. Setup Variables
    const userName = localStorage.getItem('userName');
    const welcomeHeader = document.getElementById('profile-welcome-header');
    const profileImg = document.getElementById('profile-image');
    const placeholder = document.getElementById('profile-placeholder');
    const deleteBtn = document.getElementById('delete-profile-btn');
    
    // Cropper Variables
    const fileInput = document.getElementById('profile-upload');
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const saveCropBtn = document.getElementById('save-crop');
    const cancelCropBtn = document.getElementById('cancel-crop');
    const closeCropperBtn = document.getElementById('close-cropper');
    let cropper = null;

    if (userName && welcomeHeader) {
        welcomeHeader.textContent = `Hello, ${userName}`;
    }

    // 3. Helper to Show/Hide Image State
    function setProfileImageState(hasImage, imageUrl = '') {
        if (hasImage && imageUrl) {
            if (profileImg) {
                profileImg.src = imageUrl;
                profileImg.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
            if (deleteBtn) deleteBtn.classList.remove('hidden');
        } else {
            if (profileImg) {
                profileImg.src = '';
                profileImg.classList.add('hidden');
            }
            if (placeholder) placeholder.classList.remove('hidden');
            if (deleteBtn) deleteBtn.classList.add('hidden');
        }
    }

    // 4. Fetch Live Data
    try {
        const userData = await fetchUserData();
        
        // Update Points
        const pointsContainer = document.querySelector('.text-yellow-600.bg-yellow-100'); 
        if (pointsContainer) {
            const points = userData.rewardPoints || 0;
            pointsContainer.innerHTML = `<i class="fas fa-coins text-xs"></i> ${points.toLocaleString()} Pts`;
        }

        // Update Image State
        if (userData.profileImage) {
            setProfileImageState(true, userData.profileImage);
        } else {
            setProfileImageState(false);
        }

    } catch (error) {
        console.error("Failed to load profile data:", error);
    }

    // 5. Delete Button Logic (NO ALERT)
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                // Optimistic UI update: Remove it immediately from the screen
                setProfileImageState(false);
                // Send request to backend
                await deleteProfileImage();
            } catch (err) {
                console.error("Failed to remove image on server", err);
                // Ideally show a small toast notification here if it fails
            }
        });
    }

    // 6. Image Upload & Cropper Logic
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                // 1. Open Modal with the selected image
                imageToCrop.src = event.target.result;
                cropperModal.classList.remove('hidden');

                // 2. Initialize Cropper (Destroy previous instance if exists)
                if (cropper) {
                    cropper.destroy();
                }
                
                // Wait slightly for image to load in DOM
                setTimeout(() => {
                    cropper = new Cropper(imageToCrop, {
                        aspectRatio: 1, // Force square crop
                        viewMode: 1,    // Restrict crop box to image size
                        dragMode: 'move', // Allow moving the image
                        autoCropArea: 1,
                        background: false
                    });
                }, 100);
            };
            reader.readAsDataURL(file);
            
            // Reset input value so same file can be selected again if needed
            fileInput.value = '';
        });
    }
    function setProfileImageState(hasImage, imageUrl = '') {
    const profileImg = document.getElementById('profile-image');
    const placeholder = document.getElementById('profile-placeholder');
    const deleteBtn = document.getElementById('delete-profile-btn');

    if (hasImage && imageUrl) {
        if (profileImg) {
            profileImg.src = imageUrl;
            profileImg.classList.remove('hidden');
        }
        if (placeholder) placeholder.classList.add('hidden');
        
        // Show delete button ONLY if there is an image
        if (deleteBtn) deleteBtn.classList.remove('hidden');
    } else {
        if (profileImg) {
            profileImg.src = '';
            profileImg.classList.add('hidden');
        }
        if (placeholder) placeholder.classList.remove('hidden');
        
        // Hide delete button if no image
        if (deleteBtn) deleteBtn.classList.add('hidden');
    }
    }
    // 7. Cropper Modal Actions
    function closeCropper() {
        cropperModal.classList.add('hidden');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    if (cancelCropBtn) cancelCropBtn.addEventListener('click', closeCropper);
    if (closeCropperBtn) closeCropperBtn.addEventListener('click', closeCropper);

    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', async () => {
            if (!cropper) return;

            // 1. Get cropped canvas
            const canvas = cropper.getCroppedCanvas({
                width: 500,  // Resize to reasonable dimension
                height: 500,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            // 2. Convert to Base64 (JPEG compressed)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            // 3. Update UI Immediately
            setProfileImageState(true, compressedBase64);
            closeCropper();

            // 4. Send to Database
            try {
                await updateProfileImage(compressedBase64);
                console.log("Updated profile image successfully");
            } catch (err) {
                alert("Failed to save image to server.");
                console.error(err);
            }
        });
    }
    
    // 8. Logout
    const logoutCard = document.getElementById('logout-card');
    if (logoutCard) {
        logoutCard.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.logout) window.logout();
            else {
                localStorage.clear();
                window.location.href = './signin.html';
            }
        });
    }
});