import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { Star, Edit2, Trash2, AlertCircle, ShoppingBag, Package2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function UserReviews() {
  const [user] = useAuthState(auth);
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [loadingReviewable, setLoadingReviewable] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newReview, setNewReview] = useState({ productId: '', text: '', rating: 0 });
  const [isSubmittingNewReview, setIsSubmittingNewReview] = useState(false);

  // --- This helper function safely converts a Firestore Timestamp to a JS Date ---
  const timestampToDate = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Return null or a default date if the timestamp is invalid
    return null;
  };

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const reviewsSnapshot = await getDocs(reviewsQuery);

        const reviewsWithProducts = await Promise.all(reviewsSnapshot.docs.map(async (reviewDoc) => {
          const reviewData = reviewDoc.data();
          const productDoc = await getDoc(doc(db, "products", reviewData.productId));

          if (productDoc.exists()) {
            return {
              id: reviewDoc.id,
              ...reviewData,
              product: { id: productDoc.id, ...productDoc.data() },
              // --- FIX: Safely convert timestamps ---
              createdAt: timestampToDate(reviewData.createdAt) || new Date(),
              updatedAt: timestampToDate(reviewData.updatedAt),
            };
          }
          return null;
        }));

        setReviews(reviewsWithProducts.filter(Boolean));
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        toast.error("Failed to load your reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [user]);

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      if (!user) return;
      setLoadingReviewable(true);
      try {
        const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid), where("status", "==", "Delivered"));
        const ordersSnapshot = await getDocs(ordersQuery);

        const productIds = new Set();
        ordersSnapshot.forEach(orderDoc => {
          orderDoc.data().items?.forEach(item => productIds.add(item.productId));
        });

        const alreadyReviewedIds = new Set(reviews.map(r => r.productId));

        const reviewableProductIds = [...productIds].filter(id => !alreadyReviewedIds.has(id));

        const reviewableProductsData = await Promise.all(reviewableProductIds.map(async (id) => {
          const productDoc = await getDoc(doc(db, "products", id));
          return productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } : null;
        }));

        setReviewableProducts(reviewableProductsData.filter(Boolean));
      } catch (error) {
        console.error("Error fetching reviewable products:", error);
      } finally {
        setLoadingReviewable(false);
      }
    };

    // Run this effect when user is available or their reviews change
    if (user && !loading) {
      fetchDeliveredOrders();
    }
  }, [user, reviews, loading]);

  const saveEditedReview = async () => {
    if (!editingReview) return;

    try {
      // ... your validation logic is good ...

      const reviewRef = doc(db, "reviews", editingReview.id);
      const updatedData = {
        text: editReviewText,
        rating: editRating,
        updatedAt: Timestamp.now() // Use Firestore timestamp for writing
      };

      await updateDoc(reviewRef, updatedData);

      const productReviewRef = doc(db, "products", editingReview.productId, "reviews", editingReview.id);
      if ((await getDoc(productReviewRef)).exists()) {
        await updateDoc(productReviewRef, updatedData);
      }

      setReviews(reviews.map(review =>
          review.id === editingReview.id
              ? { ...review, text: editReviewText, rating: editRating, updatedAt: new Date() } // Update local state with a JS Date
              : review
      ));

      setEditingReview(null);
      toast.success("Review updated successfully!");
    } catch (error) {
      toast.error("Failed to update review.");
    }
  };

  const handleSubmitNewReview = async (e) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    // ... your validation logic is good ...

    setIsSubmittingNewReview(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const reviewData = {
        userId: user.uid,
        productId: selectedProduct.id,
        rating: newReview.rating,
        text: newReview.text,
        userName: userData.name || 'Anonymous',
        userProfilePic: userData.profilePic || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const reviewRef = await addDoc(collection(db, "reviews"), reviewData);
      await addDoc(collection(db, "products", selectedProduct.id, "reviews"), { ...reviewData, reviewId: reviewRef.id });

      const newReviewForState = {
        id: reviewRef.id,
        ...reviewData,
        product: selectedProduct,
        createdAt: new Date(), // Use JS date for local state
        updatedAt: new Date(),
      };

      setReviews([newReviewForState, ...reviews]);
      setSelectedProduct(null);
      setNewReview({ productId: '', text: '', rating: 0 });

      toast.success("Review submitted!");
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmittingNewReview(false);
    }
  };

  const resolveImageUrl = (product) => {
    const imageUrl = product?.image || product?.imageUrl;
    if (!imageUrl) return 'https://via.placeholder.com/150?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.REACT_APP_IMAGE_BASE_URL || window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- Other handlers like handleDeleteReview, handleSelectProduct, StarRating remain here ---
  // They are likely correct and don't need changes.

  if (loading) { /* ... Loading UI ... */ }

  return (
      <div className="space-y-8">
        {/* ... Reviewable Products Section JSX (This section seems fine) ... */}

        <div className="mt-8">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Your Past Reviews</h3>

          {reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p>You haven't reviewed any products yet.</p>
              </div>
          ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white border rounded-lg p-5">
                      {editingReview?.id === review.id ? (
                          // Edit mode JSX (seems fine)
                          <div> {/* ... */} </div>
                      ) : (
                          // View mode JSX
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <img
                                    src={resolveImageUrl(review.product)}
                                    alt={review.product.name}
                                    className="w-16 h-16 object-cover rounded-md"
                                />
                                <div>
                                  <h4 className="font-medium">{review.product.name}</h4>
                                  {/* ... StarRating component */}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(review.createdAt)}
                                    {/* --- FIX: No more .toDate() calls --- */}
                                    {review.updatedAt && review.updatedAt > review.createdAt &&
                                        ` (edited ${formatDate(review.updatedAt)})`}
                                  </p>
                                </div>
                              </div>
                              {/* Edit/Delete buttons */}
                            </div>
                            <div className="mt-3 text-gray-700">
                              <p>{review.text}</p>
                            </div>
                          </div>
                      )}
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}

export default UserReviews;