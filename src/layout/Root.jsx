import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { BlogProvider } from "../auth/BlogProvider";
import { AuthProvider } from "../auth/AuthProvider";
import { CategoriesProvider } from "../auth/CategoriesProvider";
import { ListingsProvider } from "../auth/ListingsProvider";
import { ServicesProvider } from "../auth/ServicesProvider";

export default function Root() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <AuthProvider>
        <CategoriesProvider>
          <ServicesProvider>
            <ListingsProvider>
              <BlogProvider>
                <Navbar />
                <Outlet />
                <Footer />
              </BlogProvider>
            </ListingsProvider>
          </ServicesProvider>
        </CategoriesProvider>
      </AuthProvider>
    </div>
  );
}
