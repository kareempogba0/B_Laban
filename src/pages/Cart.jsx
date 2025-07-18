import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { removeFromCart, updateQuantity } from '../redux/cartSlice';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';

/**
 * Cart component that displays cart items and popular products recommendation
 */
function Cart() {
  const cartItems = useSelector(state => state.cart.items);
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCol = collection(db, "products");
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            price: data.price !== undefined ? parseFloat(data.price) : 0,
            mrp: data.mrp !== undefined ? parseFloat(data.mrp) : null,
            stock: data.stock !== undefined ? parseInt(data.stock, 10) : 0
          };
        });

        setProducts(productList);

        const homeProducts = productList.filter(product => product.showOnHome);
        setPopularProducts(homeProducts);

      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return; // Prevent quantity from going below 1
    dispatch(updateQuantity({ productId, quantity }));
  };

  // useMemo will prevent re-calculating cart details on every render unless products or cartItems change
  const cartDetails = useMemo(() =>
          cartItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            return product ? { ...item, product } : null;
          }).filter(Boolean),
      [cartItems, products]
  );

  // Calculate total cost of items in cart
  const subtotal = useMemo(() =>
          cartDetails.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
      [cartDetails]
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // It handles both relative and absolute paths and checks for `image` or `imageUrl`.
  const resolveImageUrl = (product) => {
    const imageUrl = product.image || product.imageUrl; // Check for both fields
    if (!imageUrl) {
      return 'https://via.placeholder.com/150?text=No+Image'; // Return a fallback
    }
    if (imageUrl.startsWith("http") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // Assuming your assets are served from the public folder of your dev server
    return `${window.location.origin}${imageUrl}`;
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
    );
  }

  return (
      <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="bg-gray-50 min-h-screen"
      >
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Your Shopping Cart</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Review your items and proceed to checkout when you're ready.
            </p>
          </div>

          {cartItems.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-lg mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                  <ShoppingBag className="text-gray-500" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">
                  Explore our products and find something you like!
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
                >
                  Continue Shopping
                </Link>
              </div>
          ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">Cart Items ({cartDetails.length})</h2>
                      {/* Display Subtotal in the header */}
                      <div className="text-right">
                        <p className="text-gray-500">Subtotal</p>
                        <p className="font-bold text-xl text-gray-900">{formatPrice(subtotal)}</p>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {cartDetails.map(item => (
                          <div key={item.productId} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                              {/* --- FIX: Using the new resolveImageUrl function --- */}
                              <img
                                  src={resolveImageUrl(item.product)}
                                  alt={item.product.name}
                                  className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="flex-grow text-center sm:text-left">
                              <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{item.product.type}</p>
                              <p className="text-blue-600 font-semibold mt-2">{formatPrice(item.product.price)}</p>
                            </div>

                            <div className="flex items-center mt-4 sm:mt-0">
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="p-2 hover:bg-gray-100"><Minus size={16} /></button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="p-2 hover:bg-gray-100"><Plus size={16} /></button>
                              </div>
                              <button onClick={() => handleRemove(item.productId)} className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition" aria-label="Remove item">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary - Right Column */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Order Summary</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Taxes</span>
                        <span>Calculated at checkout</span>
                      </div>
                    </div>
                    <div className="border-t my-6"></div>
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                      <span>Estimated Total</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <Link
                        to="/checkout"
                        className="mt-6 w-full inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
                    >
                      Proceed to Checkout
                      <ChevronRight size={18} className="ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
          )}

          {popularProducts.length > 0 && (
              <div className="mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {popularProducts.slice(0, 4).map(product => (
                      <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
          )}
        </div>
      </m.div>
  );
}

export default Cart;