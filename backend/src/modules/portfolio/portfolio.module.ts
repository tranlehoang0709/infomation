import { Module } from '@nestjs/common';
import { PortfolioModuleService } from './portfolio.service';

@Module({ providers: [PortfolioModuleService], exports: [PortfolioModuleService] })
export class PortfolioModule {}
