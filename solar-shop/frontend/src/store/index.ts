import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Cart, Wishlist, CartItem, WishlistItem } from '../types';
import { authApi, cartApi, wishlistApi, tokenStorage } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, accessTokenExpiresIn: number, refreshTokenExpiresIn: number) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuth: () => boolean;
  fetchUserProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: true,
      
      setAuth: (user, accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn) => {
        // Store tokens using tokenStorage helper
        tokenStorage.setTokens(accessToken, refreshToken, accessTokenExpiresIn);
        
        set({ 
          user, 
          isAuthenticated: true, 
          isAdmin: user.role === 'admin',
          isLoading: false
        });
      },
      
      logout: () => {
        // Clear all tokens
        tokenStorage.clearTokens();
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          isAdmin: false,
          isLoading: false
        });
      },
      
      updateUser: (user) => set({ user, isAdmin: user.role === 'admin' }),
      
      checkAuth: () => {
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          tokenStorage.clearTokens();
          set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false });
          return false;
        }
        
        return true;
      },
      
      // Fetch fresh user profile from API
      fetchUserProfile: async () => {
        try {
          const response = await authApi.getProfile();
          const user = response.data.data;
          
          set({ 
            user, 
            isAuthenticated: true, 
            isAdmin: user.role === 'admin',
            isLoading: false
          });
        } catch (error) {
          // If fetching profile fails, clear auth
          tokenStorage.clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isAdmin: false,
            isLoading: false
          });
        }
      },
      
      // Initialize auth on app load
      initializeAuth: async () => {
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token, user is not authenticated
          set({ 
            user: null, 
            isAuthenticated: false, 
            isAdmin: false,
            isLoading: false
          });
          return;
        }
        
        // We have a refresh token, try to fetch user profile
        // This will also refresh the access token if needed
        try {
          set({ isLoading: true });
          await get().fetchUserProfile();
        } catch (error) {
          tokenStorage.clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isAdmin: false,
            isLoading: false
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      // Only persist minimal, non-sensitive data
      // We'll fetch fresh user data from API on app load
      partialize: () => ({}), // Don't persist anything sensitive!
    }
  )
);

interface CartState {
  cart: Cart | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  fetchCart: async () => {
    try {
      set({ loading: true });
      const response = await cartApi.get();
      set({ cart: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await cartApi.addItem(productId, quantity);
      set({ cart: response.data.data });
    } catch (error) {
      throw error;
    }
  },
  updateQuantity: async (productId, quantity) => {
    try {
      const response = await cartApi.updateItem(productId, quantity);
      set({ cart: response.data.data });
    } catch (error) {
      throw error;
    }
  },
  removeFromCart: async (productId) => {
    try {
      const response = await cartApi.removeItem(productId);
      set({ cart: response.data.data });
    } catch (error) {
      throw error;
    }
  },
  clearCart: async () => {
    try {
      const response = await cartApi.clear();
      set({ cart: response.data.data });
    } catch (error) {
      throw error;
    }
  },
}));

interface WishlistState {
  wishlist: Wishlist | null;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: null,
  loading: false,
  fetchWishlist: async () => {
    try {
      set({ loading: true });
      const response = await wishlistApi.get();
      set({ wishlist: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
  addToWishlist: async (productId) => {
    try {
      const response = await wishlistApi.addItem(productId);
      set({ wishlist: response.data.data });
    } catch (error) {
      throw error;
    }
  },
  removeFromWishlist: async (productId) => {
    try {
      const response = await wishlistApi.removeItem(productId);
      set({ wishlist: response.data.data });
    } catch (error) {
      throw error;
    }
  },
  isInWishlist: (productId) => {
    const { wishlist } = get();
    return wishlist?.items.some(item => item.productId === productId) || false;
  },
}));

interface UIState {
  sidebarOpen: boolean;
  cartOpen: boolean;
  toggleSidebar: () => void;
  toggleCart: () => void;
  closeSidebar: () => void;
  closeCart: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  cartOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  closeCart: () => set({ cartOpen: false }),
}));
