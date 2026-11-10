// client/src/pages/ExplorePage.jsx
import React from 'react';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function ExplorePage() {
  return (
    <div>
      <div id="products-container" className="products-grid">
        {productsData.map((item) => (
          <ProductCard key={item.name} product={item} />
        ))}
      </div>
    </div>
  );
}
