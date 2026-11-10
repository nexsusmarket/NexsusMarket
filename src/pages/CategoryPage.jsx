// client/src/pages/CategoryPage.jsx
import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const categoryParam = name || searchParams.get('category') || 'electronics';
  const categoryKey = categoryParam.toLowerCase().trim();

  const [sortBy, setSortBy] = useState('popular');

  const categoryTitles = {
    electronics: 'Electronics & Gadgets',
    home: 'Home & Kitchen Appliances',
    mobiles: 'Smartphones & Mobile Accessories',
    fashion: 'Fashion & Apparel',
    laptops: 'Laptops & Computers',
    grocery: 'Daily Groceries & Essentials',
  };

  const currentTitle = categoryTitles[categoryKey] || `${categoryParam.toUpperCase()} Products`;

  const filteredProducts = useMemo(() => {
    let list = productsData.filter(product => {
      const cat = (product.category || '').toLowerCase();
      // Match exact category or substring
      if (categoryKey === 'home') return cat.includes('home') || cat.includes('appliance');
      if (categoryKey === 'mobiles') return cat.includes('mobile') || cat.includes('phone');
      if (categoryKey === 'laptops') return cat.includes('laptop') || cat.includes('computer');
      return cat.includes(categoryKey);
    });

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [categoryKey, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">Category Catalog</span>
          <h1 className="text-2xl md:text-4xl font-extrabold capitalize mt-1">{currentTitle}</h1>
          <p className="text-xs md:text-sm text-gray-300 mt-1">
            Browse {filteredProducts.length} premium products in this section
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
          <label className="text-xs text-gray-200 font-semibold">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-transparent text-white border-none focus:outline-none cursor-pointer"
          >
            <option value="popular" className="text-gray-900">Popularity</option>
            <option value="price-low" className="text-gray-900">Price: Low to High</option>
            <option value="price-high" className="text-gray-900">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No items found in {categoryParam}</h2>
          <Link to="/explore" className="bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-full inline-block mt-4">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={idx} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

