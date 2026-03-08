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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Firestore /users/{uid}
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /* ── Listen to Firebase auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
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
    return unsub;
  }, []);

  const loadProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setIsAdmin(data.isAdmin === true);
      }
    } catch (e) {
      console.error("loadProfile:", e);
    }
  };

  /* ── Register ── */
  const register = async ({ email, password, displayName }) => {
    setAuthError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      // Create Firestore user doc; isAdmin is false by default
      // To make someone admin: set isAdmin: true manually in Firebase Console
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
      await loadProfile(cred.user.uid);
      return { success: true };
    } catch (err) {
      console.error("AUTH ERROR:", err);
      const msg = mapError(err.code);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  /* ── Login ── */
  const login = async ({ email, password }) => {
    setAuthError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await loadProfile(cred.user.uid);
      return { success: true };
    } catch (err) {
      console.error("AUTH ERROR:", err);
      const msg = mapError(err.code);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  /* ── Logout ── */
  const logout = () => signOut(auth);

  const clearError = () => setAuthError("");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        authError,
        register,
        login,
        logout,
        clearError,
        loadProfile,
      }}
    >
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
  return (
    {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/network-request-failed": "Network error. Check your connection.",
    }[code] ?? "Something went wrong. Please try again."
  );
}
