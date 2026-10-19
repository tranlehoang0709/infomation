import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveProjectDto } from './dto/save-project.dto';

type ProjectRow = Project;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async getAdminProjects(userId: bigint) {
    const portfolio = await this.ownerPortfolio(userId);
    const projects = await this.prisma.project.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { projects: await this.withMedia(projects, false) };
  }

  async getPublicProjects() {
    const portfolio = await this.publicPortfolio();
    const projects = await this.prisma.project.findMany({
      where: { portfolioId: portfolio.id, isVisible: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { startDate: 'desc' }, { id: 'asc' }],
    });
    return { projects: await this.withMedia(projects, true) };
  }

  async getPublicProject(slugOrId: string) {
    const portfolio = await this.publicPortfolio();
    const project = await this.prisma.project.findFirst({
      where: {
        portfolioId: portfolio.id,
        isVisible: true,
        OR: [
          { slug: slugOrId },
          ...(this.isId(slugOrId) ? [{ id: BigInt(slugOrId), slug: null }] : []),
        ],
      },
    });
    if (!project) throw new NotFoundException('Project was not found.');
    return { project: (await this.withMedia([project], true))[0] };
  }

  async create(userId: bigint, dto: SaveProjectDto) {
    const portfolio = await this.ownerPortfolio(userId);
    const input = this.toData(dto);
    const slug = await this.uniqueSlug(portfolio.id, input.slug || this.makeSlug(input.record.name));
    await this.assertOwnedImages(portfolio.id, input.thumbnailId, input.galleryIds);

    try {
      const project = await this.prisma.$transaction(async (tx) => {
        const created = await tx.project.create({ data: { ...input.record, slug, portfolioId: portfolio.id } });
        await this.replaceMedia(tx, portfolio.id, created.id, input.thumbnailId, input.galleryIds);
        return created;
      });
      return (await this.withMedia([project], false))[0];
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(userId: bigint, idValue: string, dto: SaveProjectDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.ownerPortfolio(userId);
    const existing = await this.prisma.project.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Project was not found.');

    const input = this.toData(dto);
    const slug = await this.uniqueSlug(
      portfolio.id,
      input.slug || existing.slug || this.makeSlug(input.record.name),
      id,
    );
    await this.assertOwnedImages(portfolio.id, input.thumbnailId, input.galleryIds);

    try {
      const project = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.project.update({ where: { id }, data: { ...input.record, slug } });
        await this.replaceMedia(tx, portfolio.id, id, input.thumbnailId, input.galleryIds);
        return updated;
      });
      return (await this.withMedia([project], false))[0];
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.ownerPortfolio(userId);
    const project = await this.prisma.project.findFirst({ where: { id, portfolioId: portfolio.id }, select: { id: true } });
    if (!project) throw new NotFoundException('Project was not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.portfolioMedia.deleteMany({ where: { portfolioId: portfolio.id, entityType: 'project', entityId: id } });
      await tx.project.delete({ where: { id } });
    });
    return { ok: true };
  }

  private async ownerPortfolio(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    return portfolio;
  }

  private async publicPortfolio() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true }, select: { id: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return portfolio;
  }

  private toData(dto: SaveProjectDto) {
    const name = dto.title.trim();
    if (!name) throw new BadRequestException('Project title is required.');
    const startDate = this.toDate(dto.startDate);
    const endDate = this.toDate(dto.endDate);
    if (startDate && endDate && endDate < startDate) throw new BadRequestException('End date must be on or after the start date.');
    const technologies = [...new Set((dto.technologies ?? []).map((item) => item.trim()).filter(Boolean))];
    const galleryIds = [...new Set((dto.galleryMediaIds ?? []).filter(Boolean))].map((value) => this.parseId(value));
    const thumbnailId = dto.thumbnailMediaId ? this.parseId(dto.thumbnailMediaId) : null;
    return {
      slug: dto.slug?.trim() || null,
      thumbnailId,
      galleryIds,
      record: {
        name,
        summary: this.clean(dto.shortDescription),
        description: this.clean(dto.description),
        role: this.clean(dto.role),
        technologies: technologies.length ? technologies : Prisma.JsonNull,
        githubUrl: this.clean(dto.githubUrl),
        demoUrl: this.clean(dto.demoUrl),
        startDate,
        endDate,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true,
      },
    };
  }

  private async uniqueSlug(portfolioId: bigint, requested: string, excludingId?: bigint) {
    const base = this.normalizeSlug(requested) || 'project';
    if (base.length > 180) throw new BadRequestException('Slug must be 180 characters or fewer.');
    for (let suffix = 1; suffix <= 100; suffix++) {
      const candidate = suffix === 1 ? base : `${base.slice(0, 180 - String(suffix).length - 1)}-${suffix}`;
      const found = await this.prisma.project.findFirst({
        where: { portfolioId, slug: candidate, ...(excludingId ? { id: { not: excludingId } } : {}) },
        select: { id: true },
      });
      if (!found) return candidate;
    }
    throw new ConflictException('Could not create a unique project slug.');
  }

  private makeSlug(value: string) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
  }

  private normalizeSlug(value: string) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async assertOwnedImages(portfolioId: bigint, thumbnailId: bigint | null, galleryIds: bigint[]) {
    const ids = [...new Set([...(thumbnailId ? [thumbnailId] : []), ...galleryIds])];
    if (!ids.length) return;
    const assets = await this.prisma.mediaAsset.findMany({
      where: { portfolioId, id: { in: ids }, mimeType: { in: IMAGE_TYPES } }, select: { id: true },
    });
    if (assets.length !== ids.length) throw new BadRequestException('Selected project images must belong to this portfolio and be images.');
  }

  private async replaceMedia(tx: Prisma.TransactionClient, portfolioId: bigint, projectId: bigint, thumbnailId: bigint | null, galleryIds: bigint[]) {
    await tx.portfolioMedia.deleteMany({ where: { portfolioId, entityType: 'project', entityId: projectId } });
    if (thumbnailId) await tx.portfolioMedia.create({
      data: { portfolioId, entityType: 'project', entityId: projectId, mediaAssetId: thumbnailId, mediaRole: 'thumbnail' },
    });
    if (galleryIds.length) await tx.portfolioMedia.createMany({
      data: galleryIds.filter((id) => id !== thumbnailId).map((mediaAssetId, index) => ({
        portfolioId, entityType: 'project', entityId: projectId, mediaAssetId, mediaRole: 'gallery', sortOrder: index,
      })),
    });
  }

  private async withMedia(rows: ProjectRow[], publicView: boolean) {
    if (!rows.length) return [];
    const links = await this.prisma.portfolioMedia.findMany({
      where: {
        portfolioId: { in: [...new Set(rows.map((row) => row.portfolioId))] },
        entityType: 'project', entityId: { in: rows.map((row) => row.id) },
        mediaRole: { in: ['thumbnail', 'gallery'] },
      },
      include: { mediaAsset: { select: { id: true, altText: true } } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const linksByProject = new Map<string, typeof links>();
    for (const link of links) linksByProject.set(link.entityId.toString(), [...(linksByProject.get(link.entityId.toString()) ?? []), link]);
    return rows.map((row) => {
      const projectLinks = linksByProject.get(row.id.toString()) ?? [];
      const asset = (link: (typeof links)[number]) => ({
        id: link.mediaAsset.id.toString(), altText: link.mediaAsset.altText,
        filePath: publicView ? `/media/${link.mediaAsset.id.toString()}/file` : `/media/admin/${link.mediaAsset.id.toString()}/file`,
      });
      const thumbnail = projectLinks.find((link) => link.mediaRole === 'thumbnail');
      const gallery = projectLinks.filter((link) => link.mediaRole === 'gallery').map(asset);
      return {
        ...row,
        id: row.id.toString(), portfolioId: row.portfolioId.toString(),
        technologies: Array.isArray(row.technologies) ? row.technologies.filter((item): item is string => typeof item === 'string') : [],
        thumbnail: thumbnail ? asset(thumbnail) : null,
        gallery,
      };
    });
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A project with this slug already exists.');
    }
    throw error;
  }

  private toDate(value?: string | null) { return value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null; }
  private clean(value?: string | null) { const trimmed = value?.trim(); return trimmed || null; }
  private isId(value: string) { return /^\d{1,20}$/.test(value) && BigInt(value) <= 18446744073709551615n; }
  private parseId(value: string) {
    if (!this.isId(value)) throw new BadRequestException('Invalid project or media ID.');
    return BigInt(value);
  }
}
