import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MailService } from '../../infra/mail/mail.service';
import { hashPassword } from './auth-utils';
import * as crypto from 'crypto';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async requestReset(email: string, userType: 'PLATFORM_ADMIN' | 'TENANT_USER') {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let userId: string | null = null;
    let userName = '';

    if (userType === 'PLATFORM_ADMIN') {
      const admin = await this.prisma.platformAdmin.findUnique({ where: { email } });
      if (admin) { userId = admin.id; userName = admin.name; }
    } else {
      const user = await this.prisma.tenantUser.findFirst({ where: { email } });
      if (user) { userId = user.id; userName = user.name; }
    }

    if (!userId) {
      return { message: 'Se o email existir, um link de redefinição será gerado.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userType,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      },
    });

    const typeParam = userType === 'PLATFORM_ADMIN' ? 'platform' : 'tenant';
    const resetUrl = `${baseUrl}/resetar-senha?token=${rawToken}&type=${typeParam}`;

    if (process.env.NODE_ENV === 'development') {
      return {
        message: 'Se o email existir, um link de redefinição será gerado.',
        devToken: rawToken,
        devUrl: resetUrl,
      };
    }

    try {
      await this.mail.sendPasswordReset(email, userName, resetUrl);
    } catch { /* silencia erro de email */ }

    return { message: 'Se o email existir, um link de redefinição será gerado.' };
  }

  async resetPassword(rawToken: string, newPassword: string, userType: 'PLATFORM_ADMIN' | 'TENANT_USER') {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    if (stored.userType !== userType) {
      throw new BadRequestException('Token inválido para este tipo de usuário');
    }

    const passwordHash = await hashPassword(newPassword);

    if (userType === 'PLATFORM_ADMIN') {
      await this.prisma.platformAdmin.update({
        where: { id: stored.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      });
    } else {
      await this.prisma.tenantUser.update({
        where: { id: stored.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      });
    }

    await this.prisma.passwordResetToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: stored.userId, userType, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }
}
