import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
  getDoc,
  limit, // ✅ add this
  runTransaction,
  increment,
} from "firebase/firestore";

import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import Cookies from "js-cookie";

const ProductsContext = createContext(null);

const CATEGORIES = [
  "All",
  "Necklace",
  "Earrings",
  "Rings",
  "Bracelets",
  "Sets",
];

const CART_KEY = "jovial_cart";
const GUEST_ID_KEY = "jovial_guest_id";
const CART_COOKIE = "jovial_cart_cookie";

// ✅ Simple helper to generate guest ID
const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ✅ SKU auto increment (reads last sku from DB)

// ✅ Safe localStorage wrapper
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [guestUserId, setGuestUserId] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const { user } = useAuth();
  const getNextSku = useCallback(async () => {
    const ref = doc(db, "meta", "counters");

    const next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);

      if (!snap.exists()) {
        tx.set(ref, { nextSku: 2 });
        return 1;
      }

      const current = Number(snap.data()?.nextSku || 1);
      tx.update(ref, { nextSku: current + 1 });
      return current;
    });

    return next;
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(toNumber(price, 0));

  const normalizeProduct = (p) => ({
    ...p,
    sku: toNumber(p.sku, 0), // ✅ add this
    price: toNumber(p.price, 0),
    stock: toNumber(p.stock, 0),
    variants: Array.isArray(p.variants) ? p.variants : [],
    extras: Array.isArray(p.extras) ? p.extras : [],
    customFields: Array.isArray(p.customFields) ? p.customFields : [],
    images: Array.isArray(p.images) ? p.images : [],
  });

  // ✅ Initialize guest ID on mount
  useEffect(() => {
    let guestId = Cookies.get(GUEST_ID_KEY) || storage.get(GUEST_ID_KEY);
    if (!guestId) {
      guestId = generateGuestId();
      Cookies.set(GUEST_ID_KEY, guestId, { expires: 365, path: "/" });
      storage.set(GUEST_ID_KEY, guestId);
      console.log("Created new guest ID:", guestId);
    } else {
      // Sync between cookie and localStorage
      Cookies.set(GUEST_ID_KEY, guestId, { expires: 365, path: "/" });
      storage.set(GUEST_ID_KEY, guestId);
    }
    setGuestUserId(guestId);
  }, []);

  // ✅ Load cart when guestUserId or user changes
  useEffect(() => {
    if (!guestUserId) return;

    const loadCart = async () => {
      try {
        if (user?.uid) {
          // ✅ Load user's saved cart from Firebase
          console.log("Loading cart for logged-in user:", user.uid);
          const userCartRef = doc(db, "user_carts", user.uid);
          const userCartSnap = await getDoc(userCartRef);

          if (userCartSnap.exists()) {
            const savedCart = userCartSnap.data().items || [];
            console.log(
              "Loaded user cart from Firebase:",
              savedCart.length,
              "items",
            );
            setCart(savedCart);

            // Also save to localStorage and cookies for quick access
            storage.set(CART_KEY, savedCart);
            Cookies.set(
              CART_COOKIE,
              JSON.stringify({ count: savedCart.length }),
              {
                expires: 30,
                path: "/",
              },
            );

            if (savedCart.length > 0) {
              toast.success(
                `Welcome back! ${savedCart.length} item(s) in your cart`,
              );
            }
          } else {
            // ✅ Check if guest had items before logging in
            const guestCart = storage.get(CART_KEY);
            if (guestCart && Array.isArray(guestCart) && guestCart.length > 0) {
              // Migrate guest cart to user
              console.log("Migrating guest cart to user account");
              await setDoc(userCartRef, {
                userId: user.uid,
                items: guestCart,
                updatedAt: new Date().toISOString(),
              });
              setCart(guestCart);
              toast.success(
                `Cart migrated! ${guestCart.length} item(s) saved to your account`,
              );
            } else {
              setCart([]);
            }
          }
        } else {
          // ✅ Load guest cart from localStorage
          const savedCart = storage.get(CART_KEY);
          if (savedCart && Array.isArray(savedCart)) {
            console.log(
              "Loaded guest cart from localStorage:",
              savedCart.length,
              "items",
            );
            setCart(savedCart);

            Cookies.set(
              CART_COOKIE,
              JSON.stringify({ count: savedCart.length }),
              {
                expires: 30,
                path: "/",
              },
            );

            if (savedCart.length > 0) {
              toast.success(
                `Welcome back! ${savedCart.length} item(s) in your cart`,
              );
            }
          } else {
            setCart([]);
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        // Fallback to localStorage
        const savedCart = storage.get(CART_KEY);
        if (savedCart && Array.isArray(savedCart)) {
          setCart(savedCart);
        }
      } finally {
        setCartLoaded(true);
      }
    };

    loadCart();
  }, [user?.uid, guestUserId]);

  // ✅ Save cart to localStorage, cookies, and Firebase (if user is logged in)
  useEffect(() => {
    if (!cartLoaded) return;

    const saveCart = async () => {
      try {
        // Always save to localStorage
        if (cart.length > 0) {
          storage.set(CART_KEY, cart);
          Cookies.set(CART_COOKIE, JSON.stringify({ count: cart.length }), {
            expires: 30,
            path: "/",
          });
          console.log("Cart saved to localStorage and cookies");
        } else {
          storage.remove(CART_KEY);
          Cookies.remove(CART_COOKIE, { path: "/" });
        }

        // ✅ If user is logged in, also save to Firebase
        if (user?.uid) {
          const userCartRef = doc(db, "user_carts", user.uid);
          if (cart.length > 0) {
            await setDoc(userCartRef, {
              userId: user.uid,
              items: cart,
              updatedAt: new Date().toISOString(),
            });
            console.log("Cart saved to Firebase for user:", user.uid);
          } else {
            // Clear cart from Firebase if empty
            await setDoc(userCartRef, {
              userId: user.uid,
              items: [],
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    // Debounce saves
    const timer = setTimeout(saveCart, 500);
    return () => clearTimeout(timer);
  }, [cart, cartLoaded, user?.uid]);

  // ✅ Fetch products from Firebase
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const fetchedProducts = snapshot.docs.map((docSnap) =>
        normalizeProduct({ id: docSnap.id, ...docSnap.data() }),
      );

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    return data.imageUrl;
  };

  // ✅ Products CRUD
  const addProduct = async (productData, imageFiles = []) => {
    setSavingProduct(true);
    try {
      const uploadedImages = [];
      for (let i = 0; i < (imageFiles?.length || 0); i++) {
        const url = await uploadFile(imageFiles[i]);
        uploadedImages.push(url);
      }

      // ✅ ensure sku is numeric + auto increment if empty
      const skuFromForm = toNumber(productData?.sku, 0);
      const nextSku = skuFromForm > 0 ? skuFromForm : await getNextSku();

      const newProduct = normalizeProduct({
        ...productData,
        sku: nextSku, // ✅ important
        images: uploadedImages,
        createdAt: new Date().toISOString(),
      });

      const docRef = await addDoc(collection(db, "products"), newProduct);
      const addedProduct = { id: docRef.id, ...newProduct };

      setProducts((prev) => [addedProduct, ...prev]);
      toast.success("Product added");
      return addedProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
      throw error;
    } finally {
      setSavingProduct(false);
    }
  };

  const updateProduct = async (id, updatedData, newImageFiles = []) => {
    setSavingProduct(true);

    try {
      const newImageUrls = [];

      for (let i = 0; i < (newImageFiles?.length || 0); i++) {
        const url = await uploadFile(newImageFiles[i]);
        newImageUrls.push(url);
      }

      const hasIncomingImages =
        Array.isArray(updatedData.images) && updatedData.images.length > 0;

      const hasNewUploads = newImageUrls.length > 0;

      const imagesPayload =
        hasIncomingImages || hasNewUploads
          ? [...(updatedData.images || []), ...newImageUrls].filter(Boolean)
          : undefined;

      const updatedProduct = normalizeProduct({
        ...updatedData,
        sku: toNumber(updatedData?.sku, 0), // ✅ add this line
        ...(imagesPayload ? { images: imagesPayload } : {}),
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "products", id), updatedProduct);

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p)),
      );

      toast.success("Product updated");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
      throw error;
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id) => {
    setDeletingProduct(true);
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      throw error;
    } finally {
      setDeletingProduct(false);
    }
  };

  // ✅ Cart Management
  const addToCart = (
    product,
    quantity = 1,
    selectedVariant = null,
    customFields = {},
    selectedExtras = [],
  ) => {
    const addQty = Math.max(1, toNumber(quantity, 1));

    // ✅ decide which stock we are enforcing
    const baseStock = toNumber(product?.stock, 0);
    const variantStock = selectedVariant
      ? toNumber(selectedVariant?.stock, 0)
      : null;

    const enforceStock = selectedVariant ? variantStock : baseStock;

    // if enforceStock is 0 -> block
    if (enforceStock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((prev) => {
      const extrasSignature = (selectedExtras || [])
        .slice()
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
        .map((e) => {
          const textSig =
            e?.type === "text" ? `:${String(e?.textValue || "").trim()}` : "";
          return `${e.id}:${e.selectedVariant?.id || "base"}:${e.qty || 1}${textSig}`;
        })
        .join("|");

      const cartId = [
        product.id,
        selectedVariant?.id || selectedVariant?.name || "base",
        extrasSignature || "noextras",
        JSON.stringify(customFields),
      ].join("__");

      const existingIndex = prev.findIndex((item) => item.cartId === cartId);

      // ✅ count how many already in cart for THIS SAME stock bucket
      const totalQtyInCartForThisBucket = prev.reduce((sum, item) => {
        if (item.id !== product.id) return sum;

        const sameVariant =
          (item.selectedVariant?.id || null) === (selectedVariant?.id || null);

        // if variant chosen, only count same variant
        if (selectedVariant)
          return sameVariant ? sum + toNumber(item.quantity, 0) : sum;

        // if no variant, only count base items (no variant)
        return !item.selectedVariant ? sum + toNumber(item.quantity, 0) : sum;
      }, 0);

      const remaining = enforceStock - totalQtyInCartForThisBucket;

      if (remaining <= 0) {
        toast.error(`Only ${enforceStock} in stock`);
        return prev;
      }

      const qtyToAdd = Math.min(addQty, remaining);

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: toNumber(updated[existingIndex].quantity, 0) + qtyToAdd,
        };

        if (qtyToAdd < addQty)
          toast.error(`Only ${enforceStock} in stock. Added ${qtyToAdd}.`);
        else toast.success("Added to Cart");

        return updated;
      }

      const newItem = {
        cartId,
        ...normalizeProduct(product),
        quantity: qtyToAdd,
        selectedVariant,
        customFields,
        selectedExtras,
        price: selectedVariant?.price || product.price,
        addedBy: user?.uid || guestUserId,
        addedAt: new Date().toISOString(),
      };

      if (qtyToAdd < addQty)
        toast.error(`Only ${enforceStock} in stock. Added ${qtyToAdd}.`);
      else toast.success("Item added to cart");

      return [...prev, newItem];
    });
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    toast.success("Item removed from cart");
  };

  const updateCartQuantity = (cartId, quantity) => {
    const nextQty = toNumber(quantity, 0);
    if (nextQty <= 0) return removeFromCart(cartId);

    setCart((prev) => {
      const target = prev.find((i) => i.cartId === cartId);
      if (!target) return prev;

      const stock = toNumber(target.stock, 0);

      // total qty in cart for this product EXCLUDING this cart line
      const otherQty = prev.reduce((sum, item) => {
        if (item.id !== target.id) return sum;
        if (item.cartId === cartId) return sum;
        return sum + toNumber(item.quantity, 0);
      }, 0);

      const maxAllowedForThisLine = Math.max(0, stock - otherQty);

      const clampedQty = Math.min(nextQty, maxAllowedForThisLine);

      if (clampedQty !== nextQty) {
        toast.error(`Only ${stock} in stock`);
      }

      return prev.map((item) =>
        item.cartId === cartId ? { ...item, quantity: clampedQty } : item,
      );
    });
  };

  const clearCart = async () => {
    setCart([]);
    storage.remove(CART_KEY);
    Cookies.remove(CART_COOKIE, { path: "/" });

    // ✅ Also clear from Firebase if user is logged in
    if (user?.uid) {
      try {
        const userCartRef = doc(db, "user_carts", user.uid);
        await setDoc(userCartRef, {
          userId: user.uid,
          items: [],
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error clearing cart from Firebase:", error);
      }
    }

    toast.success("Cart cleared");
  };

  // ✅ Clear guest cart on logout (but preserve user cart in Firebase)
  const clearGuestCart = () => {
    setCart([]);
    storage.remove(CART_KEY);
    Cookies.remove(CART_COOKIE, { path: "/" });
  };

  const getCartCount = () =>
    cart.reduce((total, item) => total + item.quantity, 0);

  const getCartTotal = () =>
    cart.reduce((acc, item) => {
      const base = toNumber(item.selectedVariant?.price || item.price, 0);
      const extrasTotal = (item.selectedExtras || []).reduce((s, e) => {
        const extraPrice = toNumber(e.selectedVariant?.price ?? e.price, 0);
        const extraQty = toNumber(e.qty || 1, 1);
        return s + extraPrice * extraQty;
      }, 0);
      return acc + (base + extrasTotal) * toNumber(item.quantity, 1);
    }, 0);

  const checkout = async ({ orderId, paymentRef } = {}) => {
    if (!cart.length) return;

    try {
      // ✅ 1) Decrement stock atomically
      await runTransaction(db, async (tx) => {
        // read all product docs
        const productSnaps = await Promise.all(
          cart.map((item) => tx.get(doc(db, "products", item.id))),
        );

        // ✅ validate everything first
        productSnaps.forEach((snap, idx) => {
          const item = cart[idx];
          if (!snap.exists())
            throw new Error(`Product not found: ${item?.name || item.id}`);

          const data = snap.data();
          const qty = toNumber(item.quantity, 1);

          // --- PRODUCT stock validation ---
          if (item.selectedVariant?.id) {
            const variants = Array.isArray(data?.variants) ? data.variants : [];
            const vIndex = variants.findIndex(
              (v) => v?.id === item.selectedVariant.id,
            );
            if (vIndex === -1)
              throw new Error(`Variant missing for "${item.name}"`);

            const vStock = toNumber(variants[vIndex]?.stock, 0);
            if (vStock < qty) {
              throw new Error(
                `Not enough stock for "${item.name}" (${item.selectedVariant.name}). Available: ${vStock}, needed: ${qty}`,
              );
            }
          } else {
            const baseStock = toNumber(data?.stock, 0);
            if (baseStock < qty) {
              throw new Error(
                `Not enough stock for "${item.name}". Available: ${baseStock}, needed: ${qty}`,
              );
            }
          }

          // --- EXTRAS stock validation (per unit) ---
          const extrasInDb = Array.isArray(data?.extras) ? data.extras : [];
          (item.selectedExtras || []).forEach((pickedExtra) => {
            const dbExtra = extrasInDb.find((e) => e?.id === pickedExtra.id);
            if (!dbExtra) return; // ignore missing extra (or throw if you prefer)

            const unitsNeeded = qty * toNumber(pickedExtra.qty || 1, 1);

            // if dbExtra.stock is null/undefined -> unlimited
            if (dbExtra.stock != null) {
              const extraStock = toNumber(dbExtra.stock, 0);
              if (extraStock < unitsNeeded) {
                throw new Error(
                  `Not enough stock for extra "${dbExtra.name}" on "${item.name}". Available: ${extraStock}, needed: ${unitsNeeded}`,
                );
              }
            }

            // if extra has variants (your Blue/Nude case)
            const pickedExtraVarId = pickedExtra.selectedVariant?.id;
            if (pickedExtraVarId) {
              const extraVars = Array.isArray(dbExtra?.variants)
                ? dbExtra.variants
                : [];
              const evIndex = extraVars.findIndex(
                (v) => v?.id === pickedExtraVarId,
              );
              if (evIndex === -1)
                throw new Error(`Extra variant missing: "${dbExtra.name}"`);

              const evStock = toNumber(extraVars[evIndex]?.stock, 0);
              if (evStock < unitsNeeded) {
                throw new Error(
                  `Not enough stock for "${dbExtra.name}" (${pickedExtra.selectedVariant.name}). Available: ${evStock}, needed: ${unitsNeeded}`,
                );
              }
            }
          });
        });

        // ✅ now apply updates
        productSnaps.forEach((snap, idx) => {
          const item = cart[idx];
          const data = snap.data();
          const qty = toNumber(item.quantity, 1);

          const productRef = doc(db, "products", item.id);

          // update product base vs variant stock
          if (item.selectedVariant?.id) {
            const variants = Array.isArray(data?.variants)
              ? [...data.variants]
              : [];
            const vIndex = variants.findIndex(
              (v) => v?.id === item.selectedVariant.id,
            );

            variants[vIndex] = {
              ...variants[vIndex],
              stock: toNumber(variants[vIndex].stock, 0) - qty,
            };

            // also keep base stock if you want (optional)
            tx.update(productRef, {
              variants,
              updatedAt: new Date().toISOString(),
            });
          } else {
            tx.update(productRef, {
              stock: increment(-qty),
              updatedAt: new Date().toISOString(),
            });
          }

          // update extras stock if finite
          const extrasInDb = Array.isArray(data?.extras)
            ? [...data.extras]
            : [];
          let extrasChanged = false;

          (item.selectedExtras || []).forEach((pickedExtra) => {
            const exIndex = extrasInDb.findIndex(
              (e) => e?.id === pickedExtra.id,
            );
            if (exIndex === -1) return;

            const unitsNeeded = qty * toNumber(pickedExtra.qty || 1, 1);
            const dbExtra = extrasInDb[exIndex];

            // deduct extra base stock if it is a number
            if (dbExtra.stock != null) {
              extrasInDb[exIndex] = {
                ...dbExtra,
                stock: toNumber(dbExtra.stock, 0) - unitsNeeded,
              };
              extrasChanged = true;
            }

            // deduct extra variant stock (Blue/Nude)
            const pickedExtraVarId = pickedExtra.selectedVariant?.id;
            if (pickedExtraVarId) {
              const evs = Array.isArray(dbExtra?.variants)
                ? [...dbExtra.variants]
                : [];
              const evIndex = evs.findIndex((v) => v?.id === pickedExtraVarId);
              if (evIndex !== -1) {
                evs[evIndex] = {
                  ...evs[evIndex],
                  stock: toNumber(evs[evIndex].stock, 0) - unitsNeeded,
                };
                extrasInDb[exIndex] = { ...extrasInDb[exIndex], variants: evs };
                extrasChanged = true;
              }
            }
          });

          if (extrasChanged) {
            tx.update(productRef, {
              extras: extrasInDb,
              updatedAt: new Date().toISOString(),
            });
          }
        });

        // order update etc...
      });

      // ✅ 3) Clear cart + refresh products
      await clearCart();
      await fetchProducts();
      toast.success("Checkout complete ✅ Stock deducted");
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error(error?.message || "Checkout failed");
      throw error;
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories: CATEGORIES,
        loading,
        savingProduct,
        deletingProduct,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        guestUserId,
        cartLoaded,
        addToCart,
        getNextSku, //
        removeFromCart,
        updateCartQuantity,
        clearCart,
        clearGuestCart, // ✅ Export for logout
        formatPrice,
        getCartTotal,
        getCartCount,
        checkout,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context)
    throw new Error("useProducts must be used within a ProductsProvider");
  return context;
}
