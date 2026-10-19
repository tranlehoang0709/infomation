import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { SaveExperienceDto } from './dto/save-experience.dto';
import { ExperiencesService } from './experiences.service';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get('public')
  getPublic() {
    return this.experiences.getPublicExperiences();
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  getAdmin(@Req() request: AuthenticatedRequest) {
    return this.experiences.getAdminExperiences(BigInt(request.user.id));
  }

  @Post('admin')
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: SaveExperienceDto) {
    return this.experiences.create(BigInt(request.user.id), body);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SaveExperienceDto,
  ) {
    return this.experiences.update(BigInt(request.user.id), id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.experiences.remove(BigInt(request.user.id), id);
  }
}
