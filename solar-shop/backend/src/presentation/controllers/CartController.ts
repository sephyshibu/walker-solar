import { Request, Response, NextFunction } from 'express';
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase
} from '../../application/use-cases/cart/CartUseCases';
import { MongoCartRepository, MongoProductRepository } from '../../infrastructure/database/repositories';

const cartRepository = new MongoCartRepository();
const productRepository = new MongoProductRepository();

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetCartUseCase(cartRepository, productRepository);
      const cart = await useCase.execute(req.user!.userId);

      res.json({
        success: true,
        data: cart.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const useCase = new AddToCartUseCase(cartRepository, productRepository);
      const cart = await useCase.execute(req.user!.userId, productId, quantity || 1);

      res.json({
        success: true,
        message: 'Item added to cart',
        data: cart.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const useCase = new UpdateCartItemUseCase(cartRepository, productRepository);
      const cart = await useCase.execute(req.user!.userId, productId, quantity);

      res.json({
        success: true,
        message: 'Cart updated',
        data: cart.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const useCase = new RemoveFromCartUseCase(cartRepository);
      const cart = await useCase.execute(req.user!.userId, productId);

      res.json({
        success: true,
        message: 'Item removed from cart',
        data: cart.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ClearCartUseCase(cartRepository);
      const cart = await useCase.execute(req.user!.userId);

      res.json({
        success: true,
        message: 'Cart cleared',
        data: cart.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}
