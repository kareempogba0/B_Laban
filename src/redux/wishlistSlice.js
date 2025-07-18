import { createSlice } from '@reduxjs/toolkit';

// --- FIX: Import the 'clearUser' action from your userSlice ---
// Make sure the path './userSlice' is correct for your project structure.
import { clearUser } from './userSlice';

/**
 * Redux slice for managing the user's wishlist
 * Handles adding, removing, and setting wishlist items
 */
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Your existing reducers are perfect and do not need to be changed.
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setWishlistItems: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addToWishlist: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (!existingItem) {
        state.items.push(action.payload);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearWishlist: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },

  // --- THIS IS THE ADDED CODE THAT FIXES THE BUG ---
  extraReducers: (builder) => {
    // This tells the wishlistSlice to listen for the 'user/clearUser' action.
    builder.addCase(clearUser, (state) => {
      // When the user is cleared (logged out), reset the wishlist state
      // back to its initial empty state.
      state.items = [];
      state.loading = false;
      state.error = null;
      console.log("[Redux] Wishlist state has been cleared due to user sign-out.");
    });
  },
});

export const {
  setLoading,
  setError,
  setWishlistItems,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = wishlistSlice.actions;

export default wishlistSlice.reducer;