import { Request, Response, NextFunction } from 'express';
import {
  GetWishlistUseCase,
  AddToWishlistUseCase,
  RemoveFromWishlistUseCase,
  ClearWishlistUseCase,
  CheckWishlistItemUseCase
} from '../../application/use-cases/wishlist/WishlistUseCases';
import { MongoWishlistRepository, MongoProductRepository } from '../../infrastructure/database/repositories';

const wishlistRepository = new MongoWishlistRepository();
const productRepository = new MongoProductRepository();

export class WishlistController {
  static async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetWishlistUseCase(wishlistRepository);
      const wishlist = await useCase.execute(req.user!.userId);

      res.json({
        success: true,
        data: wishlist.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.body;
      const useCase = new AddToWishlistUseCase(wishlistRepository, productRepository);
      const wishlist = await useCase.execute(req.user!.userId, productId);

      res.json({
        success: true,
        message: 'Item added to wishlist',
        data: wishlist.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const useCase = new RemoveFromWishlistUseCase(wishlistRepository);
      const wishlist = await useCase.execute(req.user!.userId, productId);

      res.json({
        success: true,
        message: 'Item removed from wishlist',
        data: wishlist.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ClearWishlistUseCase(wishlistRepository);
      const wishlist = await useCase.execute(req.user!.userId);

      res.json({
        success: true,
        message: 'Wishlist cleared',
        data: wishlist.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const useCase = new CheckWishlistItemUseCase(wishlistRepository);
      const inWishlist = await useCase.execute(req.user!.userId, productId);

      res.json({
        success: true,
        data: { inWishlist }
      });
    } catch (error) {
      next(error);
    }
  }
}
