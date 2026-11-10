// client/src/pages/AllTrendingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ALL_TRENDING_BRANDS = [
  { name: 'Apple', img: '/images/apple.png', alt: 'Apple Logo' },
  { name: 'HP', img: '/images/hp.png', alt: 'HP Logo' },
  { name: 'Nike', img: '/images/nike.png', alt: 'Nike Logo' },
  { name: "Levi's", img: '/images/levis.png', alt: "Levi's Logo" },
  { name: 'Samsung', img: '/images/samsung.png', alt: 'Samsung Logo' },
  { name: 'ITC', img: '/images/Itc.png', alt: 'ITC Logo' },
  { name: 'Oneplus', img: '/images/oneplus.png', alt: 'OnePlus Logo' },
  { name: 'Motorola', img: '/images/motorola.png', alt: 'Motorola Logo' },
  { name: 'Sony', img: '/images/sony.png', alt: 'Sony Logo' },
  { name: 'Realme', img: '/images/realme.png', alt: 'Realme Logo' },
  { name: 'Google', img: '/images/google.png', alt: 'Google Logo' },
  { name: 'Asus', img: '/images/asus.png', alt: 'Asus Logo' },
  { name: 'Fastrack', img: '/images/fastrack.png', alt: 'Fastrack Logo' },
  { name: 'Vivo', img: '/images/vivo.png', alt: 'Vivo Logo' },
  { name: 'Britania', img: '/images/britania.png', alt: 'Britannia Logo' },
];

export default function AllTrendingPage() {
  return (
    <section className="py-4 section-trend">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {ALL_TRENDING_BRANDS.map((brand) => (
            <Link
              key={brand.name}
              to={`/brand?name=${encodeURIComponent(brand.name)}`}
              className="brand-card"
            >
              <div className="group flex items-center justify-center p-6 h-52 bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
                <img className="h-40 object-contain" src={brand.img} alt={brand.alt} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
