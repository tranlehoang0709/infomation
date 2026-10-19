import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SaveInterestDto } from './dto/save-interest.dto';
import { InterestsService } from './interests.service';

@Controller('interests')
export class InterestsController {
  constructor(private readonly interests: InterestsService) {}

  @Get('public') getPublic() { return this.interests.getPublic(); }

  @Get('admin') @UseGuards(AuthGuard)
  getAdmin(@Req() req: AuthenticatedRequest) { return this.interests.getAdmin(BigInt(req.user.id)); }

  @Post('admin') @UseGuards(AuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() body: SaveInterestDto) { return this.interests.create(BigInt(req.user.id), body); }

  @Patch('admin/:id') @UseGuards(AuthGuard)
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: SaveInterestDto) {
    return this.interests.update(BigInt(req.user.id), id, body);
  }

  @Delete('admin/:id') @UseGuards(AuthGuard)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.interests.remove(BigInt(req.user.id), id); }
}
