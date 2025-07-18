import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple product card component for product listings
 * 
 * @param {Object} props
 * @param {Object} props.product - The product data to display
 * @returns {JSX.Element} ProductCard component
 */
function ProductCard({ product }) {
    /**
   * @param {number} price - The price to format
   * @returns {string} Formatted price string
   */
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0.00 EGP';
    
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(price));
  };

    const baseUrl = process.env.REACT_APP_IMAGE_BASE_URL;

    const resolveImageUrl = (product) => {
        const imageUrl = product.image || product.imageUrl; // Check for both fields
        if (!imageUrl) {
            return 'https://via.placeholder.com/150?text=No+Image'; // Return a fallback
        }
        if (imageUrl.startsWith("http") || imageUrl.startsWith("https://")) {
            return imageUrl;
        }
        // Assuming your assets are served from the public folder of your dev server
        return `${window.location.origin}${imageUrl}`;
    };

  return (
    <div className="border rounded shadow-lg p-4 flex flex-col">
      <img src={resolveImageUrl(product)} alt={product.name} className="h-40 object-contain mb-4" />
      
      {/* Brand display */}
      {/*{product.brand && (*/}
      {/*  <div className="mb-1">*/}
      {/*    <span className="text-xs uppercase tracking-wider font-semibold text-blue-600">*/}
      {/*      {product.brand}*/}
      {/*    </span>*/}
      {/*  </div>*/}
      {/*)}*/}
      
      <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
      <p className="text-gray-700 flex-grow mb-4">{product.description.substring(0, 100)}...</p>
      <div className="mt-auto flex justify-between items-center">
        <span className="text-blue-500 font-bold text-lg">{formatPrice(product.price)}</span>
        <Link to={`/product/${product.id}`} className="bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600">
          View
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
