import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { EducationsController } from './educations.controller';
import { EducationsService } from './educations.service';

@Module({
  imports: [AuthModule],
  controllers: [EducationsController],
  providers: [EducationsService, AuthGuard],
})
export class EducationsModule {}
