import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';

@Module({
  imports: [AuthModule],
  controllers: [ExperiencesController],
  providers: [ExperiencesService, AuthGuard],
})
export class ExperiencesModule {}
