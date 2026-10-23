import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SaveSkillDto } from './dto/save-skill.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get('public') getPublic() { return this.skills.getPublic(); }

  @Get('admin') @UseGuards(AuthGuard)
  getAdmin(@Req() req: AuthenticatedRequest) { return this.skills.getAdmin(BigInt(req.user.id)); }

  @Post('admin') @UseGuards(AuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() body: SaveSkillDto) { return this.skills.create(BigInt(req.user.id), body); }

  @Patch('admin/:id') @UseGuards(AuthGuard)
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: SaveSkillDto) {
    return this.skills.update(BigInt(req.user.id), id, body);
  }

  @Delete('admin/:id') @UseGuards(AuthGuard)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.skills.remove(BigInt(req.user.id), id); }
}
