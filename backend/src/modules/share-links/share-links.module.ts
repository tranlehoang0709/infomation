import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { ShareLinksController } from './share-links.controller';
import { ShareLinksService } from './share-links.service';

@Module({ imports: [AuthModule], controllers: [ShareLinksController], providers: [ShareLinksService, AuthGuard] })
export class ShareLinksModule {}
