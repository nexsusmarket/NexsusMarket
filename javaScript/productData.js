// javascript/data/productData.js

import { product as nestedProductData } from './products.js';

// This function flattens the nested product structure and adds the category to each item
function flattenProductsWithCategory(nestedProducts) {
    const flatList = [];
    // The first element of the array holds all the categories
    const allCategories = nestedProducts[0]?.category || [];
    
    allCategories.forEach(category => {
        const categoryName = category.name;
        const items = category.items || [];
        
        items.forEach(item => {
            const newItem = { ...item, category: categoryName };
            flatList.push(newItem);
        });
    });
    return flatList;
}

// A flat array of all products, each with a 'category' property
export const allProductsFlat = flattenProductsWithCategory(nestedProductData);

// A Map for very fast product lookups by name. This is the key to our solution.
export const productLookupMap = new Map(
    allProductsFlat.map(product => [product.name, product])
);