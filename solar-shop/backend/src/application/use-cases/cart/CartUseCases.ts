import { Cart, CartItem } from '../../../domain/entities/Cart';
import { ICartRepository, IProductRepository } from '../../../domain/repositories';
import { ProductStatus } from '../../../domain/entities/Product';
import { AppError } from '../../../shared/errors/AppError';

export class GetCartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(userId);
    
    if (!cart) {
      cart = new Cart({ userId, items: [], totalAmount: 0, totalGST: 0, grandTotal: 0, totalItems: 0 });
      cart = await this.cartRepository.create(cart);
      return cart;
    }

    // Recalculate prices based on current tiered pricing and GST
    let needsUpdate = false;
    const updatedItems: { productId: string; quantity: number; price: number; productName: string; productImage: string; gstRate: number }[] = [];

    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const tierPrice = product.getPriceForQuantity(item.quantity);
        const gstRate = product.gstRate;
        if (tierPrice !== item.price || gstRate !== item.gstRate) {
          needsUpdate = true;
        }
        updatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: tierPrice,
          productName: product.name,
          productImage: product.primaryImage,
          gstRate: gstRate
        });
      }
    }

    // If prices changed, update the cart
    if (needsUpdate) {
      cart = new Cart({ 
        id: cart.id,
        userId, 
        items: [], 
        totalAmount: 0, 
        totalGST: 0,
        grandTotal: 0,
        totalItems: 0,
        createdAt: cart.createdAt,
        updatedAt: new Date()
      });
      
      for (const item of updatedItems) {
        cart.addItem(item);
      }
      
      cart = (await this.cartRepository.update(cart.id, cart))!;
    }

    return cart;
  }
}

export class AddToCartUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, productId: string, quantity: number = 1): Promise<Cart> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new AppError('Product is not available', 400);
    }

    if (product.stock < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    let cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      cart = new Cart({ userId, items: [], totalAmount: 0, totalGST: 0, grandTotal: 0, totalItems: 0 });
    }

    const existingItem = cart.getItem(productId);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (newQuantity > product.stock) {
      throw new AppError('Cannot add more items than available in stock', 400);
    }

    // Calculate tiered price based on the NEW total quantity
    const tierPrice = product.getPriceForQuantity(newQuantity);

    // If item exists, update it with new quantity and tiered price
    if (existingItem) {
      // Remove existing item first
      cart.removeItem(productId);
    }

    // Add item with tiered price and GST rate
    cart.addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.primaryImage,
      price: tierPrice,
      quantity: newQuantity,
      gstRate: product.gstRate
    });

    if (cart.id && (await this.cartRepository.findById(cart.id))) {
      return (await this.cartRepository.update(cart.id, cart))!;
    } else {
      return await this.cartRepository.create(cart);
    }
  }
}

export class UpdateCartItemUseCase {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    if (quantity > 0) {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (quantity > product.stock) {
        throw new AppError('Insufficient stock', 400);
      }

      // Get tiered price for the new quantity
      const tierPrice = product.getPriceForQuantity(quantity);
      
      // Update the item with new price, quantity and GST
      const existingItem = cart.getItem(productId);
      if (existingItem) {
        // Remove and re-add with updated price
        cart.removeItem(productId);
        cart.addItem({
          productId: product.id,
          productName: product.name,
          productImage: product.primaryImage,
          price: tierPrice,
          quantity: quantity,
          gstRate: product.gstRate
        });
      }
    } else {
      // Remove item if quantity is 0 or less
      cart.removeItem(productId);
    }

    const updatedCart = await this.cartRepository.update(cart.id, cart);
    if (!updatedCart) {
      throw new AppError('Failed to update cart', 500);
    }

    return updatedCart;
  }
}

export class RemoveFromCartUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    cart.removeItem(productId);

    const updatedCart = await this.cartRepository.update(cart.id, cart);
    if (!updatedCart) {
      throw new AppError('Failed to update cart', 500);
    }

    return updatedCart;
  }
}

export class ClearCartUseCase {
  constructor(private cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    cart.clear();

    const updatedCart = await this.cartRepository.update(cart.id, cart);
    if (!updatedCart) {
      throw new AppError('Failed to clear cart', 500);
    }

    return updatedCart;
  }
}
