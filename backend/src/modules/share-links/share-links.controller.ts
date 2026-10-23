import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { ShareLinksService } from './share-links.service';

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly links: ShareLinksService) {}
  @Get() @UseGuards(AuthGuard) list(@Req() req: AuthenticatedRequest) { return this.links.list(BigInt(req.user.id)); }
  @Post() @UseGuards(AuthGuard) create(@Req() req: AuthenticatedRequest, @Body() body: CreateShareLinkDto) { return this.links.create(BigInt(req.user.id), body); }
  @Post('preview') @UseGuards(AuthGuard) preview(@Req() req: AuthenticatedRequest, @Body() body: CreateShareLinkDto) { return this.links.preview(BigInt(req.user.id), body); }
  @Delete(':id') @UseGuards(AuthGuard) revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.links.revoke(BigInt(req.user.id), id); }
  @Get('public/:token') resolve(@Param('token') token: string) { return this.links.resolve(token); }
}
