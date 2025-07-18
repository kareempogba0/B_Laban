import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Ensure getDoc is imported
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
// --- THIS IS THE FIX: Import 'setFullUser' instead of 'setUser' ---
import { setFullUser } from "../redux/userSlice";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { m } from "framer-motion";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, github: false });
  const [recaptchaChecking, setRecaptchaChecking] = useState(false);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const from = location.state?.from?.pathname || "/";

  // reCAPTCHA logic can remain as is.
  const verifyRecaptchaToken = async () => {
    if (captchaUnavailable || !executeRecaptcha) return true;
    setRecaptchaChecking(true);
    try {
      await executeRecaptcha('signin');
      return true;
    } catch (error) {
      toast.error("Could not verify you are human.");
      return true;
    } finally {
      setRecaptchaChecking(false);
    }
  };

  // This helper function fetches the profile and dispatches the correct action.
  const dispatchFullUserProfile = async (user) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    let profileData;
    if (userDoc.exists()) {
      profileData = userDoc.data();
    } else {
      // This handles social sign-in for a user who doesn't have a doc yet.
      console.warn("No user document found, creating one for social sign-in user.");
      const defaultProfile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email,
        profilePic: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
      };
      await setDoc(userDocRef, defaultProfile, { merge: true });
      profileData = defaultProfile;
    }

    // Dispatch the full profile to Redux
    dispatch(
        setFullUser({
          user: { uid: user.uid, email: user.email },
          name: profileData.name,
          profilePic: profileData.profilePic,
        })
    );
  };

  // --- FIX APPLIED HERE ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!(await verifyRecaptchaToken())) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Call the helper to fetch profile and dispatch 'setFullUser'
      await dispatchFullUserProfile(userCredential.user);
      toast.success("Sign in successful!");
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error signing in:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- FIX APPLIED HERE ---
  const handleSocialSignIn = async (providerType) => {
    setSocialLoading(prev => ({ ...prev, [providerType]: true }));
    const provider = providerType === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      // Call the helper to fetch profile and dispatch 'setFullUser'
      await dispatchFullUserProfile(result.user);
      toast.success("Sign in successful!");
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error with social sign in:", error);
      toast.error(error.message || "An error occurred.");
    } finally {
      setSocialLoading(prev => ({ ...prev, [providerType]: false }));
    }
  };

  useEffect(() => {
    let captchaTimeout;
    if (!executeRecaptcha) {
      captchaTimeout = setTimeout(() => {
        if (!executeRecaptcha) setCaptchaUnavailable(true);
      }, 5000);
    }
    return () => clearTimeout(captchaTimeout);
  }, [executeRecaptcha]);

  return (
      <m.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeInOut" }} className="container mx-auto px-4 py-8 bg-gray-50">
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <form onSubmit={handleSignIn} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold text-center mb-6">Sign In</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-4 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <button type="submit" className={`w-full bg-blue-600 text-white py-2 rounded-lg font-semibold transition-all duration-200 ${loading || recaptchaChecking ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`} disabled={loading || recaptchaChecking}>
              {loading ? "Processing..." : recaptchaChecking ? "Verifying..." : "Sign In"}
            </button>

            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => handleSocialSignIn('google')} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-200" disabled={socialLoading.google || recaptchaChecking}>
                {socialLoading.google ? "Processing..." : "Sign in with Google"}
              </button>
              <button type="button" onClick={() => handleSocialSignIn('github')} className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition duration-200" disabled={socialLoading.github || recaptchaChecking}>
                {socialLoading.github ? "Processing..." : "Sign in with Github"}
              </button>
            </div>
            <p className="mt-4 text-center text-gray-600">
              Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
            </p>
            <p className="mt-2 text-center text-gray-600">
              <Link to="/password-reset" className="text-blue-600 hover:underline">Forgot your password?</Link>
            </p>
          </form>
        </div>
      </m.div>
  );
}

export default SignIn;