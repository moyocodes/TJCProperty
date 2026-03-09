// src/auth/AuthProvider.jsx

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../components/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await loadProfile(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  const loadProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        // Only true if the Firestore doc has isAdmin: true
        setIsAdmin(data.isAdmin === true);
        console.log("[AuthProvider] profile loaded — isAdmin:", data.isAdmin);
      } else {
        // No Firestore doc found for this uid
        // This means the user exists in Auth but NOT in /users collection
        console.warn("[AuthProvider] No Firestore user doc for uid:", uid,
          "— isAdmin will stay false. Create the doc manually or via createUser().");
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("[AuthProvider] loadProfile error:", e);
    }
  };

  const login = async ({ email, password }) => {
    setAuthError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await loadProfile(cred.user.uid);
      return { success: true };
    } catch (err) {
      console.error("[AuthProvider] login error:", err.code, err.message);
      const msg = mapError(err.code);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Admin-only: create account from the admin panel.
  // WARNING: Firebase client SDK signs in as the new user after creation.
  // Re-sign the admin back in after calling this.
  const createUser = async ({ email, password, displayName, isAdmin: makeAdmin = false }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName,
        isAdmin: makeAdmin,
        createdAt: serverTimestamp(),
      });
      return { success: true, uid: cred.user.uid };
    } catch (err) {
      return { success: false, error: mapError(err.code) };
    }
  };

 const logout = async () => {
  await signOut(auth);
};
  const clearError = () => setAuthError("");

  return (
    <AuthContext.Provider value={{
      user, profile, isAdmin, loading, authError,
      login, logout, createUser, clearError, loadProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
};

function mapError(code) {
  return ({
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  }[code] ?? "Something went wrong. Please try again.");
}