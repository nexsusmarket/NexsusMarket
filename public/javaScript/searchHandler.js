// javascript/searchHandler.js

// --- THE EXPANDED BRAIN ---
// This maps human words to your specific database category names
const CATEGORY_SYNONYMS = {
    // 1. MOBILES
    "mobile": [
        "phone", "smartphone", "android", "iphone", "cell", "mobiles", "phones", "5g", "4g", 
        "galaxy", "redmi", "realme", "vivo", "oppo", "iqoo", "pixel", "pad", "tablet", "tab"
    ],
    
    // 2. LAPTOPS
    "laptop": [
        "computer", "notebook", "pc", "macbook", "desktop", "laptops", "windows", "processor", 
        "intel", "ryzen", "book", "chromebook", "ultrabook", "gaming laptop", "workstation"
    ],
    
    // 3. ELECTRONICS
    "electronics": [
        "gadget", "tech", "accessory", "accessories", "camera", "dslr", "mirrorless", "lens",
        "headphone", "earbud", "speaker", "watch", "smartwatch", "buds", "airpods", "tws", "audio",
        "mouse", "keyboard", "gaming", "console", "ps5", "playstation", "gamepad", "controller",
        "printer", "monitor", "gpu", "graphic", "card", "rtx", "cooling", "fan"
    ],
    
    // 4. FASHION
    "fashion": [
        "cloth", "clothing", "wear", "apparel", "dress", "shirt", "pant", "jeans", "shoe", "sneaker", 
        "top", "t-shirt", "men", "women", "kids", "saree", "kurta", "anarkali", "ethnic", 
        "slide", "slipper", "flip", "flop", "sandal", "bag", "backpack", "luggage"
    ],
    
    // 5. HOME & APPLIANCES
    "homeappliances": [
        "home", "appliance", "fridge", "refrigerator", "tv", "television", "smart tv", "led", "qled", 
        "ac", "conditioner", "air", "cool", "washing", "machine", "cooler", "fan", "ceiling",
        "sofa", "bed", "chair", "table", "desk", "furniture", "living", "room", "study", "soundbar", 
        "theatre", "woofer", "subwoofer", "audio"
    ],
    
    // 6. GROCERY
    "grocery": [
        "food", "eat", "snack", "drink", "biscuit", "oil", "chocolate", "almond", "dry fruit", "nut",
        "masala", "spice", "noodle", "maggi", "pasta", "shampoo", "soap", "wash", "hair", "care", 
        "ghee", "dairy", "salt", "sugar", "pie", "cookie", "cake"
    ]
};

export function setupSearchBar() {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    if (!searchInput || !searchBtn) return;

    // We make this function ASYNC because we need to wait for the JSON file to load
async function performSearch() {
        const rawTerm = searchInput.value.trim().toLowerCase();
        if (!rawTerm) return;

        try {
            // UPDATED PATH: Points to the products.json inside the javascript folder
            const response = await fetch('./javascript/products.json'); 
            if (!response.ok) {
                throw new Error("Could not load products.json");
            }
            const allItems = await response.json();

            const searchTokens = rawTerm.split(/\s+/);
            
            // 2. Search Logic
            const found = allItems.some(item => {
                // In your new JSON, the category is just 'item.category' (e.g., "electronics")
                const itemCategory = (item.category || "").toLowerCase();
                const itemString = `${item.name} ${itemCategory}`.toLowerCase();
                
                // A. Check Category Synonyms
                let hasCategoryMatch = false;
                for (const [catName, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
                    // Check if the user typed a synonym (e.g., "laptop") AND the item is in that category (e.g., "laptop")
                    const userTypedSynonym = searchTokens.some(token => synonyms.includes(token));
                    if (userTypedSynonym && itemCategory === catName) {
                        hasCategoryMatch = true;
                    }
                }

                // B. Check Name Matches (all words must match)
                const nameMatches = searchTokens.every(token => itemString.includes(token));

                return hasCategoryMatch || nameMatches;
            });

            // 3. Handle Result
            if (found) {
                localStorage.setItem("lastSearch", searchInput.value.trim());
                window.location.href = "./search.html";
            } else {
                showError(searchInput.parentElement);
            }

        } catch (error) {
            console.error("Search failed:", error);
            // Optional: Alert the user if the file is missing entirely
            if (error.message.includes("load products.json")) {
                alert("Error: products.json file is missing or cannot be read.");
            }
        }
    }

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });
}

// Helper to show a small popup error
function showError(container) {
    if (container.querySelector('.search-error-message')) return;
    const msg = document.createElement('div');
    msg.className = 'search-error-message';
    Object.assign(msg.style, {
        position: 'absolute', top: '115%', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 16px',
        borderRadius: '20px', zIndex: '50', fontSize: '14px', whiteSpace: 'nowrap'
    });
    msg.innerHTML = `<i class="fas fa-exclamation-circle"></i> No products found`;
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}