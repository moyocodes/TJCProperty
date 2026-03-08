// src/providers/CategoriesProvider.jsx
// Provides categories from Firestore with live updates.
// Admin can add, rename, reorder and delete categories.
// All components that need the category list use `useCategories()`.

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
import { db } from "../components/firebase";
import { useAuth } from "../auth/AuthProvider";

const Ctx = createContext(null);

export function CategoriesProvider({ children }) {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live listener — updates instantly across all clients
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  // Create a new category
  const addCategory = async (name) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    name = name.trim();
    if (!name) throw new Error("Name required");
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      throw new Error("Already exists");
    return addDoc(collection(db, "categories"), {
      name,
      order: categories.length,
      createdAt: serverTimestamp(),
    });
  };

  // Rename an existing category
  const renameCategory = async (id, name) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    name = name.trim();
    if (!name) throw new Error("Name required");
    return updateDoc(doc(db, "categories", id), { name });
  };

  // Delete category (does NOT cascade-update listings — handle that manually if needed)
  const deleteCategory = async (id) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    return deleteDoc(doc(db, "categories", id));
  };

  // Bump a category up or down in the list
  const reorderCategory = async (id, direction) => {
    // if (!isAdmin) throw new Error("Unauthorised");
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const a = categories[idx];
    const b = categories[swapIdx];
    await updateDoc(doc(db, "categories", a.id), { order: b.order });
    await updateDoc(doc(db, "categories", b.id), { order: a.order });
  };

  return (
    <Ctx.Provider
      value={{
        categories,
        loading,
        addCategory,
        renameCategory,
        deleteCategory,
        reorderCategory,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCategories = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useCategories must be inside <CategoriesProvider>");
  return ctx;
};
