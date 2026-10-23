import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [AuthModule],
  controllers: [SkillsController],
  providers: [SkillsService, AuthGuard],
})
export class SkillsModule {}
