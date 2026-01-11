import { v4 as uuidv4 } from 'uuid';

export enum ContactStatus {
  NEW = 'new',
  READ = 'read',
  RESPONDED = 'responded',
  CLOSED = 'closed'
}

export interface ContactProps {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  whatsappSent: boolean;
  response?: string;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Contact {
  private props: ContactProps;

  constructor(props: ContactProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      status: props.status || ContactStatus.NEW,
      whatsappSent: props.whatsappSent || false,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  get id(): string {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get subject(): string {
    return this.props.subject;
  }

  get message(): string {
    return this.props.message;
  }

  get status(): ContactStatus {
    return this.props.status;
  }

  get whatsappSent(): boolean {
    return this.props.whatsappSent;
  }

  get response(): string | undefined {
    return this.props.response;
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isNew(): boolean {
    return this.props.status === ContactStatus.NEW;
  }

  markAsRead(): void {
    if (this.props.status === ContactStatus.NEW) {
      this.props.status = ContactStatus.READ;
      this.props.updatedAt = new Date();
    }
  }

  markWhatsappSent(): void {
    this.props.whatsappSent = true;
    this.props.updatedAt = new Date();
  }

  respond(responseMessage: string): void {
    this.props.response = responseMessage;
    this.props.status = ContactStatus.RESPONDED;
    this.props.respondedAt = new Date();
    this.props.updatedAt = new Date();
  }

  close(): void {
    this.props.status = ContactStatus.CLOSED;
    this.props.updatedAt = new Date();
  }

  toJSON(): ContactProps {
    return { ...this.props };
  }

  toObject(): ContactProps {
    return { ...this.props };
  }
}
