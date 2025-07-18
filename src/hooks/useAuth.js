import { useState } from 'react';
import { auth, db } from '../firebase/config';
import {
    signInWithEmailAndPassword,
    // ... other firebase imports
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
// --- FIX: Import setFullUser instead of setUser ---
import { setFullUser } from '../redux/userSlice';

// ... translateFirebaseError function ...

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const from = useLocation().state?.from?.pathname || '/';

    // --- FIX IN `signInWithEmail` ---
    const signInWithEmail = async (email, password) => {
        setLoading(true);
        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);

            // After signing in, fetch their profile from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                // Dispatch the full user profile, not just the auth object
                dispatch(setFullUser({
                    user: { uid: user.uid, email: user.email },
                    name: profileData.name,
                    profilePic: profileData.profilePic,
                }));
            } else {
                // Fallback if the user has an auth account but no profile doc
                dispatch(setFullUser({
                    user: { uid: user.uid, email: user.email },
                    name: user.email, // Use email as name
                    profilePic: '', // No picture
                }));
            }

            toast.success('Welcome back!');
            navigate(from, { replace: true });
        } catch (error) {
            toast.error(translateFirebaseError(error));
        } finally {
            setLoading(false);
        }
    };

    // --- FIX IN `signInWithProvider` ---
    const signInWithProvider = async (providerName) => {
        setLoading(true);
        // ... provider logic ...
        try {
            const { user } = await signInWithPopup(auth, provider);
            // ... check if user document exists and create if not ...

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                dispatch(setFullUser({
                    user: { uid: user.uid, email: user.email },
                    name: profileData.name,
                    profilePic: profileData.profilePic,
                }));
            }

            toast.success('Successfully signed in!');
            navigate(from, { replace: true });
        } catch (error) {
            // ... error handling
        } finally {
            setLoading(false);
        }
    };

    // ... signUpWithEmail is already correct from the previous step ...

    return { signInWithEmail, signUpWithEmail, signInWithProvider, loading };
};