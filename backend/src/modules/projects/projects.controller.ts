import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SaveProjectDto } from './dto/save-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get('public')
  getPublic() { return this.projects.getPublicProjects(); }

  @Get('public/:slug')
  getPublicBySlug(@Param('slug') slug: string) { return this.projects.getPublicProject(slug); }

  @Get('admin')
  @UseGuards(AuthGuard)
  getAdmin(@Req() request: AuthenticatedRequest) { return this.projects.getAdminProjects(BigInt(request.user.id)); }

  @Post('admin')
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: SaveProjectDto) {
    return this.projects.create(BigInt(request.user.id), body);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard)
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: SaveProjectDto) {
    return this.projects.update(BigInt(request.user.id), id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.projects.remove(BigInt(request.user.id), id);
  }
}
