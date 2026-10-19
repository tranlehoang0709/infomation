import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';

@Module({ imports: [AuthModule], controllers: [InterestsController], providers: [InterestsService, AuthGuard] })
export class InterestsModule {}
