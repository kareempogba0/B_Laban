import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  // Add these new fields
  name: null,
  profilePic: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // This action will be used on sign-in, sign-up, and app load
    setFullUser: (state, action) => {
      state.currentUser = action.payload.user;
      state.name = action.payload.name;
      state.profilePic = action.payload.profilePic;
      state.status = 'succeeded';
    },
    // This action will be used specifically to update the profile picture
    updateUserProfile: (state, action) => {
      if (action.payload.name) {
        state.name = action.payload.name;
      }
      if (action.payload.profilePic) {
        state.profilePic = action.payload.profilePic;
      }
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.name = null;
      state.profilePic = null;
      state.status = 'idle';
    },
  },
});

export const { setFullUser, updateUserProfile, clearUser } = userSlice.actions;

export const selectUser = (state) => state.user.currentUser;
export const selectUserName = (state) => state.user.name;
export const selectUserProfilePic = (state) => state.user.profilePic;

export default userSlice.reducer;