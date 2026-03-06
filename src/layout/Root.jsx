import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { BlogProvider } from "../auth/BlogProvider";
import { AuthProvider } from "../auth/AuthProvider";

export default function Root() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <AuthProvider>
        <BlogProvider>
          <Navbar />
          <Outlet />
          <Footer />
        </BlogProvider>
      </AuthProvider>
    </div>
  );
}
