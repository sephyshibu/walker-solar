import { Contact, ContactStatus, ContactProps } from '../../../domain/entities/Contact';
import { IContactRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { ContactModel, ContactDocument } from '../models/ContactModel';

export class MongoContactRepository implements IContactRepository {
  private documentToEntity(doc: ContactDocument): Contact {
    return new Contact({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      subject: doc.subject,
      message: doc.message,
      status: doc.status as ContactStatus,
      whatsappSent: doc.whatsappSent || false,
      response: doc.response,
      respondedAt: doc.respondedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(contact: Contact): Promise<Contact> {
    const doc = await ContactModel.create(contact.toObject());
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Contact | null> {
    const doc = await ContactModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findAll(
    options: PaginationOptions,
    filters?: { status?: ContactStatus }
  ): Promise<PaginatedResult<Contact>> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;

    const total = await ContactModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await ContactModel.find(query)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    return {
      data: docs.map(doc => this.documentToEntity(doc)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };
  }

  async update(id: string, data: Partial<ContactProps>): Promise<Contact | null> {
    const doc = await ContactModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async updateStatus(id: string, status: ContactStatus): Promise<Contact | null> {
    const doc = await ContactModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ContactModel.findByIdAndDelete(id);
    return !!result;
  }

  async count(filters?: { status?: ContactStatus }): Promise<number> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    return ContactModel.countDocuments(query);
  }
}
