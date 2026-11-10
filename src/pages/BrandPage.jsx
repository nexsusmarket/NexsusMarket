// client/src/pages/BrandPage.jsx
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function BrandPage() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const brandName = name || searchParams.get('name') || '';
  const decodedBrand = decodeURIComponent(brandName).trim();

  const brandProducts = useMemo(() => {
    if (!decodedBrand) return [];
    return productsData.filter(product => {
      const pName = (product.name || '').toLowerCase();
      const pBrand = (product.brand || '').toLowerCase();
      const bTarget = decodedBrand.toLowerCase();
      return pName.includes(bTarget) || pBrand.includes(bTarget);
    });
  }, [decodedBrand]);

  return (
    <main className="container mx-auto px-0 py-4 md:py-8">
      <h1 id="brand-title" className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4 px-4 md:px-0">
        {decodedBrand || 'Brand'}
      </h1>

      {brandProducts.length === 0 ? (
        <div className="text-center py-16 col-span-full">
          <p className="text-gray-600">No products found for this brand.</p>
        </div>
      ) : (
        <div id="products-container" className="products-grid">
          {brandProducts.map((item) => (
            <ProductCard key={item.name} product={item} />
          ))}
        </div>
      )}
    </main>
  );
}
