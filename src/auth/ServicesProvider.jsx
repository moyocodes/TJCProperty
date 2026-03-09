// src/providers/ServicesProvider.jsx
// Firestore CRUD for the Services section.
// Collection: "services"
// Each doc: { name, desc, icon, img, n, order, createdAt, updatedAt }

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

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Live listener — ordered by `order` field so admin can reorder */
  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  /* Create */
  const createService = (data) =>
    addDoc(collection(db, "services"), {
      ...data,
      order: data.order ?? Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  /* Update */
  const updateService = (id, data) =>
    updateDoc(doc(db, "services", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

  /* Delete */
  const deleteService = (id) => deleteDoc(doc(db, "services", id));

  /* Reorder — pass full reordered array */
  const reorderServices = async (reordered) => {
    await Promise.all(
      reordered.map((s, i) =>
        updateDoc(doc(db, "services", s.id), {
          order: i,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
  };

  return (
    <ServicesContext.Provider
      value={{
        services,
        loading,
        createService,
        updateService,
        deleteService,
        reorderServices,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be inside <ServicesProvider>");
  return ctx;
};
