import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import MouseFollower from './components/effects/MouseFollower';
import FloatingParticles from './components/effects/FloatingParticles';
import ThemeToggle from './components/effects/ThemeToggle';
import { useAuthStore, useCartStore, useWishlistStore } from './store';
import './styles/global.css';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminAddProduct = lazy(() => import('./pages/admin/AddProduct'));
const AdminEditProduct = lazy(() => import('./pages/admin/EditProduct'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminGallery = lazy(() => import('./pages/admin/Gallery1'));

// Loading component
const Loading: React.FC = () => (
  <div className="loading-page">
    <div className="spinner" />
  </div>
);

// App Loading component (for initial auth check)
const AppLoading: React.FC = () => (
  <div className="loading-page">
    <div className="spinner" />
    <p style={{ marginTop: '1rem', color: '#888' }}>Loading...</p>
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  
  // Show loading while checking auth
  if (isLoading) {
    return <Loading />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper
const Layout: React.FC<{ children: React.ReactNode; showFooter?: boolean }> = ({ 
  children, 
  showFooter = true 
}) => (
  <>
    <Header />
    <main className="main-content">{children}</main>
    {showFooter && <Footer />}
    <CartDrawer />
  </>
);

const App: React.FC = () => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const [appReady, setAppReady] = useState(false);

  // Initialize auth on app load - fetch user from API if tokens exist
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setAppReady(true);
    };
    init();
  }, []);

  // Fetch cart and wishlist when authenticated
  useEffect(() => {
    if (appReady && isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [appReady, isAuthenticated]);

  // Show loading screen while initializing
  if (!appReady || isLoading) {
    return <AppLoading />;
  }

  return (
    <BrowserRouter>
      <FloatingParticles />
      <MouseFollower />
      <ThemeToggle />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1e1e',
            color: '#fff',
            border: '1px solid #2e2e2e',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/products/:slug" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />

          {/* Protected Routes */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Layout showFooter={false}><Checkout /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Layout><Orders /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <Layout><Wishlist /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminProducts /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/add" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminAddProduct /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/edit/:id" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminEditProduct /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminOrders /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminUsers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminCategories /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/gallery" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminGallery /></Layout>
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;