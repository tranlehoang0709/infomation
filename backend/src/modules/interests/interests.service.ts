import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveInterestDto } from './dto/save-interest.dto';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async getAdmin(userId: bigint) {
    const portfolio = await this.portfolioForUser(userId);
    const records = await this.prisma.interest.findMany({ where: { portfolioId: portfolio.id }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    return { interests: await this.withIcons(records, false) };
  }

  async getPublic() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: { id: true, interests: { where: { isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return { interests: await this.withIcons(portfolio.interests, true) };
  }

  async create(userId: bigint, dto: SaveInterestDto) {
    const portfolio = await this.portfolioForUser(userId);
    const data = this.toData(dto);
    await this.assertOwnedImage(portfolio.id, data.iconId);
    const created = await this.prisma.$transaction(async (tx) => {
      const record = await tx.interest.create({ data: { ...data.record, portfolioId: portfolio.id } });
      if (data.iconId !== null) await tx.portfolioMedia.create({ data: this.linkData(portfolio.id, data.iconId, record.id) });
      return record;
    });
    return (await this.withIcons([created], false))[0];
  }

  async update(userId: bigint, idValue: string, dto: SaveInterestDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.portfolioForUser(userId);
    if (!await this.prisma.interest.findFirst({ where: { id, portfolioId: portfolio.id }, select: { id: true } })) throw new NotFoundException('Interest was not found.');
    const data = this.toData(dto);
    await this.assertOwnedImage(portfolio.id, data.iconId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.interest.update({ where: { id }, data: data.record });
      await tx.portfolioMedia.deleteMany({ where: { portfolioId: portfolio.id, entityType: 'interest', entityId: id, mediaRole: 'icon' } });
      if (data.iconId !== null) await tx.portfolioMedia.create({ data: this.linkData(portfolio.id, data.iconId, id) });
      return record;
    });
    return (await this.withIcons([updated], false))[0];
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.portfolioForUser(userId);
    if (!await this.prisma.interest.findFirst({ where: { id, portfolioId: portfolio.id }, select: { id: true } })) throw new NotFoundException('Interest was not found.');
    await this.prisma.$transaction(async (tx) => {
      await tx.portfolioMedia.deleteMany({ where: { portfolioId: portfolio.id, entityType: 'interest', entityId: id } });
      await tx.interest.delete({ where: { id } });
    });
    return { ok: true };
  }

  private async portfolioForUser(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    return portfolio;
  }

  private toData(dto: SaveInterestDto) {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('Interest title is required.');
    return {
      iconId: dto.iconMediaId ? this.parseId(dto.iconMediaId) : null,
      record: { title, description: dto.description?.trim() || null, sortOrder: dto.sortOrder ?? 0, isVisible: dto.isVisible ?? true },
    };
  }

  private async assertOwnedImage(portfolioId: bigint, id: bigint | null) {
    if (id === null) return;
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id, portfolioId, mimeType: { in: IMAGE_TYPES } }, select: { id: true } });
    if (!asset) throw new BadRequestException('The selected icon must be an image in this portfolio media library.');
  }

  private linkData(portfolioId: bigint, mediaAssetId: bigint, entityId: bigint) {
    return { portfolioId, mediaAssetId, entityType: 'interest', entityId, mediaRole: 'icon' };
  }

  private async withIcons<T extends { id: bigint; portfolioId: bigint }>(records: T[], publicView: boolean): Promise<Array<Omit<T, 'id' | 'portfolioId'> & { id: string; portfolioId: string; icon: { id: string; altText: string | null; filePath: string } | null }>> {
    if (!records.length) return [];
    const links = await this.prisma.portfolioMedia.findMany({
      where: { portfolioId: { in: [...new Set(records.map((r) => r.portfolioId))] }, entityType: 'interest', mediaRole: 'icon', entityId: { in: records.map((r) => r.id) } },
      include: { mediaAsset: { select: { id: true, altText: true } } },
    });
    const icons = new Map(links.map((link) => [link.entityId.toString(), link.mediaAsset]));
    return records.map((record) => {
      const icon = icons.get(record.id.toString()) ?? null;
      return { ...record, id: record.id.toString(), portfolioId: record.portfolioId.toString(), icon: icon ? { id: icon.id.toString(), altText: icon.altText, filePath: `/media/${publicView ? '' : 'admin/'}${icon.id.toString()}/file` } : null };
    });
  }

  private parseId(value: string) {
    if (!/^\d{1,20}$/.test(value)) throw new BadRequestException('Invalid record ID.');
    const parsed = BigInt(value);
    if (parsed > 18446744073709551615n) throw new BadRequestException('Invalid record ID.');
    return parsed;
  }
}
