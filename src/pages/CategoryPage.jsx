// client/src/pages/CategoryPage.jsx
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import productsData from '../data/products.json';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const rawCategory = name || searchParams.get('category') || 'electronics';
  const categoryName = rawCategory.toLowerCase().trim();

  let formattedTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  if (categoryName === 'homeappliances' || categoryName === 'home') {
    formattedTitle = 'Home & Appliances';
  } else if (categoryName === 'mobile' || categoryName === 'mobiles') {
    formattedTitle = 'Mobiles';
  } else if (categoryName === 'laptop' || categoryName === 'laptops') {
    formattedTitle = 'Laptops';
  }

  const filteredProducts = useMemo(() => {
    return productsData.filter(product => {
      const cat = (product.category || '').toLowerCase();
      if (categoryName === 'homeappliances' || categoryName === 'home') {
        return cat.includes('home') || cat.includes('appliance');
      }
      if (categoryName === 'mobile' || categoryName === 'mobiles') {
        return cat.includes('mobile') || cat.includes('phone');
      }
      if (categoryName === 'laptop' || categoryName === 'laptops') {
        return cat.includes('laptop') || cat.includes('computer');
      }
      return cat === categoryName || cat.includes(categoryName);
    });
  }, [categoryName]);

  return (
    <main className="container mx-auto px-0 py-4 md:py-8">
      <h1 id="category-title" className="text-3xl font-bold mb-6 px-4 md:px-0 text-gray-800">
        {formattedTitle}
      </h1>

      {filteredProducts.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div id="products-container" className="products-grid">
          {filteredProducts.map((item) => (
            <ProductCard key={item.name} product={item} />
          ))}
        </div>
      )}
    </main>
  );
}
