import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

const keys = ['profile', 'educations', 'certificates', 'experiences', 'skills', 'projects', 'interests'] as const;
type Visibility = Record<typeof keys[number], boolean>;

function normalizeVisibility(value: CreateShareLinkDto['visibility']): Visibility {
  return Object.fromEntries(keys.map((key) => [key, value?.[key] === true])) as Visibility;
}

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
function serialize(value: unknown): any {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  return value;
}

@Injectable()
export class ShareLinksService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async create(userId: bigint, data: CreateShareLinkDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio not found.');
    const token = randomBytes(32).toString('base64url');
    const link = await this.prisma.portfolioShareLink.create({ data: {
      portfolioId: portfolio.id,
      tokenHash: hashToken(token),
      visibility: normalizeVisibility(data.visibility) as unknown as Prisma.InputJsonValue,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    }, select: { id: true, visibility: true, expiresAt: true, createdAt: true } });
    return { ...serialize(link), token, url: `${this.config.get<string>('frontendOrigin')}/share/${token}` };
  }

  async list(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio not found.');
    const links = await this.prisma.portfolioShareLink.findMany({ where: { portfolioId: portfolio.id }, orderBy: { createdAt: 'desc' }, select: { id: true, visibility: true, expiresAt: true, revokedAt: true, createdAt: true } });
    return { links: serialize(links) };
  }

  async revoke(userId: bigint, id: string) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio not found.');
    await this.prisma.portfolioShareLink.updateMany({ where: { id: BigInt(id), portfolioId: portfolio.id }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async preview(userId: bigint, data: CreateShareLinkDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true, title: true, profile: true } });
    if (!portfolio) throw new NotFoundException('Portfolio not found.');
    return this.buildResponse(portfolio.id, portfolio.title, portfolio.profile, normalizeVisibility(data.visibility));
  }

  async resolve(token: string) {
    const link = await this.prisma.portfolioShareLink.findUnique({ where: { tokenHash: hashToken(token) }, include: { portfolio: { select: { id: true, title: true, slug: true, profile: true } } } });
    if (!link || link.revokedAt || (link.expiresAt && link.expiresAt <= new Date())) throw new NotFoundException('Share link is invalid or expired.');
    return this.buildResponse(link.portfolioId, link.portfolio.title, link.portfolio.profile, normalizeVisibility(link.visibility as CreateShareLinkDto['visibility']));
  }

  private async buildResponse(portfolioId: bigint, title: string, rawProfile: any, visibility: Visibility) {
    const [educations, certificates, experiences, skills, projects, interests] = await Promise.all([
      visibility.educations ? this.prisma.education.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
      visibility.certificates ? this.prisma.certificate.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
      visibility.experiences ? this.prisma.experience.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
      visibility.skills ? this.prisma.skill.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
      visibility.projects ? this.prisma.project.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
      visibility.interests ? this.prisma.interest.findMany({ where: { portfolioId, isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }) : [],
    ]);
    const profile = visibility.profile && rawProfile ? {
      ...rawProfile,
      id: undefined,
      portfolioId: undefined,
      avatarUrl: rawProfile.avatarMediaId ? `/media/${rawProfile.avatarMediaId}/file` : null,
      cvUrl: rawProfile.cvMediaId ? `/media/${rawProfile.cvMediaId}/file` : null,
      avatarMediaId: undefined,
      cvMediaId: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    } : null;
    return serialize({ title, profile, visibility, educations, certificates, experiences, skills, projects, interests });
  }
}
