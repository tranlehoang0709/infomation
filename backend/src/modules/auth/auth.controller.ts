import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const token = await this.auth.login(body.email, body.password);
    response.cookie('portfolio_session', token, {
      httpOnly: true,
      secure: this.config.get('nodeEnv') === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return { email: body.email.trim().toLowerCase() };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('portfolio_session', { httpOnly: true, sameSite: 'strict', path: '/api' });
    return { ok: true };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  session(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}
