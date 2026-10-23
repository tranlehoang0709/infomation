import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveEducationDto } from './dto/save-education.dto';

@Injectable()
export class EducationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getAdminEducations(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const rows = await this.prisma.education.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { educations: rows.map((row) => this.serialize(row)) };
  }

  async getPublicEducations() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        educations: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }, { id: 'asc' }],
        },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return { educations: portfolio.educations.map((row) => this.serialize(row)) };
  }

  async create(userId: bigint, dto: SaveEducationDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const data = this.toData(dto);
    const created = await this.prisma.education.create({
      data: { ...data, portfolioId: portfolio.id },
    });
    return this.serialize(created);
  }

  async update(userId: bigint, idValue: string, dto: SaveEducationDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const existing = await this.prisma.education.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Education record was not found.');

    const updated = await this.prisma.education.update({ where: { id }, data: this.toData(dto) });
    return this.serialize(updated);
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const existing = await this.prisma.education.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Education record was not found.');

    await this.prisma.education.delete({ where: { id } });
    return { ok: true };
  }

  private toData(dto: SaveEducationDto) {
    const schoolName = dto.schoolName.trim();
    if (!schoolName) throw new BadRequestException('School name is required.');

    const startDate = this.toDate(dto.startDate);
    const endDate = dto.isCurrent ? null : this.toDate(dto.endDate);

    if (dto.isCurrent && dto.endDate) {
      throw new BadRequestException('A current education entry cannot have an end date.');
    }
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date must be on or after the start date.');
    }

    return {
      schoolName,
      degree: this.clean(dto.degree),
      major: this.clean(dto.major),
      startDate,
      endDate,
      isCurrent: dto.isCurrent ?? false,
      description: this.clean(dto.description),
      sortOrder: dto.sortOrder ?? 0,
      isVisible: dto.isVisible ?? true,
    };
  }

  private serialize(row: {
    id: bigint;
    portfolioId: bigint;
    schoolName: string;
    degree: string | null;
    major: string | null;
    startDate: Date | null;
    endDate: Date | null;
    isCurrent: boolean;
    description: string | null;
    sortOrder: number;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...row,
      id: row.id.toString(),
      portfolioId: row.portfolioId.toString(),
      startDate: row.startDate ? row.startDate.toISOString() : null,
      endDate: row.endDate ? row.endDate.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDate(value?: string | null) {
    return value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null;
  }

  private clean(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private parseId(value: string) {
    if (!/^\d{1,20}$/.test(value)) throw new BadRequestException('Invalid record ID.');
    const parsed = BigInt(value);
    if (parsed > 18446744073709551615n) throw new BadRequestException('Invalid record ID.');
    return parsed;
  }
}
