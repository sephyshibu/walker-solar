import { Wishlist, WishlistItem } from '../../../domain/entities/Wishlist';
import { IWishlistRepository, IProductRepository } from '../../../domain/repositories';
import { ProductStatus } from '../../../domain/entities/Product';
import { AppError } from '../../../shared/errors/AppError';

export class GetWishlistUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string): Promise<Wishlist> {
    let wishlist = await this.wishlistRepository.findByUserId(userId);
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
      wishlist = await this.wishlistRepository.create(wishlist);
    }

    return wishlist;
  }
}

export class AddToWishlistUseCase {
  constructor(
    private wishlistRepository: IWishlistRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(userId: string, productId: string): Promise<Wishlist> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    let wishlist = await this.wishlistRepository.findByUserId(userId);

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    if (wishlist.hasItem(productId)) {
      throw new AppError('Product already in wishlist', 400);
    }
    

    wishlist.addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.primaryImage,
      slug:product.slug,
      price: product.effectivePrice
    });

    if (wishlist.id && (await this.wishlistRepository.findById(wishlist.id))) {
      return (await this.wishlistRepository.update(wishlist.id, wishlist))!;
    } else {
      return await this.wishlistRepository.create(wishlist);
    }
  }
}

export class RemoveFromWishlistUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404);
    }

    if (!wishlist.hasItem(productId)) {
      throw new AppError('Product not in wishlist', 400);
    }

    wishlist.removeItem(productId);

    const updatedWishlist = await this.wishlistRepository.update(wishlist.id, wishlist);
    if (!updatedWishlist) {
      throw new AppError('Failed to update wishlist', 500);
    }

    return updatedWishlist;
  }
}

export class ClearWishlistUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404);
    }

    wishlist.clear();

    const updatedWishlist = await this.wishlistRepository.update(wishlist.id, wishlist);
    if (!updatedWishlist) {
      throw new AppError('Failed to clear wishlist', 500);
    }

    return updatedWishlist;
  }
}

export class CheckWishlistItemUseCase {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<boolean> {
    const wishlist = await this.wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      return false;
    }
    return wishlist.hasItem(productId);
  }
}
