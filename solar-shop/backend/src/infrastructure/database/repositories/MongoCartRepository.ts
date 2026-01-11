import { Cart, CartProps } from '../../../domain/entities/Cart';
import { ICartRepository } from '../../../domain/repositories';
import { CartModel, CartDocument } from '../models/CartModel';

export class MongoCartRepository implements ICartRepository {
  private documentToEntity(doc: CartDocument): Cart {
    return new Cart({
      id: doc._id.toString(),
      userId: doc.userId,
      items: doc.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price || 0,
        quantity: item.quantity || 0,
        subtotal: item.subtotal || 0,
        gstRate: item.gstRate ?? 18,
        gstAmount: item.gstAmount ?? 0
      })),
      totalAmount: doc.totalAmount || 0,
      totalGST: doc.totalGST ?? 0,
      grandTotal: doc.grandTotal ?? doc.totalAmount ?? 0,
      totalItems: doc.totalItems || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(cart: Cart): Promise<Cart> {
    const doc = await CartModel.create({
      userId: cart.userId,
      items: cart.items,
      totalAmount: cart.totalAmount,
      totalGST: cart.totalGST,
      grandTotal: cart.grandTotal,
      totalItems: cart.totalItems
    });
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Cart | null> {
    const doc = await CartModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({ userId });
    return doc ? this.documentToEntity(doc) : null;
  }

  async update(id: string, cart: Cart): Promise<Cart | null> {
    const doc = await CartModel.findByIdAndUpdate(
      id,
      {
        $set: {
          items: cart.items,
          totalAmount: cart.totalAmount,
          totalGST: cart.totalGST,
          grandTotal: cart.grandTotal,
          totalItems: cart.totalItems
        }
      },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await CartModel.findByIdAndDelete(id);
    return !!result;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await CartModel.deleteOne({ userId });
    return result.deletedCount > 0;
  }
}
