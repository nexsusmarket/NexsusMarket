// client/src/pages/SearchPage.jsx
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

const CATEGORY_SYNONYMS = {
  mobile: ["phone", "smartphone", "android", "iphone", "cell", "mobiles", "phones", "5g", "4g", "galaxy", "redmi", "realme", "vivo", "oppo", "iqoo", "pixel", "pad", "tablet", "tab"],
  laptop: ["computer", "notebook", "pc", "macbook", "desktop", "laptops", "windows", "processor", "intel", "ryzen", "book", "chromebook", "ultrabook", "gaming laptop", "workstation"],
  electronics: ["gadget", "tech", "accessory", "accessories", "camera", "dslr", "mirrorless", "lens", "headphone", "earbud", "speaker", "watch", "smartwatch", "buds", "airpods", "tws", "audio", "mouse", "keyboard", "gaming", "console", "ps5", "playstation", "gamepad", "controller", "printer", "monitor", "gpu", "graphic", "card", "rtx", "cooling", "fan"],
  fashion: ["cloth", "clothing", "wear", "apparel", "dress", "shirt", "pant", "jeans", "shoe", "sneaker", "top", "t-shirt", "men", "women", "kids", "saree", "kurta", "anarkali", "ethnic", "slide", "slipper", "flip", "flop", "sandal", "bag", "backpack", "luggage"],
  homeappliances: ["home", "appliance", "fridge", "refrigerator", "tv", "television", "smart tv", "led", "qled", "ac", "conditioner", "air", "cool", "washing", "machine", "cooler", "fan", "ceiling", "sofa", "bed", "chair", "table", "desk", "furniture", "living", "room", "study", "soundbar", "theatre", "woofer", "subwoofer", "audio"],
  grocery: ["food", "eat", "snack", "drink", "biscuit", "oil", "chocolate", "almond", "dry fruit", "nut", "masala", "spice", "noodle", "maggi", "pasta", "shampoo", "soap", "wash", "hair", "care", "ghee", "dairy", "salt", "sugar", "pie", "cookie", "cake"]
};

const IGNORABLE_TERMS = {
  mobile: ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones", "cell", "android", "5g", "4g", "device"],
  laptop: ["laptop", "laptops", "computer", "computers", "pc", "system", "machine"],
  electronics: ["electronics", "electronic", "gadget", "gadgets", "tech", "accessory", "accessories"],
  fashion: ["fashion", "cloth", "clothing", "clothes", "wear", "apparel", "style", "men", "women", "kids"],
  homeappliances: ["home", "appliance", "appliances", "item", "product"],
  grocery: ["grocery", "groceries", "food", "foods", "eat", "item", "product", "pantry"]
};

function extractBrandFromName(name) {
  const knownBrands = [
    'Apple', 'HP', 'Samsung', 'OnePlus', 'Google', 'Asus', 'Realme', 'Motorola', 'Sony', 'Zebronics', 'MSI', 'LG', 'Vivo', 'Oppo', 'iQOO',
    'Nike', 'Levis', 'Allen Solly', 'Adidas', 'Puma',
    'ITC', 'Aashirvaad', 'Sunfeast', 'Orion', 'Fortune', 'Head & Shoulders',
    'Callas', 'Casastyle', 'Nilkamal', 'Crompton', 'Whirlpool', 'Haier', 'Godrej'
  ];
  const lower = (name || '').toLowerCase();
  for (const b of knownBrands) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return '';
}

function getFilteredResults(allItems, searchTerm) {
  if (!searchTerm || !allItems) return [];
  const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  let targetBrand = null;
  const targetCategories = new Set();

  terms.forEach(term => {
    let matched = false;
    const brandMatch = allItems.find(i => i.brand && i.brand.toLowerCase() === term);
    if (brandMatch) {
      targetBrand = term;
      matched = true;
    }
    if (!matched) {
      for (const [catName, syns] of Object.entries(CATEGORY_SYNONYMS)) {
        if (syns.includes(term) || catName === term) {
          targetCategories.add(catName);
          break;
        }
      }
    }
  });

  return allItems.filter(item => {
    const itemBrand = (item.brand || '').toLowerCase();
    const itemCategory = (item.category || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase();

    if (targetBrand && !itemBrand.includes(targetBrand) && !itemName.includes(targetBrand)) {
      return false;
    }

    if (targetCategories.size > 0 && !targetCategories.has(itemCategory)) {
      return false;
    }

    const mustMatchKeywords = terms.filter(term => {
      if (targetBrand && term === targetBrand) return false;
      const isKnownCatWord = Object.values(IGNORABLE_TERMS).some(list => list.includes(term));
      if (isKnownCatWord) return false;
      return true;
    });

    if (mustMatchKeywords.length > 0) {
      const allMatch = mustMatchKeywords.every(kw => itemName.includes(kw));
      if (!allMatch) return false;
    }

    return true;
  });
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || localStorage.getItem('lastSearch') || '';

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const allWithBrand = productsData.map(item => ({
      ...item,
      brand: extractBrandFromName(item.name)
    }));
    return getFilteredResults(allWithBrand, query);
  }, [query]);

  return (
    <main className="container mx-auto px-0 py-4 md:py-8">
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No products found matching "{query}".</p>
        </div>
      ) : (
        <div id="products-container" className="products-grid animate-fadeIn">
          {filteredProducts.map((item) => (
            <ProductCard key={item.name} product={item} />
          ))}
        </div>
      )}
    </main>
  );
}
