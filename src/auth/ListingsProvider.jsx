// src/providers/ListingsProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { useAuth } from "./AuthProvider";
import { db } from "../components/firebase";

const ListingsContext = createContext(null);

/* ─────────────────────────────────────
   Normalise every Firestore doc so callers
   always receive:
     listing.images  → string[]   (Cloudinary URLs)
     listing.image   → string     (cover = images[0])
───────────────────────────────────── */
function normaliseListing(docSnap) {
  const d = { id: docSnap.id, ...docSnap.data() };

  if (Array.isArray(d.images) && d.images.length > 0) {
    // New format: could be string[] or legacy { url, path }[]
    d.images = d.images
      .map((i) => (typeof i === "string" ? i : i?.url ?? ""))
      .filter(Boolean);
  } else if (typeof d.image === "string" && d.image) {
    // Legacy single-image doc — promote to array
    d.images = [d.image];
  } else {
    d.images = [];
  }

  // Convenience cover always mirrors index 0
  d.image = d.images[0] ?? "";

  return d;
}

export function ListingsProvider({ children }) {
  const { user, isAdmin } = useAuth();

  const [listings,  setListings]  = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  /* ── Live listings (everyone sees) ── */
  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setListings(snap.docs.map(normaliseListing));
      setLoading(false);
    });
  }, []);

  /* ── Live enquiries (admin only) ── */
  useEffect(() => {
    // if (!isAdmin) return;
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setEnquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [isAdmin]);

  /* ══════ LISTINGS CRUD ══════
     Images are uploaded to Cloudinary by ListingForm BEFORE calling these.
     Both createListing and updateListing receive payload.images as string[].
  ══════════════════════════════ */

  /* Create */
  const createListing = async (data) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const images = Array.isArray(data.images) ? data.images : [];
    return addDoc(collection(db, "listings"), {
      ...data,
      images,                  // string[] of Cloudinary URLs
      image: images[0] ?? "",  // convenience cover field
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  /* Update */
  const updateListing = async (id, data) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const images = Array.isArray(data.images) ? data.images : [];
    return updateDoc(doc(db, "listings", id), {
      ...data,
      images,
      image: images[0] ?? "",
      updatedAt: serverTimestamp(),
    });
  };

  /* Delete — no Storage cleanup needed (Cloudinary manages its own files) */
  const deleteListing = async (id) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    return deleteDoc(doc(db, "listings", id));
  };

  /* Remove a single image by index and save */
  const removeListingImage = async (listingId, index) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    const images = listing.images.filter((_, i) => i !== index);
    return updateDoc(doc(db, "listings", listingId), {
      images,
      image: images[0] ?? "",
      updatedAt: serverTimestamp(),
    });
  };

  /* ══════ ENQUIRIES ══════ */

  const submitEnquiry = async ({ listingId, listingName, message, contact }) => {
    if (!user) throw new Error("Login required");
    return addDoc(collection(db, "enquiries"), {
      listingId,
      listingName,
      message,
      contact,
      userUid:   user.uid,
      userEmail: user.email,
      userName:  user.displayName || user.email,
      status:    "new", // new | read | closed
      createdAt: serverTimestamp(),
    });
  };

  /* Admin: change enquiry status */
  const updateEnquiryStatus = async (id, status) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    return updateDoc(doc(db, "enquiries", id), { status });
  };

  /* Admin: delete enquiry */
  const deleteEnquiry = async (id) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    return deleteDoc(doc(db, "enquiries", id));
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        enquiries,
        loading,
        createListing,
        updateListing,
        deleteListing,
        removeListingImage,
        submitEnquiry,
        updateEnquiryStatus,
        deleteEnquiry,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

export const useListings = () => {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be inside <ListingsProvider>");
  return ctx;
};