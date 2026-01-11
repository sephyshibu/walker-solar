import { Wishlist, WishlistProps } from '../../../domain/entities/Wishlist';
import { IWishlistRepository } from '../../../domain/repositories';
import { WishlistModel, WishlistDocument } from '../models/WishlistModel';

export class MongoWishlistRepository implements IWishlistRepository {
  private documentToEntity(doc: WishlistDocument): Wishlist {
    return new Wishlist({
      id: doc._id.toString(),
      userId: doc.userId,
      items: doc.items,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(wishlist: Wishlist): Promise<Wishlist> {
    const doc = await WishlistModel.create({
      userId: wishlist.userId,
      items: wishlist.items
    });
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Wishlist | null> {
    const doc = await WishlistModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Wishlist | null> {
    const doc = await WishlistModel.findOne({ userId });
    return doc ? this.documentToEntity(doc) : null;
  }

  async update(id: string, wishlist: Wishlist): Promise<Wishlist | null> {
    const doc = await WishlistModel.findByIdAndUpdate(
      id,
      { $set: { items: wishlist.items } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await WishlistModel.findByIdAndDelete(id);
    return !!result;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await WishlistModel.deleteOne({ userId });
    return result.deletedCount > 0;
  }
}
