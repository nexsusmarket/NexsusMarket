// client/src/pages/AllTrendingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ALL_TRENDING_BRANDS = [
  { name: 'Apple', logo: '/images/google.png' },
  { name: 'HP', logo: '/images/hp.png' },
  { name: 'Nike', logo: '/images/nike.png' },
  { name: "Levi's", logo: '/images/levis.png' },
  { name: 'Samsung', logo: '/images/samsung.png' },
  { name: 'ITC', logo: '/images/Itc.png' },
  { name: 'OnePlus', logo: '/images/oneplus.png' },
  { name: 'Motorola', logo: '/images/motorola.png' },
  { name: 'Sony', logo: '/images/sony.png' },
  { name: 'Realme', logo: '/images/realme.png' },
  { name: 'Google', logo: '/images/google.png' },
  { name: 'Asus', logo: '/images/google.png' },
  { name: 'Fastrack', logo: '/images/fastrack.png' },
  { name: 'Vivo', logo: '/images/vivo.png' },
  { name: 'Britannia', logo: '/images/britania.png' }
];

export default function AllTrendingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <i className="fas fa-fire text-amber-500"></i>
          Trending Brands
        </h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Shop official certified collections from global leaders across electronics, computing, fashion, and lifestyle.
        </p>
      </div>

      {/* Grid of Brand Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {ALL_TRENDING_BRANDS.map((brand, idx) => (
          <Link
            key={idx}
            to={`/brand/${encodeURIComponent(brand.name)}`}
            className="nexus-brand-card brand-card-gradient shadow-md hover:shadow-2xl transition duration-300 group flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 hover:-translate-y-1.5"
          >
            <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center p-3 mb-4 group-hover:scale-110 transition duration-300">
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  // Fallback to text icon if image not present
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-2xl font-black text-gray-800">
                {brand.name[0]}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-gray-800 group-hover:text-indigo-600 transition tracking-wide text-center">
              {brand.name}
            </h3>
            <span className="text-xs text-indigo-500 font-semibold mt-1">View Collection &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

