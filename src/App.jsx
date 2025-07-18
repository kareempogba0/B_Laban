import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProductView from "./pages/ProductView";
import Cart from "./pages/Cart";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import MyAccount from "./pages/Profile";
import UnifiedCheckout from "./pages/Checkout/UnifiedCheckout";
import Products from "./pages/Products";
import Wishlist from "./pages/Wishlist";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AnnouncementStrip from "./components/AnnouncementStrip";
import { auth, db } from "./firebase/config"; // --- Import db ---
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // --- Import Firestore functions ---
import { useDispatch } from "react-redux";
// --- FIX: Import the correct actions ---
import { setFullUser, clearUser } from "./redux/userSlice";
import { useContentLoader } from "./hooks/useContentLoader";
import "react-toastify/dist/ReactToastify.css";
import PasswordReset from './pages/PasswordReset';
import OrderSummary from './pages/OrderSummary';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { HelmetProvider } from 'react-helmet-async';
import { LazyMotion, domAnimation } from "framer-motion";

function App() {
  const dispatch = useDispatch();

  const {
    isLoading,
    loadingProgress,
    loadingStates,
    errors,
    markAuthLoaded,
    forceComplete
  } = useContentLoader();

  const isBotOrCrawler = () => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    const botPatterns = ['googlebot', 'bingbot', 'yandex', 'baiduspider', 'twitterbot', 'facebookexternalhit', 'linkedinbot', 'discordbot', 'slackbot', 'bot', 'spider', 'crawl'];
    const userAgent = navigator.userAgent.toLowerCase();
    return botPatterns.some(pattern => userAgent.indexOf(pattern) !== -1);
  };

  // --- THIS IS THE CORRECTED AUTHENTICATION LOGIC ---
  useEffect(() => {
    if (isBotOrCrawler()) {
      markAuthLoaded();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        // User is signed in, so we fetch their full profile from Firestore
        const userDocRef = doc(db, 'users', userAuth.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData = userDoc.data();
          // Dispatch the complete profile to the Redux store
          dispatch(
              setFullUser({
                user: { uid: userAuth.uid, email: userAuth.email },
                name: profileData.name,
                profilePic: profileData.profilePic,
              })
          );
        } else {
          // This is a fallback case if auth exists but Firestore doc doesn't
          console.warn("User authenticated but no profile document found. Dispatching with basic info.");
          dispatch(
              setFullUser({
                user: { uid: userAuth.uid, email: userAuth.email },
                name: userAuth.email, // Use email as a fallback name
                profilePic: '', // No picture available
              })
          );
        }
      } else {
        // User is signed out, clear the user state
        dispatch(clearUser());
      }

      // Mark authentication as loaded to hide the loading screen
      markAuthLoaded();
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, [dispatch, markAuthLoaded]);


  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        forceComplete();
      }
    };
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [forceComplete]);

  if (isLoading && !isBotOrCrawler()) {
    return (
        <LoadingScreen
            message="Preparing your shopping experience"
            progress={loadingProgress}
            showTips={true}
            loadingStates={loadingStates}
            errors={errors}
        />
    );
  }

  return (
      <LazyMotion features={domAnimation}>
        <HelmetProvider>
          <GoogleReCaptchaProvider reCaptchaKey="6LdQtjcrAAAAAB-gw9QaVLt8zIUTcvWAjCmlVwDs" scriptProps={{ async: true, defer: true, appendTo: 'head' }} language="en" useRecaptchaNet={true} useEnterprise={false} scriptLoadingTimeout={10000}>
            <Router>
              <ScrollToTop />
              <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" limit={3} icon={true} className="mt-16"/>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <AnnouncementStrip />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductView />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
                    <Route path="/my-account/:section" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/checkout" element={<UnifiedCheckout />} />
                    <Route path="/summary" element={<OrderSummary />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </GoogleReCaptchaProvider>
        </HelmetProvider>
      </LazyMotion>
  );
}

export default App;