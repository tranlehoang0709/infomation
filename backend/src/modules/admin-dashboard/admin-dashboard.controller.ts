import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @UseGuards(AuthGuard)
  getSummary(@Req() request: AuthenticatedRequest) {
    return this.dashboard.getSummary(BigInt(request.user.id));
  }
}
