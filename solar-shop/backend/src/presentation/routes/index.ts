import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CartController } from '../controllers/CartController';
import { OrderController } from '../controllers/OrderController';
import { WishlistController } from '../controllers/WishlistController';
import { GalleryController } from '../controllers/GalleryController';
import { ContactController } from '../controllers/ContactController';
import { AdminController } from '../controllers/AdminController';
import seoRoutes from './seo';
import { authenticate, authorize } from '../../infrastructure/middleware/auth';
import { 
  uploadProductImages, 
  uploadProductVideo, 
  uploadGalleryImage, 
  uploadProfileImage,
  uploadInvoice
} from '../../infrastructure/config/cloudinary';
import { UserRole } from '../../domain/entities/User';
import { categoryController } from '../controllers/CategoryController';
import { uploadCategoryImage } from '../../infrastructure/config/cloudinary';
const router = Router();

// ==================== SEO ROUTES ====================
router.use('/', seoRoutes);

// ==================== AUTH ROUTES ====================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.post('/auth/logout', authenticate, AuthController.logout);
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/profile', authenticate, uploadProfileImage.single('profileImage'), AuthController.updateProfile);
router.put('/auth/change-password', authenticate, AuthController.changePassword);

// ==================== PRODUCT ROUTES ====================
// Public routes
router.get('/products', ProductController.getAll);
router.get('/products/featured', ProductController.getFeatured);
router.get('/products/search', ProductController.search);
router.get('/products/category/:category', ProductController.getByCategory);
router.get('/products/slug/:slug', ProductController.getBySlug);
router.get('/products/:id', ProductController.getById);

// Admin routes - Product Images (Cloudinary)
router.post('/products', authenticate, authorize(UserRole.ADMIN), uploadProductImages.array('images', 10), ProductController.create);
router.put('/products/:id', authenticate, authorize(UserRole.ADMIN), uploadProductImages.array('images', 10), ProductController.update);
router.delete('/products/:id', authenticate, authorize(UserRole.ADMIN), ProductController.delete);
router.patch('/products/:id/block', authenticate, authorize(UserRole.ADMIN), ProductController.block);
router.patch('/products/:id/unblock', authenticate, authorize(UserRole.ADMIN), ProductController.unblock);
router.patch('/products/:id/featured', authenticate, authorize(UserRole.ADMIN), ProductController.setFeatured);
router.get('/admin/products/stats', authenticate, authorize(UserRole.ADMIN), ProductController.getStats);

// Admin routes - Product Video (Cloudinary)
router.post('/products/:id/video', authenticate, authorize(UserRole.ADMIN), uploadProductVideo.single('video'), ProductController.uploadVideo);
router.delete('/products/:id/video', authenticate, authorize(UserRole.ADMIN), ProductController.deleteVideo);

// ==================== CART ROUTES ====================
router.get('/cart', authenticate, CartController.getCart);
router.post('/cart', authenticate, CartController.addItem);
router.put('/cart/:productId', authenticate, CartController.updateItem);
router.delete('/cart/:productId', authenticate, CartController.removeItem);
router.delete('/cart', authenticate, CartController.clearCart);

// ==================== ORDER ROUTES ====================
// User routes
router.post('/orders', authenticate, OrderController.create);
router.get('/orders/my-orders', authenticate, OrderController.getUserOrders);
router.get('/orders/:id', authenticate, OrderController.getById);
router.patch('/orders/:id/cancel', authenticate, OrderController.cancel);
router.patch('/orders/:id/whatsapp-sent', authenticate, OrderController.markWhatsAppSent);

// Admin routes
router.get('/admin/orders', authenticate, authorize(UserRole.ADMIN), OrderController.getAll);
router.get('/admin/orders/stats', authenticate, authorize(UserRole.ADMIN), OrderController.getStats);
router.get('/admin/orders/couriers', authenticate, authorize(UserRole.ADMIN), OrderController.getCourierServices);
router.get('/admin/orders/number/:orderNumber', authenticate, authorize(UserRole.ADMIN), OrderController.getByNumber);
router.patch('/admin/orders/:id/status', authenticate, authorize(UserRole.ADMIN), OrderController.updateStatus);
router.patch('/admin/orders/:id/tracking', authenticate, authorize(UserRole.ADMIN), OrderController.addTracking);
router.post('/admin/orders/:id/invoice', authenticate, authorize(UserRole.ADMIN), uploadInvoice.single('invoice'), OrderController.uploadInvoice);
router.delete('/admin/orders/:id/invoice', authenticate, authorize(UserRole.ADMIN), OrderController.deleteInvoice);

