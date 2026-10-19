import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfolioModuleService {
  constructor(private readonly prisma: PrismaService) {}
  pingDatabase() { return this.prisma.$queryRaw`SELECT 1`; }
}
