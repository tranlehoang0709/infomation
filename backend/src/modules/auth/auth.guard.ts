import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.portfolio_session;
    if (typeof token !== 'string') throw new UnauthorizedException();
    let payload: { sub: string };
    try { payload = await this.jwt.verifyAsync<{ sub: string }>(token); }
    catch { throw new UnauthorizedException(); }
    request.user = await this.auth.validateSession(payload.sub);
    return true;
  }
}
