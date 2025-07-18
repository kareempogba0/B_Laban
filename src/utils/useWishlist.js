import { useCallback } from 'react';
import { db, auth } from '../firebase/config';
import {doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDispatch, useSelector } from 'react-redux';
import {addToWishlist as addRedux, clearWishlist, removeFromWishlist as removeRedux} from '../redux/wishlistSlice';
import { toast } from 'react-toastify';

const useWishlist = () => {
  const [user] = useAuthState(auth);
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const addToWishlist = useCallback(async (product) => {
    if (!user) throw new Error("User not authenticated");

    const wishlistItemData = {
      id: product.id,
      name: product.name || 'Unknown Product',
      price: product.price || 0,
      image: product.image || product.imageUrl || '',
      createdAt: new Date().toISOString(),
    };

    try {
      // --- THIS IS THE NEW, SAFER LOGIC ---

      // 1. Define a reference to the user's main wishlist document.
      const userWishlistDocRef = doc(db, 'wishlists', user.uid);

      // 2. Check if this main document exists.
      const docSnap = await getDoc(userWishlistDocRef);
      if (!docSnap.exists()) {
        // If it doesn't exist, create it with some basic info.
        // This is crucial for satisfying security rules that might check the parent doc.
        await setDoc(userWishlistDocRef, {
          userId: user.uid,
          createdAt: new Date()
        });
        console.log("Created parent wishlist document for user:", user.uid);
      }

      // 3. Now, safely create the document in the 'items' subcollection.
      const wishlistItemRef = doc(db, 'wishlists', user.uid, 'items', product.id);
      await setDoc(wishlistItemRef, wishlistItemData);

      // 4. Update Redux state
      dispatch(addRedux(wishlistItemData));

      toast.success(`'${product.name}' added to your wishlist!`);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add item. Please try again.");
      throw error;
    }
  }, [user, dispatch]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid, 'items', productId);
      await deleteDoc(wishlistRef);
      dispatch(removeRedux(productId));
      toast.info("Item removed from your wishlist.");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove item. Please try again.");
      throw error;
    }
  }, [user, dispatch]);

  const clearEntireWishlist = useCallback(async () => {
    if (!user) {
      toast.error("You must be signed in to clear the wishlist.");
      throw new Error("User not authenticated");
    }

    try {
      console.log(`[Wishlist] Attempting to clear wishlist for user: ${user.uid}`);

      const itemsCollectionRef = collection(db, 'wishlists', user.uid, 'items');

      console.log("[Wishlist] Fetching all items to delete...");
      const snapshot = await getDocs(itemsCollectionRef);
      console.log(`[Wishlist] Found ${snapshot.size} items to delete.`);

      if (snapshot.empty) {
        toast.info("Your wishlist is already empty.");
        dispatch(clearWishlist());
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        console.log(`[Wishlist] Staging deletion for item: ${doc.id}`);
        batch.delete(doc.ref);
      });

      console.log("[Wishlist] Committing batch delete operation...");
      await batch.commit();
      console.log("[Wishlist] Batch commit successful!");

      dispatch(clearWishlist());
      toast.success("Your wishlist has been cleared.");

    } catch (error) {
      console.error("--- FULL ERROR CLEARING WISHLIST ---", error);
      // This will now log the specific Firestore error, likely 'permission-denied'
      console.error("Error Code:", error.code);

      toast.error("Failed to clear wishlist. Please check console for details.");
      throw error;
    }
  }, [user, dispatch]);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);


  return { addToWishlist, removeFromWishlist, isInWishlist, clearEntireWishlist, wishlistItems};
};

export default useWishlist;