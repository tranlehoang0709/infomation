import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findPortfolioOwnerByEmail(email: string, portfolioSlug: string) {
    return this.prisma.user.findFirst({
      where: { email, isActive: true, portfolio: { is: { slug: portfolioSlug } } },
    });
  }

  findPortfolioOwnerById(id: bigint, portfolioSlug: string) {
    return this.prisma.user.findFirst({
      where: { id, isActive: true, portfolio: { is: { slug: portfolioSlug } } },
      select: { id: true, email: true },
    });
  }

  recordLogin(id: bigint) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
