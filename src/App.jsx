import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Root from "./layout/Root";
import LandingPage from "./pages/LandingPage";
import BlogSection from "./components/BlogSection";
import BlogDetail from "./components/BlogDetail";

import PropertyDetailPage from "./components/PropertyDetailPage";
import ListingsPage from "./components/ListingsPage";
import AdminPanel from "./components/AdminPanel";
import AdminLoginPage from "./pages/AdminLoginPage";


function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<LandingPage />} />

            <Route path="blog" element={<BlogSection />} />
            <Route path="blog/:id" element={<BlogDetail />} />
            <Route path="properties" element={<ListingsPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="*" element={<div className="p-20 text-center">404 - Page Not Found</div>} />
            <Route path="admin" element={<AdminLoginPage />} />
            <Route path="dashboard" element={<AdminPanel />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;