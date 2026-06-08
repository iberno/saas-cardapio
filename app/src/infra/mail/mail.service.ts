import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string) {
    if (!this.transporter) return;

    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@ohmeupedido.com.br'),
      to: email,
      subject: 'Redefinição de senha - ohmeupedido.com.br',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Olá, ${name}!</h2>
          <p>Recebemos uma solicitação de redefinição de senha para sua conta.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
              Redefinir senha
            </a>
          </p>
          <p>Se você não solicitou esta alteração, ignore este email.</p>
          <p>Este link expira em 1 hora.</p>
        </div>
      `,
    });
  }
}
