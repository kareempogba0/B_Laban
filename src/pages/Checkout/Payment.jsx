import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/config.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Assuming these paths are correct in your project structure
import VisaLogo from '../../assets/visa.png';
import MasterCardLogo from '../../assets/mastercard.png';
import RuPayLogo from '../../assets/rupay.png';
import AMEXLogo from '../../assets/amex.png';

// Lucide icons for a cleaner UI
import { CreditCard, Trash2, CheckCircle, PlusCircle } from 'lucide-react';

function CheckoutPayment() {
  const [user, loadingAuth] = useAuthState(auth);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [card, setCard] = useState({ number: '', cvv: '', expiry: '', type: 'Unknown' });
  const [upi, setUpi] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const navigate = useNavigate();

  // --- FIX: Corrected useEffect pattern for fetching data ---
  useEffect(() => {
    // Define the async function inside the effect
    const fetchPaymentMethods = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const savedMethods = userData.paymentMethods || [];
            setPaymentMethods(savedMethods);

            // Pre-fill form with the first available saved method
            const cardMethod = savedMethods.find(method => method.cardNumber);
            if (cardMethod) {
              setCard({
                number: cardMethod.cardNumber,
                cvv: cardMethod.cvv || '',
                expiry: cardMethod.expiry || '',
                type: cardMethod.type || 'Unknown',
              });
              setPaymentMethod('Card');
            } else {
              const upiMethod = savedMethods.find(method => method.upi);
              if (upiMethod) {
                setUpi(upiMethod.upi);
                setPaymentMethod('UPI');
              }
            }
          }
        } catch (error) {
          console.error("Error fetching payment methods:", error);
          toast.error("Failed to load saved payment methods.");
        }
      }
    };

    // Call the async function
    fetchPaymentMethods();
  }, [user]); // This effect correctly depends only on the user object

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  // --- IMPROVEMENT: More robust card detection ---
  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\s+/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'MasterCard';
    if (cleanNumber.startsWith('6')) return 'RuPay';
    if (/^3[47]/.test(cleanNumber)) return 'AMEX';
    return 'Unknown';
  };

  const handleCardNumberChange = (e) => {
    const formattedNumber = formatCardNumber(e.target.value);
    const detectedType = detectCardType(formattedNumber);
    setCard({ ...card, number: formattedNumber, type: detectedType });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to manage payment methods.");
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error("User profile not found.");

      const existingMethods = userDoc.data().paymentMethods || [];
      let updatedMethods;

      if (paymentMethod === 'Card') {
        if (!/^\d{3,4}$/.test(card.cvv)) throw new Error("Invalid CVV.");
        if (!/^(0[1-9]|1[0-2])\/?([2-9][0-9])$/.test(card.expiry)) throw new Error("Invalid expiry date (MM/YY).");

        // Remove any existing card with the same last 4 digits
        updatedMethods = existingMethods.filter(m => !m.cardNumber || m.cardNumber.slice(-4) !== card.number.slice(-4));
        updatedMethods.push({
          cardNumber: card.number.replace(/\s+/g, ''),
          cvv: card.cvv,
          expiry: card.expiry,
          type: card.type
        });
      } else { // UPI
        if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi)) throw new Error("Invalid UPI ID format.");

        // Remove any existing UPI with the same ID
        updatedMethods = existingMethods.filter(m => m.upi !== upi);
        updatedMethods.push({ upi });
      }

      await updateDoc(userRef, { paymentMethods: updatedMethods });

      toast.success("Payment method saved successfully!");
      // --- IMPROVEMENT: Navigate to the relevant account page ---
      navigate('/my-account/payment-methods');
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error(error.message || "Failed to save payment method.");
    } finally {
      setLoading(false);
    }
  };

  const getCardLogo = (type) => {
    switch (type) {
      case 'Visa': return <img src={VisaLogo} alt="Visa" className="w-12" />;
      case 'MasterCard': return <img src={MasterCardLogo} alt="MasterCard" className="w-12" />;
      case 'RuPay': return <img src={RuPayLogo} alt="RuPay" className="w-12" />;
      case 'AMEX': return <img src={AMEXLogo} alt="AMEX" className="w-12" />;
      default: return <CreditCard className="w-12 h-12 text-gray-300" />;
    }
  };

  if (loadingAuth) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
    );
  }

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Manage Payment Methods</h1>

          {paymentMethods.length > 0 && (
              <div className="mb-8 space-y-3">
                <h2 className="text-lg font-semibold text-gray-700">Your Saved Methods</h2>
                {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getCardLogo(method.type || (method.upi && 'UPI'))}
                        <div>
                          <p className="font-medium text-gray-800">
                            {method.cardNumber ? `${method.type} ending in ${method.cardNumber.slice(-4)}` : method.upi}
                          </p>
                          {method.expiry && <p className="text-xs text-gray-500">Expires {method.expiry}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => {/* Logic to remove method */}} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                ))}
              </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <PlusCircle size={20} className="mr-2 text-blue-500"/>
              Add or Update a Method
            </h2>

            <div className="flex mb-6 rounded-lg border">
              <button onClick={() => setPaymentMethod('Card')} className={`flex-1 py-2 px-4 flex justify-center items-center gap-2 rounded-l-lg ${paymentMethod === 'Card' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
                <CreditCard size={18} /> Card
              </button>
              <button onClick={() => setPaymentMethod('UPI')} className={`flex-1 py-2 px-4 flex justify-center items-center gap-2 rounded-r-lg ${paymentMethod === 'UPI' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
                UPI
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {paymentMethod === 'Card' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Card Number</label>
                      <div className="relative">
                        <input type="text" placeholder="1234 5678 9012 3456" value={card.number} onChange={handleCardNumberChange} required className="w-full mt-1 p-3 border rounded-lg pr-14" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{getCardLogo(card.type)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Expiry (MM/YY)</label>
                        <input type="text" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} required className="w-full mt-1 p-3 border rounded-lg" maxLength={5} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">CVV</label>
                        <input type="text" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} required className="w-full mt-1 p-3 border rounded-lg" maxLength={4} />
                      </div>
                    </div>
                  </>
              ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                    <input type="text" placeholder="username@upi" value={upi} onChange={(e) => setUpi(e.target.value)} required className="w-full mt-1 p-3 border rounded-lg"/>
                  </div>
              )}

              <div className="pt-4">
                <button type="submit" disabled={loading} className={`w-full flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition ${loading ? 'opacity-50' : 'hover:bg-blue-700'}`}>
                  {loading ? 'Saving...' : 'Save and Continue'}
                  {!loading && <CheckCircle size={20} className="ml-2"/>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}

export default CheckoutPayment;