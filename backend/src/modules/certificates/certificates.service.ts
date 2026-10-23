import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveCertificateDto } from './dto/save-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getAdminCertificates(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const rows = await this.prisma.certificate.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return { certificates: rows.map((row) => this.serialize(row)) };
  }

  async getPublicCertificates() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        certificates: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { issueDate: 'desc' }, { id: 'asc' }],
        },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return { certificates: portfolio.certificates.map((row) => this.serialize(row)) };
  }

  async create(userId: bigint, dto: SaveCertificateDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const data = this.toData(dto);
    const created = await this.prisma.certificate.create({
      data: { ...data, portfolioId: portfolio.id },
    });
    return this.serialize(created);
  }

  async update(userId: bigint, idValue: string, dto: SaveCertificateDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const existing = await this.prisma.certificate.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Certificate was not found.');

    const updated = await this.prisma.certificate.update({ where: { id }, data: this.toData(dto) });
    return this.serialize(updated);
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const existing = await this.prisma.certificate.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!existing) throw new NotFoundException('Certificate was not found.');

    await this.prisma.certificate.delete({ where: { id } });
    return { ok: true };
  }

  private toData(dto: SaveCertificateDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Certificate name is required.');

    const issueDate = this.toDate(dto.issueDate);
    const expiryDate = this.toDate(dto.expiryDate);

    if (issueDate && expiryDate && expiryDate < issueDate) {
      throw new BadRequestException('Expiry date must be on or after the issue date.');
    }

    return {
      name,
      issuer: this.clean(dto.issuer),
      credentialCode: this.clean(dto.credentialCode),
      issueDate,
      expiryDate,
      credentialUrl: this.clean(dto.credentialUrl),
      description: this.clean(dto.description),
      sortOrder: dto.sortOrder ?? 0,
      isVisible: dto.isVisible ?? true,
    };
  }

  private serialize(row: {
    id: bigint;
    portfolioId: bigint;
    name: string;
    issuer: string | null;
    credentialCode: string | null;
    issueDate: Date | null;
    expiryDate: Date | null;
    credentialUrl: string | null;
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
      issueDate: row.issueDate ? row.issueDate.toISOString() : null,
      expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
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
