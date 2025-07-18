import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import useWishlist from '../utils/useWishlist';

const WishlistButton = ({ product, size = 'md', className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.currentUser);

  // Get the functions and the synchronous checker from our powerful hook
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // --- FIX: The button's state is now derived directly from the Redux store on every render ---
  // This is the single source of truth. No local state or useEffect needed.
  const isProductInWishlist = isInWishlist(product.id);

  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSizeMap = { sm: 18, md: 22, lg: 26 };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please sign in to manage your wishlist');
      navigate('/signin');
      return;
    }

    if (!product || !product.id) {
      toast.error('Cannot update wishlist: product data is missing.');
      return;
    }

    setIsLoading(true);

    try {
      if (isProductInWishlist) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      // The hook already shows a toast error, so we just log it here.
      console.error('Wishlist toggle failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <button
          onClick={handleWishlistToggle}
          disabled={isLoading}
          className={`rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
              isProductInWishlist
                  ? 'bg-red-100 text-red-500 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } ${sizeMap[size]} ${className}`}
          aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
            size={iconSizeMap[size]}
            // The 'fill' is now determined by the reliable Redux-driven state
            className={`${isProductInWishlist ? 'fill-current' : 'fill-transparent'} ${isLoading ? 'opacity-50 animate-pulse' : ''}`}
        />
      </button>
  );
};

WishlistButton.propTypes = {
  product: PropTypes.object.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default WishlistButton;