import { useCallback } from 'react';
import { db } from '../firebase/config'; // Assuming auth is not directly used here
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp // A better way to handle timestamps
} from 'firebase/firestore';
import { useSelector, useDispatch } from 'react-redux';
import {
  addToWishlist as addWishlistItem,
  clearWishlist,
  removeFromWishlist as removeWishlistItem
} from '../redux/wishlistSlice';
import { toast } from 'react-toastify';
import logger from '../utils/logger';

const useWishlist = () => {
  // Get user directly from Redux state for consistency, assuming it's populated on auth change
  const user = useSelector((state) => state.user.currentUser);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();

  const resolveImageUrl = (product) => {
    const imageUrl = product.image || product.imageUrl;
    if (!imageUrl) {
      return 'https://via.placeholder.com/150?text=No+Image'; // Return a fallback
    }
    if (imageUrl.startsWith("http") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // Assuming your assets are served from the public folder of your dev server
    return `${window.location.origin}${imageUrl}`;
  };

  const addToWishlist = useCallback(async (product) => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist.");
      return;
    }
    if (!product || !product.id) {
      toast.error("Invalid product data.");
      return;
    }

    try {
      // This path now matches your Wishlist.js component and security rules.
      const wishlistItemRef = doc(db, 'users', user.uid, 'wishlist', product.id);

      const wishlistItemData = {
        id: product.id,
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        image: resolveImageUrl(product) || '',
        addedAt: serverTimestamp(),
      };

      await setDoc(wishlistItemRef, wishlistItemData);

      // We dispatch the data that was sent to Firestore for consistency.
      dispatch(addWishlistItem(wishlistItemData));
      toast.success(`'${product.name}' added to your wishlist!`);
      logger.user.action("Add to wishlist", { productId: product.id });

    } catch (error) {
      console.error("Error adding to wishlist:", error);
      logger.error("Failed to add to wishlist", error, "Wishlist");
      toast.error("Failed to add item. Please try again.");
    }
  }, [user, dispatch]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!user) return;
    try {
      const wishlistItemRef = doc(db, 'users', user.uid, 'wishlist', productId);
      await deleteDoc(wishlistItemRef);
      dispatch(removeWishlistItem(productId)); // Use the correct action from your slice
      toast.info("Item removed from your wishlist.");
      logger.user.action("Remove from wishlist", { productId });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      logger.error("Failed to remove from wishlist", error, "Wishlist");
      toast.error("Failed to remove item. Please try again.");
    }
  }, [user, dispatch]);

  // This function can be removed as it's now duplicated in Wishlist.js
  // Keeping logic in the component that uses it is cleaner.
  // If you want to keep it here, it also needs its path corrected:
  const clearEntireWishlist = useCallback(async () => {
    if (!user) return;

    try {
      const itemsCollectionRef = collection(db, 'users', user.uid, 'wishlist');
      const snapshot = await getDocs(itemsCollectionRef);

      if (snapshot.empty) {
        dispatch(clearWishlist());
        return;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      dispatch(clearWishlist());
      toast.success("Your wishlist has been cleared.");
      logger.user.action("Clear wishlist", { count: snapshot.size });

    } catch (error) {
      console.error("Error clearing wishlist:", error);
      logger.error("Failed to clear wishlist", error, "Wishlist");
      toast.error("Failed to clear wishlist. Please try again.");
    }
  }, [user, dispatch]);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);

  return { addToWishlist, removeFromWishlist, isInWishlist, clearEntireWishlist };
};

export default useWishlist;