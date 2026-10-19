import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async getAdminProfile(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, include: { profile: true } });
    if (!portfolio) throw new NotFoundException('Không tìm thấy portfolio của tài khoản này.');
    const profile = this.serializeProfile(portfolio.profile);
    if (portfolio.profile && profile) {
      const cover = await this.prisma.portfolioMedia.findFirst({
        where: { portfolioId: portfolio.id, entityType: 'profile', entityId: portfolio.profile.id, mediaRole: 'cover' },
        select: { mediaAssetId: true },
      });
      profile.coverMediaId = cover?.mediaAssetId.toString() ?? null;
    }
    return { profile, portfolio: { title: portfolio.title, slug: portfolio.slug } };
  }

  async update(userId: bigint, data: UpdateProfileDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Không tìm thấy portfolio của tài khoản này.');
    const clean = {
      fullName: data.fullName.trim(),
      headline: this.clean(data.headline),
      phone: this.clean(data.phone),
      contactEmail: this.clean(data.contactEmail)?.toLowerCase() ?? null,
      location: this.clean(data.location),
      bio: this.clean(data.bio),
    };
    if (!clean.fullName) throw new BadRequestException('Họ tên không được để trống.');
    const avatarMediaId = data.avatarMediaId === undefined ? undefined : data.avatarMediaId ? this.parseId(data.avatarMediaId) : null;
    const cvMediaId = data.cvMediaId === undefined ? undefined : data.cvMediaId ? this.parseId(data.cvMediaId) : null;
    const coverMediaId = data.coverMediaId === undefined ? undefined : data.coverMediaId ? this.parseId(data.coverMediaId) : null;
    const profile = await this.prisma.$transaction(async (tx) => {
      await this.assertMedia(tx.mediaAsset, portfolio.id, avatarMediaId, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
      await this.assertMedia(tx.mediaAsset, portfolio.id, cvMediaId, ['application/pdf']);
      await this.assertMedia(tx.mediaAsset, portfolio.id, coverMediaId, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
      const saved = await tx.profile.upsert({
        where: { portfolioId: portfolio.id },
        create: { portfolioId: portfolio.id, ...clean, avatarMediaId: avatarMediaId ?? null, cvMediaId: cvMediaId ?? null },
        update: { ...clean, ...(avatarMediaId !== undefined ? { avatarMediaId } : {}), ...(cvMediaId !== undefined ? { cvMediaId } : {}) },
      });
      if (coverMediaId !== undefined) {
        await tx.portfolioMedia.deleteMany({ where: { portfolioId: portfolio.id, entityType: 'profile', entityId: saved.id, mediaRole: 'cover' } });
        if (coverMediaId) await tx.portfolioMedia.create({
          data: { portfolioId: portfolio.id, entityType: 'profile', entityId: saved.id, mediaAssetId: coverMediaId, mediaRole: 'cover' },
        });
      }
      return saved;
    });
    return this.serializeProfile(profile);
  }

  async getPublicProfile() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: {
        title: true,
        profile: { select: { id: true, fullName: true, headline: true, phone: true, contactEmail: true, location: true, bio: true, avatarMediaId: true, cvMediaId: true } },
      },
    });
    if (!portfolio?.profile) throw new NotFoundException('Portfolio chưa được xuất bản.');
    const cover = await this.prisma.portfolioMedia.findFirst({
      where: { portfolio: { is: { slug, isPublished: true } }, entityType: 'profile', entityId: portfolio.profile.id, mediaRole: 'cover' },
      select: { mediaAssetId: true },
    });
    const { id: _id, avatarMediaId, cvMediaId, ...publicProfile } = portfolio.profile;
    return { title: portfolio.title, profile: {
      ...publicProfile,
      avatarUrl: avatarMediaId ? `/media/${avatarMediaId.toString()}/file` : null,
      cvUrl: cvMediaId ? `/media/${cvMediaId.toString()}/file` : null,
      coverUrl: cover ? `/media/${cover.mediaAssetId.toString()}/file` : null,
    } };
  }

  private async assertMedia(mediaAssets: Prisma.TransactionClient['mediaAsset'], portfolioId: bigint, mediaId: bigint | null | undefined, mimeTypes: string[]) {
    if (mediaId == null) return;
    const asset = await mediaAssets.findFirst({ where: { id: mediaId, portfolioId, mimeType: { in: mimeTypes } }, select: { id: true } });
    if (!asset) throw new BadRequestException('The selected media file is not available for this profile field.');
  }

  private parseId(value: string) {
    if (!/^\d{1,20}$/.test(value) || BigInt(value) > 18446744073709551615n) throw new BadRequestException('Invalid media ID.');
    return BigInt(value);
  }

  private clean(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private serializeProfile(profile: Awaited<ReturnType<PrismaService['profile']['findUnique']>>) {
    if (!profile) return null;
    return {
      ...profile,
      id: profile.id.toString(),
      portfolioId: profile.portfolioId.toString(),
      avatarMediaId: profile.avatarMediaId?.toString() ?? null,
      cvMediaId: profile.cvMediaId?.toString() ?? null,
      coverMediaId: null as string | null,
    };
  }
}
