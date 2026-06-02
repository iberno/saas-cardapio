import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  aud: 'platform' | 'tenant-user' | 'customer';
  tenantId?: string;
  roles?: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  createAccessToken(payload: TokenPayload): string {
    return this.jwt.sign(payload, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwt.verify<TokenPayload>(token);
  }
}
