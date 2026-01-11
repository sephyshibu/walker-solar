import { Request, Response, NextFunction } from 'express';
import {
  CreateContactUseCase,
  GetContactByIdUseCase,
  GetAllContactsUseCase,
  MarkContactAsReadUseCase,
  RespondToContactUseCase,
  CloseContactUseCase,
  DeleteContactUseCase,
  GetContactStatsUseCase,
  MarkContactWhatsAppSentUseCase
} from '../../application/use-cases/contact/ContactUseCases';
import { MongoContactRepository } from '../../infrastructure/database/repositories';
import { ContactStatus } from '../../domain/entities/Contact';

const contactRepository = new MongoContactRepository();

export class ContactController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateContactUseCase(contactRepository);
      const result = await useCase.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
        data: {
          contact: result.contact.toJSON(),
          whatsappUrl: result.whatsappUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetContactByIdUseCase(contactRepository);
      const contact = await useCase.execute(req.params.id);

      // Mark as read when admin views it
      const markReadUseCase = new MarkContactAsReadUseCase(contactRepository);
      await markReadUseCase.execute(req.params.id);

      res.json({
        success: true,
        data: contact.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetAllContactsUseCase(contactRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as ContactStatus;

      const result = await useCase.execute({ page, limit }, filters);

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(c => c.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async respond(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new RespondToContactUseCase(contactRepository);
      const contact = await useCase.execute(req.params.id, req.body.response);

      res.json({
        success: true,
        message: 'Response sent successfully',
        data: contact.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CloseContactUseCase(contactRepository);
      const contact = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Contact closed',
        data: contact.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new DeleteContactUseCase(contactRepository);
      await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async markWhatsAppSent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new MarkContactWhatsAppSentUseCase(contactRepository);
      const contact = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'WhatsApp status updated',
        data: contact.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetContactStatsUseCase(contactRepository);
      const stats = await useCase.execute();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
