import { Contact, ContactStatus, ContactProps } from '../../../domain/entities/Contact';
import { IContactRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

interface CreateContactDTO {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  whatsappSent: boolean;
  
}

export class CreateContactUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(data: CreateContactDTO): Promise<{ contact: Contact; whatsappUrl: string }> {
    const contact = new Contact({
      ...data,
      status: ContactStatus.NEW
    });

    const createdContact = await this.contactRepository.create(contact);

    // Generate WhatsApp URL for admin notification
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
    
    // Build message parts
    const messageParts = [
      '*NEW CONTACT MESSAGE*',
      '',
      `*Name:* ${data.name}`,
      `*Email:* ${data.email}`
    ];
    
    if (data.phone) {
      messageParts.push(`*Phone:* ${data.phone}`);
    }
    
    messageParts.push(`*Subject:* ${data.subject}`);
    messageParts.push('');
    messageParts.push('*Message:*');
    messageParts.push(data.message);
    
    const whatsappMessage = messageParts.join('\n');
    
    // Create WhatsApp URL - only encode once
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return { contact: createdContact, whatsappUrl };
  }
}

export class GetContactByIdUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }
    return contact;
  }
}

export class GetAllContactsUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: { status?: ContactStatus }
  ): Promise<PaginatedResult<Contact>> {
    return this.contactRepository.findAll(options, filters);
  }
}

export class MarkContactAsReadUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    if (contact.status !== ContactStatus.NEW) {
      return contact;
    }

    const updatedContact = await this.contactRepository.updateStatus(id, ContactStatus.READ);
    if (!updatedContact) {
      throw new AppError('Failed to update contact', 500);
    }

    return updatedContact;
  }
}

export class RespondToContactUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string, responseMessage: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const updatedContact = await this.contactRepository.update(id, {
      response: responseMessage,
      status: ContactStatus.RESPONDED,
      respondedAt: new Date()
    });

    if (!updatedContact) {
      throw new AppError('Failed to update contact', 500);
    }

    return updatedContact;
  }
}

export class CloseContactUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const updatedContact = await this.contactRepository.updateStatus(id, ContactStatus.CLOSED);
    if (!updatedContact) {
      throw new AppError('Failed to close contact', 500);
    }

    return updatedContact;
  }
}

export class DeleteContactUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string): Promise<void> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    await this.contactRepository.delete(id);
  }
}

export class MarkContactWhatsAppSentUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const updatedContact = await this.contactRepository.update(id, { whatsappSent: true });
    if (!updatedContact) {
      throw new AppError('Failed to update contact', 500);
    }

    return updatedContact;
  }
}

export class GetContactStatsUseCase {
  constructor(private contactRepository: IContactRepository) {}

  async execute(): Promise<{
    total: number;
    new: number;
    read: number;
    responded: number;
    closed: number;
  }> {
    const [total, newCount, read, responded, closed] = await Promise.all([
      this.contactRepository.count(),
      this.contactRepository.count({ status: ContactStatus.NEW }),
      this.contactRepository.count({ status: ContactStatus.READ }),
      this.contactRepository.count({ status: ContactStatus.RESPONDED }),
      this.contactRepository.count({ status: ContactStatus.CLOSED })
    ]);

    return { total, new: newCount, read, responded, closed };
  }
}
