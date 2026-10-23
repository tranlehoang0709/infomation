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
import { SaveEducationDto } from './dto/save-education.dto';
import { EducationsService } from './educations.service';

@Controller('educations')
export class EducationsController {
  constructor(private readonly educations: EducationsService) {}

  @Get('public')
  getPublic() {
    return this.educations.getPublicEducations();
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  getAdmin(@Req() request: AuthenticatedRequest) {
    return this.educations.getAdminEducations(BigInt(request.user.id));
  }

  @Post('admin')
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: SaveEducationDto) {
    return this.educations.create(BigInt(request.user.id), body);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SaveEducationDto,
  ) {
    return this.educations.update(BigInt(request.user.id), id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.educations.remove(BigInt(request.user.id), id);
  }
}
