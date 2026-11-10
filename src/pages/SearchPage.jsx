// client/src/pages/SearchPage.jsx
import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState('relevance');

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    let results = productsData.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(q);
      const catMatch = product.category?.toLowerCase().includes(q);
      return nameMatch || catMatch;
    });

    if (sortBy === 'price-low') {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      results = [...results].sort((a, b) => b.price - a.price);
    }

    return results;
  }, [query, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results for <span className="text-indigo-600 font-extrabold">"{query}"</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Found {filteredProducts.length} matching products
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-500 font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="fas fa-search"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No matching products found</h2>
          <p className="text-gray-500 text-sm mb-6">
            We couldn't find anything matching "{query}". Try checking your spelling or use different keywords.
          </p>
          <Link
            to="/explore"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition"
          >
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

