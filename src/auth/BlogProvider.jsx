import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

import { toast } from "sonner";
import { db } from "../components/firebase";


// Blog Context
const BlogContext = createContext();

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within BlogProvider");
  }
  return context;
};

// Blog Provider
export function BlogProvider({ children }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blogs from Firebase Firestore
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedBlogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  // Upload file to Cloudinary
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success("Image uploaded successfully");
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image");
      throw error;
    }
  };

  // Create new blog post
  const createBlog = async (blogData, imageFiles = []) => {
    try {
      // Upload images to Cloudinary
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadFile(imageFiles[i]);
        uploadedImages.push(url);
      }

      const allImages = [...(blogData.images || []), ...uploadedImages];

      const newBlog = {
        title: blogData.title,
        description: blogData.description,
        category: blogData.category || "",
        author: blogData.author || "",
        content: blogData.content || "",
        images: allImages,
        image: allImages[0] || "", // First image as main image
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "blogs"), newBlog);
      toast.success("Blog post created successfully!");
      await fetchBlogs();
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Failed to create blog post");
      throw error;
    }
  };

  // Update existing blog post
  const updateBlog = async (id, blogData, imageFiles = []) => {
    try {
      // Upload new images to Cloudinary
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadFile(imageFiles[i]);
        uploadedImages.push(url);
      }

      const allImages = [...(blogData.images || []), ...uploadedImages];

      const updatedBlog = {
        title: blogData.title,
        description: blogData.description,
        category: blogData.category || "",
        author: blogData.author || "",
        content: blogData.content || "",
        images: allImages,
        image: allImages[0] || "",
        date: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "blogs", id), updatedBlog);
      toast.success("Blog post updated successfully!");
      await fetchBlogs();
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.error("Failed to update blog post");
      throw error;
    }
  };

  // Delete blog post
  const deleteBlog = async (id) => {
    try {
      await deleteDoc(doc(db, "blogs", id));
      toast.success("Blog post deleted successfully!");
      await fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog post");
      throw error;
    }
  };

  // Get single blog by ID (useful for detail pages)
  const getBlogById = (id) => {
    return blogs.find((blog) => blog.id === id);
  };

  // Load blogs on mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  const value = {
    blogs,
    loading,
    fetchBlogs,
    uploadFile,
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}
