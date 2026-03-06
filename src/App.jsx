import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Root from "./layout/Root";
import LandingPage from "./pages/LandingPage";
import BlogSection from "./components/BlogSection";
import BlogDetail from "./components/BlogDetail";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<LandingPage />} />
            <Route path="blog" element={<BlogSection />} />
            <Route path="blog/:id" element={<BlogDetail />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