// ==================== WISHLIST ROUTES ====================
router.get('/wishlist', authenticate, WishlistController.getWishlist);
router.post('/wishlist', authenticate, WishlistController.addItem);
router.delete('/wishlist/:productId', authenticate, WishlistController.removeItem);
router.delete('/wishlist', authenticate, WishlistController.clearWishlist);
router.get('/wishlist/check/:productId', authenticate, WishlistController.checkItem);

// ==================== GALLERY ROUTES ====================
// Public routes
router.get('/gallery', GalleryController.getAll);
router.get('/gallery/category/:category', GalleryController.getByCategory);
router.get('/gallery/stats', authenticate, authorize(UserRole.ADMIN), GalleryController.getStats);  // THIS MUST BE BEFORE /:id
router.get('/gallery/:id', GalleryController.getById);  // THIS MUST BE AFTER /stats

// Admin routes - Gallery Images (Cloudinary)
router.post('/gallery', authenticate, authorize(UserRole.ADMIN), uploadGalleryImage.single('image'), GalleryController.create);
router.put('/gallery/:id', authenticate, authorize(UserRole.ADMIN), uploadGalleryImage.single('image'), GalleryController.update);
router.delete('/gallery/:id', authenticate, authorize(UserRole.ADMIN), GalleryController.delete);
router.patch('/gallery/:id/toggle-active', authenticate, authorize(UserRole.ADMIN), GalleryController.toggleActive);
// ==================== CONTACT ROUTES ====================
// Public route
router.post('/contact', ContactController.create);
router.patch('/contact/:id/whatsapp-sent', ContactController.markWhatsAppSent);

// Admin routes
router.get('/admin/contacts', authenticate, authorize(UserRole.ADMIN), ContactController.getAll);
router.get('/admin/contacts/stats', authenticate, authorize(UserRole.ADMIN), ContactController.getStats);
router.get('/admin/contacts/:id', authenticate, authorize(UserRole.ADMIN), ContactController.getById);
router.post('/admin/contacts/:id/respond', authenticate, authorize(UserRole.ADMIN), ContactController.respond);
router.patch('/admin/contacts/:id/close', authenticate, authorize(UserRole.ADMIN), ContactController.close);
router.delete('/admin/contacts/:id', authenticate, authorize(UserRole.ADMIN), ContactController.delete);

// ==================== ADMIN USER MANAGEMENT ROUTES ====================
router.get('/admin/users', authenticate, authorize(UserRole.ADMIN), AdminController.getAllUsers);
router.get('/admin/users/stats', authenticate, authorize(UserRole.ADMIN), AdminController.getUserStats);
router.get('/admin/users/:id', authenticate, authorize(UserRole.ADMIN), AdminController.getUserById);
router.patch('/admin/users/:id/block', authenticate, authorize(UserRole.ADMIN), AdminController.blockUser);
router.patch('/admin/users/:id/unblock', authenticate, authorize(UserRole.ADMIN), AdminController.unblockUser);

// ==================== CATEGORY ROUTES ====================
// Public routes
router.get('/categories', categoryController.getActive.bind(categoryController));
router.get('/categories/slug/:slug', categoryController.getBySlug.bind(categoryController));

// Admin routes
router.get('/admin/categories', authenticate, authorize(UserRole.ADMIN), categoryController.getAll.bind(categoryController));
router.get('/admin/categories/stats', authenticate, authorize(UserRole.ADMIN), categoryController.getStats.bind(categoryController));
router.get('/admin/categories/:id', authenticate, authorize(UserRole.ADMIN), categoryController.getById.bind(categoryController));
router.post('/admin/categories', authenticate, authorize(UserRole.ADMIN), uploadCategoryImage.single('image'), categoryController.create.bind(categoryController));
router.put('/admin/categories/:id', authenticate, authorize(UserRole.ADMIN), uploadCategoryImage.single('image'), categoryController.update.bind(categoryController));
router.delete('/admin/categories/:id', authenticate, authorize(UserRole.ADMIN), categoryController.delete.bind(categoryController));
router.patch('/admin/categories/:id/toggle-status', authenticate, authorize(UserRole.ADMIN), categoryController.toggleStatus.bind(categoryController));
export default router;
