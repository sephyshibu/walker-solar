# 🌞 SolarShop - Solar Products E-Commerce Platform

A full-stack e-commerce platform for solar products built with **Clean Architecture** principles. Features React TypeScript frontend and Node.js/Express backend with MongoDB.

## ✨ Features

### Customer Features
- 🛒 **Product Browsing** - Browse solar panels, inverters, batteries, and accessories
- 🔍 **Search & Filter** - Filter by category, price range, and search products
- ❤️ **Wishlist** - Save products for later
- 🛍️ **Shopping Cart** - Add products, update quantities, remove items
- 📱 **WhatsApp Orders** - Place orders directly to shop owner's WhatsApp
- 👤 **User Profile** - Manage profile and address information
- 📦 **Order History** - View past orders and their status
- 🖼️ **Gallery** - View installation photos and projects
- 📧 **Contact Form** - Send inquiries to the shop

### Admin Features
- 📊 **Dashboard** - Overview of products, orders, users, and contacts
- 📦 **Product Management** - Add, edit, block/unblock products
- 🛒 **Order Management** - View orders, update status
- 👥 **User Management** - View users, block/unblock accounts
- 📧 **Contact Management** - View and respond to inquiries

## 🏗️ Architecture

### Backend (Clean Architecture)
```
backend/
├── src/
│   ├── domain/              # Enterprise Business Rules
│   │   ├── entities/        # Business entities (User, Product, Order, etc.)
│   │   └── repositories/    # Repository interfaces
│   │
│   ├── application/         # Application Business Rules
│   │   └── use-cases/       # Use cases for each feature
│   │
│   ├── infrastructure/      # Frameworks & Drivers
│   │   ├── database/        # MongoDB models & repository implementations
│   │   └── middleware/      # Auth, error handling, file upload
│   │
│   ├── presentation/        # Interface Adapters
│   │   ├── controllers/     # HTTP request handlers
│   │   └── routes/          # API routes
│   │
│   └── shared/              # Shared utilities
│       └── errors/          # Custom error classes
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # Header, Footer
│   │   ├── product/         # Product cards
│   │   └── cart/            # Cart drawer
│   │
│   ├── pages/               # Page components
│   │   └── admin/           # Admin pages
│   │
│   ├── services/            # API service layer
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/solar_ecommerce
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
WHATSAPP_NUMBER=919876543210
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/search` - Search products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `PATCH /api/products/:id/block` - Block product (Admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update item quantity
- `DELETE /api/cart/:productId` - Remove item
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/cancel` - Cancel order

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Gallery
- `GET /api/gallery` - List gallery items
- `GET /api/gallery/category/:category` - Filter by category

### Contact
- `POST /api/contact` - Submit contact form

## 🔐 Demo Credentials

**Admin:**
- Email: admin@solarshop.com
- Password: Admin@123

**User:**
- Email: user@example.com
- Password: User@123

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **File Upload:** Multer

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Routing:** React Router v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast
- **Icons:** React Icons

## 📦 Product Categories

- Solar Panels
- Inverters
- Batteries
- Charge Controllers
- Mounting Systems
- Cables & Connectors
- Accessories

## 🎨 UI Features

- Dark theme with solar-inspired colors
- Responsive design for all devices
- Smooth animations and transitions
- Loading states and skeletons
- Toast notifications
- Image galleries with lightbox

## 📄 License

MIT License

---

Built with ❤️ for sustainable energy
