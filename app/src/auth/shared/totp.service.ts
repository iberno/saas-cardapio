import { Injectable, BadRequestException } from '@nestjs/common';
import { verify, generateSecret, generateURI } from 'otplib';
import * as crypto from 'crypto';

// In-memory pre-auth tokens (single-process, volatil)
const preAuthStore = new Map<string, { userId: string; tenantId?: string; expiresAt: number }>();

@Injectable()
export class TotpService {
  generateSecret(email: string, issuer = 'SaaS Cardápio'): { secret: string; url: string } {
    const secret = generateSecret();
    const url = generateURI({ issuer, label: email, secret });
    return { secret, url };
  }

  async verify(code: string, secret: string): Promise<boolean> {
    try { const r = await verify({ token: code, secret }); return r.valid; }
    catch { return false; }
  }

  createPreAuthToken(userId: string, tenantId?: string): string {
    const token = crypto.randomBytes(24).toString('hex');
    preAuthStore.set(token, {
      userId,
      tenantId,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });
    return token;
  }

  consumePreAuthToken(token: string): { userId: string; tenantId?: string } {
    const entry = preAuthStore.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      preAuthStore.delete(token);
      throw new BadRequestException('Token de pré-autenticação inválido ou expirado');
    }
    preAuthStore.delete(token);
    return { userId: entry.userId, tenantId: entry.tenantId };
  }

  generateRecoveryCodes(): { raw: string[]; hashed: string[] } {
    const raw: string[] = [];
    const hashed: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      raw.push(code);
      hashed.push(crypto.createHash('sha256').update(code).digest('hex'));
    }
    return { raw, hashed };
  }

  verifyRecoveryCode(code: string, hashedCodes: string[]): string | null {
    const hash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
    return hashedCodes.find((h) => h === hash) || null;
  }
}
