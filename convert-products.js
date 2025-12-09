const fs = require('fs');
const path = require('path');

import('./javaScript/products.js').then(module => {
    const { product } = module;
    
    const flattenedProducts = [];
    const mainProductObject = product[0]; 

    mainProductObject.category.forEach(cat => {
        const categoryName = cat.name;
        
        cat.items.forEach(item => {
            flattenedProducts.push({
                ...item, 
                category: categoryName 
            });
        });
    });

    const jsonContent = JSON.stringify(flattenedProducts, null, 2);

    const outputPath = path.join(__dirname, 'products.json');

    fs.writeFileSync(outputPath, jsonContent);

    console.log('✅ Successfully flattened and created products.json');
}).catch(err => {
    console.error('❌ Error converting products.js to JSON:', err);
});