import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  getDoc,
  updateDoc,
  increment,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const LandingAuthContext = createContext(null);

const COOKIE_TOKEN = "waitlist_token";
const COOKIE_ACCESS = "waitlist_access";
const COOKIE_USER = "waitlist_user"; // ✅ NEW: Cache user data

export const LandingAuthProvider = ({ children }) => {
  // ✅ Try to load cached user from cookie first
  const [user, setUser] = useState(() => {
    try {
      const cached = Cookies.get(COOKIE_USER);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => Cookies.get(COOKIE_TOKEN) || null);
  const [accessGranted, setAccessGranted] = useState(
    () => Cookies.get(COOKIE_ACCESS) === "true",
  );
  
  // ✅ Only show loading if we have token/access BUT no cached user
  const [loading, setLoading] = useState(() => {
    const hasToken = Cookies.get(COOKIE_TOKEN);
    const hasAccess = Cookies.get(COOKIE_ACCESS) === "true";
    const hasCachedUser = Cookies.get(COOKIE_USER);
    
    // Only load if we need to fetch (have access but no cached data)
    return Boolean(hasToken && hasAccess && !hasCachedUser);
  });

  // ✅ Only fetch from Firebase if we don't have cached user data
  useEffect(() => {
    const run = async () => {
      if (!token || !accessGranted) {
        setUser(null);
        setLoading(false);
        return;
      }

      // ✅ If we already have user data from cache, don't fetch again
      if (user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ref = doc(db, "waitlist", token);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // invalid token → clear cookies
          Cookies.remove(COOKIE_TOKEN, { path: "/" });
          Cookies.remove(COOKIE_ACCESS, { path: "/" });
          Cookies.remove(COOKIE_USER, { path: "/" });

          setToken(null);
          setAccessGranted(false);
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = { id: snap.id, ...snap.data() };
        setUser(userData);

        // ✅ Cache user data in cookie
        Cookies.set(COOKIE_USER, JSON.stringify(userData), {
          expires: 365,
          secure: true,
          sameSite: "strict",
          path: "/",
        });

        // ✅ Update stats in background (don't await)
        updateDoc(ref, {
          lastLogin: serverTimestamp(),
          loginAttempt: increment(1),
        }).catch((e) => console.error("Failed to update login stats:", e));

      } catch (e) {
        console.error("LandingAuthProvider error:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, accessGranted]); // ✅ Removed 'user' from deps to avoid re-fetching

  // Keep cookies synced (long-lived device access)
  useEffect(() => {
    if (token) {
      Cookies.set(COOKIE_TOKEN, token, {
        expires: 365,
        secure: true,
        sameSite: "strict",
        path: "/",
      });
    } else {
      Cookies.remove(COOKIE_TOKEN, { path: "/" });
    }

    Cookies.set(COOKIE_ACCESS, accessGranted ? "true" : "false", {
      expires: 365,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    // ✅ Sync user cache
    if (user) {
      Cookies.set(COOKIE_USER, JSON.stringify(user), {
        expires: 365,
        secure: true,
        sameSite: "strict",
        path: "/",
      });
    } else {
      Cookies.remove(COOKIE_USER, { path: "/" });
    }
  }, [token, accessGranted, user]);

  return (
    <LandingAuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        accessGranted,
        setAccessGranted,
        loading,
      }}
    >
      {children}
    </LandingAuthContext.Provider>
  );
};

export const useLandingAuth = () => {
  const ctx = useContext(LandingAuthContext);
  if (!ctx)
    throw new Error("useLandingAuth must be used within a LandingAuthProvider");
  return ctx;
};