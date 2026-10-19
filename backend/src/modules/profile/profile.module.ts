import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({ imports: [AuthModule], controllers: [ProfileController], providers: [ProfileService, AuthGuard] })
export class ProfileModule {}
