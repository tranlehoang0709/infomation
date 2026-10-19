import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUsersService } from '../admin-users/admin-users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: AdminUsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const ownerSlug = this.config.getOrThrow<string>('portfolioSlug');
    const user = await this.users.findPortfolioOwnerByEmail(email.trim().toLowerCase(), ownerSlug);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    await this.users.recordLogin(user.id);
    return this.jwt.signAsync({ sub: user.id.toString(), email: user.email });
  }

  async validateSession(userId: string) {
    if (!/^\d+$/.test(userId)) throw new UnauthorizedException();
    const ownerSlug = this.config.getOrThrow<string>('portfolioSlug');
    const user = await this.users.findPortfolioOwnerById(BigInt(userId), ownerSlug);
    if (!user) throw new UnauthorizedException();
    return { id: user.id.toString(), email: user.email };
  }
}
