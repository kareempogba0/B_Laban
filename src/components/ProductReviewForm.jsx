import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import {
  doc,
  addDoc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { Star, AlertCircle } from 'lucide-react';

/**
 * ProductReviewForm component allows users to submit reviews for products
 * they've purchased and received.
 *
 * @param {Object} props - Component props
 * @param {string} props.productId - ID of the product to review
 * @param {Function} props.onReviewSubmitted - Callback function when review is submitted
 * @returns {JSX.Element} The ProductReviewForm component
 */
function ProductReviewForm({ productId, onReviewSubmitted }) {
  const [user] = useAuthState(auth);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Check if user has purchased and received the product
   * and if they've already reviewed it
   */
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || !productId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Check if user has already reviewed this product (this query is correct)
        const reviewsQuery = query(
            collection(db, "reviews"),
            where("userId", "==", user.uid),
            where("productId", "==", productId)
        );
        const reviewSnapshot = await getDocs(reviewsQuery);

        if (!reviewSnapshot.empty) {
          setHasReviewed(true);
          setErrorMessage("You've already reviewed this product.");
          setCanReview(false);
          return; // Stop here if already reviewed
        }

        // 2. Check if the user has purchased and received this product
        // --- THIS IS THE NEW, MORE EFFICIENT QUERY ---
        const ordersQuery = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            where("status", "==", "Delivered"),
            // This directly checks if the 'items' array contains an object with this productId
            where("items", "array-contains", { productId: productId })
        );

        const ordersSnapshot = await getDocs(ordersQuery);

        // If the query returns any documents, it means they purchased it.
        if (!ordersSnapshot.empty) {
          setCanReview(true);
          setErrorMessage(''); // Clear any previous errors
        } else {
          setCanReview(false);
          setErrorMessage("You can only review products you've purchased and received.");
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        // This error often means you need to create a Firestore index
        if (error.code === 'failed-precondition') {
          setErrorMessage("Database requires a new index for this query. Please check the console for a link to create it.");
        } else {
          setErrorMessage("An error occurred while checking eligibility.");
        }
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [user, productId]);
  /**
   * Submit a review for the product
   */
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to submit a review.");
      return;
    }

    if (!canReview) {
      toast.error(errorMessage || "You can't review this product.");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    if (reviewText.trim().length === 0) {
      toast.error("Please enter your review.");
      return;
    }

    if (reviewText.length > 500) {
      toast.error("Review must be 500 characters or less.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user profile to include name and profile pic in review
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Create the review data
      const reviewData = {
        userId: user.uid,
        productId,
        rating,
        text: reviewText,
        userName: userData.name || user.displayName || user.email,
        userProfilePic: userData.profilePic || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add to main reviews collection
      const reviewRef = await addDoc(collection(db, "reviews"), reviewData);

      // Also add to the product's reviews subcollection
      await addDoc(collection(db, "products", productId, "reviews"), {
        ...reviewData,
        reviewId: reviewRef.id // Link to main review document
      });

      // Reset form
      setRating(0);
      setReviewText('');

      // Set has reviewed to prevent multiple submissions
      setHasReviewed(true);
      setCanReview(false);

      toast.success("Your review was submitted successfully!");

      // Call the callback function if provided
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Star rating component that allows hovering and selecting stars
   */
  const StarRating = () => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none mr-1"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              size={24}
              fill={(hoveredRating >= star || rating >= star) ? "#F59E0B" : "none"}
              stroke={(hoveredRating >= star || rating >= star) ? "#F59E0B" : "#D1D5DB"}
              className="transition-transform hover:scale-110"
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-gray-700 font-medium">{rating}/5</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
          <p className="ml-3 text-gray-500">Checking eligibility...</p>
        </div>
    );
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <AlertCircle className="text-blue-500 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="font-medium text-blue-700">Sign in to leave a review</h3>
            <p className="text-blue-600 mt-1 text-sm">
              Please sign in to share your experience with this product.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If already reviewed, show message
  if (hasReviewed) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <Star className="text-green-500 mt-0.5 mr-3" fill="#10B981" size={20} />
          <div>
            <h3 className="font-medium text-green-700">You've already reviewed this product</h3>
            <p className="text-green-600 mt-1 text-sm">
              You can view and edit your review in your account dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If can't review (hasn't purchased/received), show error
  if (!canReview) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <AlertCircle className="text-amber-500 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="font-medium text-amber-700">Cannot review this product</h3>
            <p className="text-amber-600 mt-1 text-sm">
              {errorMessage || "You can only review products you've purchased and received."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg p-5 mt-6 bg-white shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmitReview} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Rating
          </label>
          <StarRating />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What did you think about this product? Share your experience to help other shoppers."
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">
            {reviewText.length}/500 characters
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className={`px-5 py-2 rounded-md text-white font-medium ${
            isSubmitting || rating === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">⟳</span>
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
}

export default ProductReviewForm; 