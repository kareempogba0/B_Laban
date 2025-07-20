import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import { Search, Filter, X, CakeSlice, Cookie } from "lucide-react";
import { m } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";

function Products() {
  // State management remains the same
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCounts, setVisibleCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    priceRange: { min: "", max: "" },
    dietaryNeeds: [],
    flavors: [],
    occasions: [],
    inStock: false,
  });

  const dietaryOptions = useMemo(() => ['Gluten-Free', 'Vegan', 'Nut-Free', 'Sugar-Free', 'Dairy-Free'], []);
  const flavorOptions = useMemo(() => ['Chocolate', 'Vanilla', 'Fruity', 'Caramel', 'Coffee', 'Red Velvet', 'Mango'], []);
  const occasionOptions = useMemo(() => ['Birthday', 'Wedding', 'Anniversary', 'Party', 'Everyday Treat'], []);

  const dispatch = useDispatch();

  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash += str.charCodeAt(i);
    }
    return hash;
  };

  const ALLOWED_BANNERS = [1, 2, 4, 5, 6];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Your caching logic is good, no changes needed here.
        const cachedProducts = sessionStorage.getItem('products_cache');
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setLoading(false);
          console.log("Using cached dessert data.");
          return;
        }

        console.log("Fetching fresh dessert data...");
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsArray);
        sessionStorage.setItem('products_cache', JSON.stringify(productsArray));
        console.log(`Successfully fetched ${productsArray.length} desserts`);
      } catch (error) {
        console.error("Error fetching desserts:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: { min: "", max: "" },
      dietaryNeeds: [],
      flavors: [],
      occasions: [],
      inStock: false,
    });
  };

  // --- IMPORTANT: DATA STRUCTURE REQUIREMENT ---
  // For products to appear in these categories, your Firestore documents
  // MUST have a 'type' field with a value that EXACTLY matches one of these strings.
  // Example: A product document should have -> "type": "Cakes & Pastries"
  const categoriesOrder = useMemo(() => [
    "Cakes & Pastries",
    "Cupcakes",
    "Cookies & Brownies",
    "Ice Cream & Sorbets",
    "Chocolates & Confections",
    "Pies & Tarts",
    "Specialty Desserts",
    "Beverages",
  ], []);

  const categorizedProducts = useMemo(() => {
    console.log("Products from state to be categorized:", products);

    const processedProducts = products.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : 0,
      stock: product.stock ? parseInt(product.stock, 10) : 0,
    }));

    return categoriesOrder.map((category) => ({
      category,
      items: processedProducts.filter((product) => {
        // --- THIS IS THE CRITICAL CHECK ---
        // If product.type does not match the category string, it will not appear.
        if (product.type !== category) {
          return false;
        }

        // Apply filters
        if (filters.priceRange.min && product.price < parseFloat(filters.priceRange.min)) return false;
        if (filters.priceRange.max && product.price > parseFloat(filters.priceRange.max)) return false;
        if (filters.inStock && product.stock <= 0) return false;

        if (filters.dietaryNeeds.length > 0 && !filters.dietaryNeeds.every(need => (product.dietaryTags || []).includes(need))) return false;
        if (filters.flavors.length > 0 && !filters.flavors.every(flavor => (product.flavorTags || []).includes(flavor))) return false;
        if (filters.occasions.length > 0 && !filters.occasions.every(occasion => (product.occasionTags || []).includes(occasion))) return false;

        // Apply search term
        if (searchTerm === "") return true;
        const term = searchTerm.toLowerCase();
        return (
            product.name?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            product.flavorTags?.some(tag => tag.toLowerCase().includes(term))
        );
      }),
    }));
  }, [products, searchTerm, categoriesOrder, filters]);

  const handleLoadMore = useCallback((category) => {
    setVisibleCounts(prev => ({ ...prev, [category]: (prev[category] || 4) + 4 }));
  }, []);

  const handleAddToCart = useCallback((product) => {
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  }, [dispatch]);

  // --- THEME CHANGE: Blue and White Loading State ---
  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-blue-700 font-semibold">Loading our delicious treats...</p>
        </div>
    );
  }

  return (
      <m.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          // --- THEME CHANGE: Light gray background for depth ---
          className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen"
      >
        {/* --- THEME CHANGE: Blue heading --- */}
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">
          Explore Our Sweet Treats
        </h1>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-grow relative">
              <input
                  type="text"
                  placeholder="Search for cakes, cookies, flavors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // --- THEME CHANGE: Blue focus ring ---
                  className="w-full p-4 pr-12 text-gray-900 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <button
                onClick={() => setShowFilters(!showFilters)}
                // --- THEME CHANGE: Blue active state for filter button ---
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${
                    showFilters
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white border border-gray-300 hover:bg-gray-100'
                }`}
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
              <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* --- THEME CHANGE: Blue focus rings and checkboxes --- */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.priceRange.min} onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"/>
                      <input type="number" placeholder="Max" value={filters.priceRange.max} onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Needs</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {dietaryOptions.map(option => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-1 rounded">
                            <input type="checkbox" checked={filters.dietaryNeeds.includes(option)} onChange={(e) => { const newValues = e.target.checked ? [...filters.dietaryNeeds, option] : filters.dietaryNeeds.filter(v => v !== option); handleFilterChange('dietaryNeeds', newValues); }} className="rounded text-blue-600 focus:ring-blue-500"/>
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flavors</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {flavorOptions.map(option => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-1 rounded">
                            <input type="checkbox" checked={filters.flavors.includes(option)} onChange={(e) => { const newValues = e.target.checked ? [...filters.flavors, option] : filters.flavors.filter(v => v !== option); handleFilterChange('flavors', newValues); }} className="rounded text-blue-600 focus:ring-blue-500"/>
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occasions</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {occasionOptions.map(option => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-1 rounded">
                            <input type="checkbox" checked={filters.occasions.includes(option)} onChange={(e) => { const newValues = e.target.checked ? [...filters.occasions, option] : filters.occasions.filter(v => v !== option); handleFilterChange('occasions', newValues); }} className="rounded text-blue-600 focus:ring-blue-500"/>
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Other</h3>
                      <label className="flex items-center space-x-2 cursor-pointer p-1 rounded">
                        <input type="checkbox" checked={filters.inStock} onChange={(e) => handleFilterChange('inStock', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                        <span className="text-sm text-gray-700">In Stock Only</span>
                      </label>
                    </div>
                    <button onClick={resetFilters} className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 underline font-semibold text-left">
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </m.div>
          )}
        </div>

        {/* Product Categories */}
        {categorizedProducts.map(({ category, items }, index) => {
          if (items.length === 0) return null;
          const visibleItems = items.slice(0, visibleCounts[category] || 4);
          const categoryHash = simpleHash(category);
          const bannerArrayIndex = categoryHash % ALLOWED_BANNERS.length;
          const bannerIndex = ALLOWED_BANNERS[bannerArrayIndex];
          const bannerImage = `/banners/${(bannerIndex % 6) + 1}.webp`;

          return (
              <div key={category} className="mb-12 bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="relative h-48 md:h-60 overflow-hidden group">
                  <img src={bannerImage} alt={`${category} banner`} className="w-full h-full object-fill transition-transform duration-500 transform group-hover:scale-110" loading="lazy"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h2 className="absolute bottom-5 left-5 text-3xl font-bold text-white capitalize">{category}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleItems.map((product) => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart}/>
                    ))}
                  </div>
                  {items.length > visibleItems.length && (
                      <div className="flex justify-center mt-8">
                        <m.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2 font-semibold shadow-md"
                            onClick={() => handleLoadMore(category)}
                        >
                          <span>Show More {category}</span>
                          <CakeSlice size={18} />
                        </m.button>
                      </div>
                  )}
                </div>
              </div>
          );
        })}

        {/* --- THEME CHANGE: Blue "No Results" message --- */}
        {categorizedProducts.every(cat => cat.items.length === 0) && !loading && (
            <div className="text-center text-gray-600 mt-12 p-8 bg-white rounded-lg shadow-md">
              <Cookie className="mx-auto text-blue-400 mb-4" size={48} />
              <p className="text-xl font-semibold text-blue-800">No treats found!</p>
              <p className="text-gray-500">Try adjusting your search or filters to find your perfect dessert.</p>
            </div>
        )}
      </m.div>
  );
}

export default Products;