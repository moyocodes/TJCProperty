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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { useAuth } from "./AuthProvider";
import { db, storage } from "../components/firebase";

const ListingsContext = createContext(null);

export function ListingsProvider({ children }) {
  const { user, isAdmin } = useAuth();

  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Live listings (everyone sees) ── */
  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  /* ══════ LISTINGS CRUD (admin) ══════ */

  const _uploadFile = (file) =>
    new Promise((res, rej) => {
      const path = `listings/${Date.now()}_${file.name}`;
      const task = uploadBytesResumable(ref(storage, path), file);
      task.on("state_changed", null, rej, async () =>
        res({ url: await getDownloadURL(task.snapshot.ref), path }),
      );
    });

  /* Create */
  const createListing = async (data, imageFiles = []) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const images = [];
    for (const f of imageFiles) {
      if (typeof f === "string") images.push({ url: f, path: null });
      else images.push(await _uploadFile(f));
    }
    return addDoc(collection(db, "listings"), {
      ...data,
      images,
      image: images[0]?.url || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  /* Update */
  const updateListing = async (id, data, newImageFiles = []) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const existing = listings.find((l) => l.id === id);
    let images = existing?.images || [];
    for (const f of newImageFiles) {
      if (typeof f === "string") images.push({ url: f, path: null });
      else images.push(await _uploadFile(f));
    }
    return updateDoc(doc(db, "listings", id), {
      ...data,
      images,
      image: images[0]?.url || "",
      updatedAt: serverTimestamp(),
    });
  };

  /* Delete */
  const deleteListing = async (id) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const listing = listings.find((l) => l.id === id);
    for (const img of listing?.images || []) {
      if (img?.path)
        try {
          await deleteObject(ref(storage, img.path));
        } catch (_) {}
    }
    return deleteDoc(doc(db, "listings", id));
  };

  /* Remove single image */
  const removeListingImage = async (listingId, index) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const listing = listings.find((l) => l.id === listingId);
    const img = listing?.images?.[index];
    if (img?.path)
      try {
        await deleteObject(ref(storage, img.path));
      } catch (_) {}
    const images = listing.images.filter((_, i) => i !== index);
    return updateDoc(doc(db, "listings", listingId), {
      images,
      image: images[0]?.url || "",
    });
  };

  /* ══════ ENQUIRIES (logged-in user) ══════ */

  const submitEnquiry = async ({
    listingId,
    listingName,
    message,
    contact,
  }) => {
    if (!user) throw new Error("Login required");
    return addDoc(collection(db, "enquiries"), {
      listingId,
      listingName,
      message,
      contact,
      userUid: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.email,
      status: "new", // new | read | closed
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
