// client/src/pages/BrandPage.jsx
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function BrandPage() {
  const { name } = useParams();
  const brandName = decodeURIComponent(name || '');

  const brandProducts = useMemo(() => {
    if (!brandName) return [];
    const b = brandName.toLowerCase();
    return productsData.filter(product => {
      const pName = product.name?.toLowerCase() || '';
      return pName.includes(b);
    });
  }, [brandName]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Brand Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Official Brand Showcase
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            {brandName}
          </h1>
          <p className="text-gray-400 text-sm">
            Showing {brandProducts.length} authentic products from {brandName}
          </p>
        </div>
        <Link
          to="/trending"
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-full backdrop-blur-sm transition"
        >
          &larr; All Brands
        </Link>
      </div>

      {/* Products Grid */}
      {brandProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No products found for {brandName}</h2>
          <p className="text-gray-500 text-sm mb-6">Check out other trending brands or browse all products.</p>
          <Link to="/explore" className="bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-full">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {brandProducts.map((product, idx) => (
            <ProductCard key={idx} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

