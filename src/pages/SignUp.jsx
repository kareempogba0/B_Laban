// SignUp.jsx
import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
// --- MODIFICATION: Import the new action ---
import { setFullUser } from '../redux/userSlice';
import { m } from "framer-motion";

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const from = useLocation().state?.from?.pathname || "/";

  // --- This function creates a user document and returns the profile data ---
  const createUserProfileDocument = async (userAuth, additionalData = {}) => {
    if (!userAuth) return;

    const userRef = doc(db, 'users', userAuth.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { displayName, email, photoURL } = userAuth;
      const createdAt = new Date();
      const defaultProfilePic = `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || name || email}`;

      try {
        await setDoc(userRef, {
          uid: userAuth.uid,
          name: displayName || name || 'New User',
          email,
          profilePic: photoURL || defaultProfilePic,
          createdAt,
          ...additionalData,
        });
      } catch (error) {
        console.error('error creating user', error.message);
      }
    }
    return userRef;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfileDocument(user, { name });

      // Fetch the newly created profile to get all data
      const userProfileRef = await getDoc(doc(db, 'users', user.uid));
      const profileData = userProfileRef.data();

      // --- MODIFICATION: Dispatch the full user profile to Redux ---
      dispatch(setFullUser({
        user: { uid: user.uid, email: user.email }, // Keep user object lean
        name: profileData.name,
        profilePic: profileData.profilePic,
      }));

      toast.success("Sign up successful!");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Social Sign-up also needs to be updated
  const handleSocialSignUp = async (providerType) => {
    setLoading(true);
    const provider = providerType === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await createUserProfileDocument(user);

      const userProfileRef = await getDoc(doc(db, 'users', user.uid));
      const profileData = userProfileRef.data();

      // --- MODIFICATION: Dispatch the full user profile to Redux ---
      dispatch(setFullUser({
        user: { uid: user.uid, email: user.email },
        name: profileData.name,
        profilePic: profileData.profilePic,
      }));

      toast.success("Sign in successful!");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };


  return (
      <m.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-20">
          <form onSubmit={handleSignUp} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold text-center mb-6">Sign Up</h2>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-4 mb-4 border rounded-lg"/>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 mb-4 border rounded-lg"/>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-4 mb-6 border rounded-lg"/>
            <button type="submit" disabled={loading} className={`w-full bg-blue-600 text-white py-2 rounded-lg font-semibold transition-all ${loading ? 'opacity-50' : 'hover:bg-blue-700'}`}>
              {loading ? "Processing..." : "Sign Up"}
            </button>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => handleSocialSignUp('google')} disabled={loading} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition">
                Sign up with Google
              </button>
              <button type="button" onClick={() => handleSocialSignUp('github')} disabled={loading} className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition">
                Sign up with Github
              </button>
            </div>
            <p className="mt-4 text-center">
              Already have an account? <Link to="/signin" className="text-blue-600 hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </m.div>
  );
}

export default SignUp;