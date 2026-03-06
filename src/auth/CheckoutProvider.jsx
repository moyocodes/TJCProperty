import { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useProducts } from "@/components/auth/ProductsProvider";
import { useAuth } from "@/components/auth/AuthProvider";

const CheckoutContext = createContext(undefined);

export function CheckoutProvider({ children }) {
  const [searchParams] = useSearchParams();
  const checkoutIdFromUrl = searchParams.get("id");

  const { cart, getCartTotal, guestUserId, cartLoaded } = useProducts();
  const { user, getBillingInfo } = useAuth();

  // Loading states
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // Checkout state
  const [checkoutId, setCheckoutId] = useState(checkoutIdFromUrl || null);
  const [step, setStep] = useState(1);

  // Contact form
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  // Returning customer
  const [isReturning, setIsReturning] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Billing form
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
  });
  const [useSavedBilling, setUseSavedBilling] = useState(false);
  const [savedBillingOptions, setSavedBillingOptions] = useState([]);

  // Initialize checkout data
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);

      try {
        // Load checkout from URL if exists
        if (checkoutIdFromUrl) {
          await loadCheckoutFromFirebase(checkoutIdFromUrl);
        }

        // Load saved billing info for logged-in users
        if (user) {
          const savedBilling = getBillingInfo();
          if (savedBilling && savedBilling.length > 0) {
            setSavedBillingOptions(savedBilling);
          }
          if (user.email) {
            setEmail(user.email);
          }
        }
      } catch (error) {
        console.error("Error initializing checkout:", error);
      } finally {
        // Small delay to ensure cart is loaded
        setTimeout(() => {
          setIsInitializing(false);
        }, 300);
      }
    };

    initialize();
  }, [checkoutIdFromUrl, user]);

  // Auto-save checkout data to Firebase
  useEffect(() => {
    if (
      !isInitializing &&
      cart.length > 0 &&
      (email || phone || billingInfo.fullName)
    ) {
      const timer = setTimeout(() => {
        saveCheckoutToFirebase({ guestUserId });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cart, email, phone, billingInfo, isInitializing, guestUserId]);

  const loadCheckoutFromFirebase = async (id) => {
    try {
      const checkoutRef = doc(db, "checkouts", id);
      const checkoutSnap = await getDoc(checkoutRef);

      if (checkoutSnap.exists()) {
        const data = checkoutSnap.data();
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.billingInfo) setBillingInfo(data.billingInfo);
        setCheckoutId(id);
      }
    } catch (error) {
      console.error("Error loading checkout:", error);
    }
  };

  const saveCheckoutToFirebase = async ({ userId, guestUserId }) => {
    try {
      const checkoutData = {
        cart: cart,
        total: getCartTotal(),
        email: email || null,
        phone: phone || null,
        billingInfo: billingInfo.fullName ? billingInfo : null,
        userId: userId || null,
        guestUserId: guestUserId || null,
        status: "pending",
        updatedAt: serverTimestamp(),
      };

      if (checkoutId) {
        const checkoutRef = doc(db, "checkouts", checkoutId);
        await updateDoc(checkoutRef, checkoutData);
      } else {
        checkoutData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "checkouts"), checkoutData);
        const newCheckoutId = docRef.id;
        setCheckoutId(newCheckoutId);
        window.history.replaceState(null, "", `/checkout?id=${newCheckoutId}`);
      }
    } catch (error) {
      console.error("Error saving checkout:", error);
    }
  };

  const value = {
    isInitializing,
    loading,
    setLoading,
    checkoutId,
    step,
    setStep,
    email,
    setEmail,
    phone,
    setPhone,
    createAccount,
    setCreateAccount,
    password,
    setPassword,
    isReturning,
    setIsReturning,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    billingInfo,
    setBillingInfo,
    useSavedBilling,
    setUseSavedBilling,
    savedBillingOptions,
    saveCheckoutToFirebase,
    loadCheckoutFromFirebase,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
