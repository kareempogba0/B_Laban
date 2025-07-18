import { createSlice } from '@reduxjs/toolkit';

// --- FIX: Import the 'clearUser' action from your userSlice ---
// Make sure the path './userSlice' is correct for your project structure.
import { clearUser } from './userSlice';

/**
 * Initial state for the cart slice.
 * Includes items array and coupon information.
 */
const initialState = {
  items: [],
  coupon: null,
};

/**
 * Redux slice for managing shopping cart state
 * Handles adding, removing, updating items and applying coupons
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Your existing reducers are all correct and do not need changes.
    addToCart(state, action) {
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.productId !== action.payload);
    },
    updateQuantity(state, action) {
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    applyCoupon(state, action) {
      state.coupon = action.payload;
    },
    removeCoupon(state) {
      state.coupon = null;
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
    },
    removePurchasedFromCart(state, action) {
      const productIdsToRemove = Array.isArray(action.payload) ? action.payload : [];
      if (productIdsToRemove.length > 0) {
        state.items = state.items.filter(item => !productIdsToRemove.includes(item.productId));
      }
    },
  },

  // --- THIS IS THE ADDED CODE THAT FIXES THE BUG ---
  extraReducers: (builder) => {
    // This tells the cartSlice to listen for the 'user/clearUser' action.
    builder.addCase(clearUser, (state) => {
      // When the user is cleared (logged out), reset the cart state
      // back to its initial empty state.
      state.items = [];
      state.coupon = null;
      console.log("[Redux] Cart state has been cleared due to user sign-out.");
    });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  removePurchasedFromCart
} = cartSlice.actions;

export default cartSlice.reducer;