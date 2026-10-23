import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  imports: [AuthModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, AuthGuard],
})
export class CertificatesModule {}
