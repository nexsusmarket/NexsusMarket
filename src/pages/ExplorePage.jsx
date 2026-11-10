// client/src/pages/ExplorePage.jsx
import React, { useState, useMemo } from 'react';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function ExplorePage() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [searchFilter, setSearchFilter] = useState('');

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'mobiles', label: 'Smartphones' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'laptops', label: 'Laptops' },
    { id: 'home', label: 'Home Appliances' },
    { id: 'grocery', label: 'Groceries' },
  ];

  const filteredProducts = useMemo(() => {
    let list = [...productsData];

    // Category filter
    if (selectedCat !== 'all') {
      list = list.filter(p => {
        const cat = (p.category || '').toLowerCase();
        if (selectedCat === 'home') return cat.includes('home') || cat.includes('appliance');
        if (selectedCat === 'mobiles') return cat.includes('mobile') || cat.includes('phone');
        if (selectedCat === 'laptops') return cat.includes('laptop') || cat.includes('computer');
        return cat.includes(selectedCat);
      });
    }

    // In-page search text filter
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase().trim();
      list = list.filter(p => p.name?.toLowerCase().includes(term));
    }

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [selectedCat, searchFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Complete Catalog</span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Explore Products</h1>
          <p className="text-gray-300 text-xs md:text-sm">
            Browse through {productsData.length} items across all premier categories
          </p>
        </div>

        {/* In-page live search */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by title..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
        </div>
      </div>

      {/* Filter Chips & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition shadow-sm ${
                selectedCat === c.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs text-gray-500 font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="popular">Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredProducts.map((product, idx) => (
          <ProductCard key={idx} product={product} />
        ))}
      </div>
    </div>
  );
}

