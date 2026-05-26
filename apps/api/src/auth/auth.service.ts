import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const expectedUsername = this.config.getOrThrow<string>('HANDLER_USERNAME');
    const passwordHash = this.config.getOrThrow<string>('HANDLER_PASSWORD_HASH');

    if (username !== expectedUsername) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: 'lachlan', username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
