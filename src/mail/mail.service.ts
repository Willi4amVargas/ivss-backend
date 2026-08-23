import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private mailTransporter: Transporter;
  constructor(private readonly configService: ConfigService) {
    this.mailTransporter = createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<string>('MAIL_ENCRYPTION') === 'ssl',
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }
  sendMail = async (to: string, subject: string, html: string) => {
    try {
      const info = await this.mailTransporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        html,
        subject,
        to,
      });
      return info.messageId;
    } catch (error: any) {
      switch (error.code) {
        case 'ECONNECTION':
        case 'ETIMEDOUT':
          throw new Error('Network error - retry later:', error.message);
        case 'EAUTH':
          throw new Error('Authentication failed:', error.message);
        case 'EENVELOPE':
          throw new Error('Invalid recipients: ' + error.rejected.join(', '));
        default:
          throw new Error('Send failed:', error.message);
      }
    }
  };
}
