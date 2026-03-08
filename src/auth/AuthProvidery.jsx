import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 

  const isAdmin = Boolean(user?.isAdmin);

  const value = {
    // user,
    // loading,
    // login,
    // register,
    // logout,
    // saveBillingInfo,
    // getBillingInfo,
    isAdmin: isAdmin === true,
    // refreshUser, // ✅ now no-arg, use in ProfilePage after updateDoc
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
