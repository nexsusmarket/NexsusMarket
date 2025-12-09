import { product } from "./products.js";

// --- THE EXPANDED BRAIN ---
// This maps human words to your specific database category names
const CATEGORY_SYNONYMS = {
    // 1. MOBILES (Includes Tablets in your data)
    "mobile": [
        "phone", "smartphone", "android", "iphone", "cell", "mobiles", "phones", "5g", "4g", 
        "galaxy", "redmi", "realme", "vivo", "oppo", "iqoo", "pixel", "pad", "tablet", "tab"
    ],
    
    // 2. LAPTOPS
    "laptop": [
        "computer", "notebook", "pc", "macbook", "desktop", "laptops", "windows", "processor", 
        "intel", "ryzen", "book", "chromebook", "ultrabook", "gaming laptop", "workstation"
    ],
    
    // 3. ELECTRONICS (Broadest Category)
    "electronics": [
        "gadget", "tech", "accessory", "accessories", "camera", "dslr", "mirrorless", "lens",
        "headphone", "earbud", "speaker", "watch", "smartwatch", "buds", "airpods", "tws", "audio",
        "mouse", "keyboard", "gaming", "console", "ps5", "playstation", "gamepad", "controller",
        "printer", "monitor", "gpu", "graphic", "card", "rtx", "cooling", "fan" // cooling pad
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

// Flatten all items
const allItems = product.flatMap(p =>
    p.category.flatMap(cat =>
        cat.items.map(item => ({
            ...item,
            categoryName: cat.name.toLowerCase()
        }))
    )
);

export function setupSearchBar() {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    if (!searchInput || !searchBtn) return;

    function performSearch() {
        const rawTerm = searchInput.value.trim().toLowerCase();
        if (!rawTerm) return;

        const searchTokens = rawTerm.split(/\s+/);
        
        // Intelligent Match Logic
        const found = allItems.some(item => {
            let itemString = `${item.name} ${item.categoryName}`.toLowerCase();
            
            // Check if ANY of the categories match the token
            let hasCategoryMatch = false;
            for (const [cat, syns] of Object.entries(CATEGORY_SYNONYMS)) {
                // If user typed "desk" (synonym) and item is in "homeappliances" (cat) -> Match!
                if (searchTokens.some(token => syns.includes(token)) && item.categoryName === cat) {
                    hasCategoryMatch = true;
                }
            }

            const nameMatches = searchTokens.every(token => itemString.includes(token));

            return hasCategoryMatch || nameMatches;
        });

        if (found) {
            localStorage.setItem("lastSearch", searchInput.value.trim());
            window.location.href = "/search.html";
        } else {
            showError(searchInput.parentElement);
        }
    }

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });
}

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