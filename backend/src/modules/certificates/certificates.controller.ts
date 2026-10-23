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
import { SaveCertificateDto } from './dto/save-certificate.dto';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('public')
  getPublic() {
    return this.certificates.getPublicCertificates();
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  getAdmin(@Req() request: AuthenticatedRequest) {
    return this.certificates.getAdminCertificates(BigInt(request.user.id));
  }

  @Post('admin')
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: SaveCertificateDto) {
    return this.certificates.create(BigInt(request.user.id), body);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SaveCertificateDto,
  ) {
    return this.certificates.update(BigInt(request.user.id), id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.certificates.remove(BigInt(request.user.id), id);
  }
}
