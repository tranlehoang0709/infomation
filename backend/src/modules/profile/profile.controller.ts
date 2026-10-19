import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('public')
  getPublic() { return this.profiles.getPublicProfile(); }

  @Get('admin')
  @UseGuards(AuthGuard)
  getAdmin(@Req() request: AuthenticatedRequest) { return this.profiles.getAdminProfile(BigInt(request.user.id)); }

  @Patch('admin')
  @UseGuards(AuthGuard)
  update(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.profiles.update(BigInt(request.user.id), body);
  }
}
