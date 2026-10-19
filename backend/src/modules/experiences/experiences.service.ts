import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveExperienceDto } from './dto/save-experience.dto';

type ExperienceRow = Prisma.ExperienceGetPayload<{}>;
const COMPANY_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getAdminExperiences(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const rows = await this.prisma.experience.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { experiences: await this.withLogos(rows, false) };
  }

  async getPublicExperiences() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        experiences: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }, { id: 'asc' }],
        },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return { experiences: await this.withLogos(portfolio.experiences, true) };
  }

  async create(userId: bigint, dto: SaveExperienceDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    const data = this.toData(dto);
    await this.assertOwnedMedia(portfolio.id, data.companyLogoMediaId);

    const created = await this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.create({ data: { ...data.record, portfolioId: portfolio.id } });
      if (data.companyLogoMediaId !== null) {
        await tx.portfolioMedia.create({
          data: {
            portfolioId: portfolio.id,
            mediaAssetId: data.companyLogoMediaId,
            entityType: 'experience',
            entityId: experience.id,
            mediaRole: 'company_logo',
          },
        });
      }
      return experience;
    });
    return (await this.withLogos([created], false))[0];
  }

  async update(userId: bigint, idValue: string, dto: SaveExperienceDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    const existing = await this.prisma.experience.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Experience was not found.');

    const data = this.toData(dto);
    await this.assertOwnedMedia(portfolio.id, data.companyLogoMediaId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.update({
        where: { id },
        data: data.record,
      });
      await tx.portfolioMedia.deleteMany({
        where: { portfolioId: portfolio.id, entityType: 'experience', entityId: id, mediaRole: 'company_logo' },
      });
      if (data.companyLogoMediaId !== null) {
        await tx.portfolioMedia.create({
          data: {
            portfolioId: portfolio.id,
            mediaAssetId: data.companyLogoMediaId,
            entityType: 'experience',
            entityId: id,
            mediaRole: 'company_logo',
          },
        });
      }
      return experience;
    });
    return (await this.withLogos([updated], false))[0];
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    const existing = await this.prisma.experience.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Experience was not found.');

    await this.prisma.$transaction(async (tx) => {
      await tx.portfolioMedia.deleteMany({
        where: { portfolioId: portfolio.id, entityType: 'experience', entityId: id },
      });
      await tx.experience.delete({ where: { id } });
    });
    return { ok: true };
  }

  private toData(dto: SaveExperienceDto) {
    const companyName = dto.companyName.trim();
    const position = dto.position.trim();
    if (!companyName || !position) throw new BadRequestException('Company and job title are required.');

    const startDate = this.toDate(dto.startDate);
    const endDate = dto.isCurrent ? null : this.toDate(dto.endDate);
    if (dto.isCurrent && dto.endDate) {
      throw new BadRequestException('A current role cannot have an end date.');
    }
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date must be on or after the start date.');
    }

    const achievements = (dto.achievements ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    const mediaId = dto.companyLogoMediaId ? this.parseId(dto.companyLogoMediaId) : null;

    return {
      companyLogoMediaId: mediaId,
      record: {
        companyName,
        position,
        employmentType: this.clean(dto.employmentType),
        location: this.clean(dto.location),
        startDate,
        endDate,
        isCurrent: dto.isCurrent ?? false,
        description: this.clean(dto.description),
        achievements: achievements.length ? achievements : Prisma.JsonNull,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true,
      },
    };
  }

  private async assertOwnedMedia(portfolioId: bigint, mediaId: bigint | null) {
    if (mediaId === null) return;
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: mediaId, portfolioId, mimeType: { in: COMPANY_LOGO_TYPES } },
      select: { id: true },
    });
    if (!asset) throw new BadRequestException('The selected company logo does not belong to this portfolio.');
  }

  private async withLogos(rows: ExperienceRow[], publicView: boolean) {
    if (!rows.length) return [];
    const ids = rows.map(({ id }) => id);
    const links = await this.prisma.portfolioMedia.findMany({
      where: {
        portfolioId: { in: [...new Set(rows.map(({ portfolioId }) => portfolioId))] },
        entityType: 'experience',
        mediaRole: 'company_logo',
        entityId: { in: ids },
      },
      include: { mediaAsset: { select: { id: true, altText: true } } },
    });
    const logoByExperience = new Map(links.map((link) => [link.entityId.toString(), link.mediaAsset]));
    return rows.map((row) => {
      const logo = logoByExperience.get(row.id.toString()) ?? null;
      const filePath = logo
        ? publicView ? `/media/${logo.id.toString()}/file` : `/media/admin/${logo.id.toString()}/file`
        : null;
      return {
        ...row,
        id: row.id.toString(),
        portfolioId: row.portfolioId.toString(),
        achievements: Array.isArray(row.achievements) ? row.achievements : [],
        companyLogo: logo ? { id: logo.id.toString(), altText: logo.altText, filePath } : null,
      };
    });
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
