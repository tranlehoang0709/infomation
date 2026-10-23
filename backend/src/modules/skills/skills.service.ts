import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveSkillDto } from './dto/save-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async getAdmin(userId: bigint) {
    const portfolio = await this.portfolioForUser(userId);
    const skills = await this.prisma.skill.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
    return { skills: skills.map((skill) => this.serialize(skill)) };
  }

  async getPublic() {
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { slug, isPublished: true },
      select: {
        skills: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio has not been published.');
    return { skills: portfolio.skills.map((skill) => this.serialize(skill)) };
  }

  async create(userId: bigint, dto: SaveSkillDto) {
    const portfolio = await this.portfolioForUser(userId);
    const created = await this.prisma.skill.create({ data: { ...this.toData(dto), portfolioId: portfolio.id } });
    return this.serialize(created);
  }

  async update(userId: bigint, idValue: string, dto: SaveSkillDto) {
    const id = this.parseId(idValue);
    const portfolio = await this.portfolioForUser(userId);
    const existing = await this.prisma.skill.findFirst({ where: { id, portfolioId: portfolio.id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Skill was not found.');
    const updated = await this.prisma.skill.update({ where: { id }, data: this.toData(dto) });
    return this.serialize(updated);
  }

  async remove(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.portfolioForUser(userId);
    const existing = await this.prisma.skill.findFirst({ where: { id, portfolioId: portfolio.id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Skill was not found.');
    await this.prisma.skill.delete({ where: { id } });
    return { ok: true };
  }

  private async portfolioForUser(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    return portfolio;
  }

  private toData(dto: SaveSkillDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Skill name is required.');
    if (dto.proficiency !== undefined && dto.proficiency !== null && (!Number.isInteger(dto.proficiency) || dto.proficiency < 0 || dto.proficiency > 100)) {
      throw new BadRequestException('Skill proficiency must be between 0 and 100.');
    }
    return {
      name,
      category: this.clean(dto.category),
      proficiency: dto.proficiency ?? null,
      description: this.clean(dto.description),
      sortOrder: dto.sortOrder ?? 0,
      isVisible: dto.isVisible ?? true,
    };
  }

  private serialize(row: {
    id: bigint; portfolioId: bigint; name: string; category: string | null; proficiency: number | null;
    description: string | null; sortOrder: number; isVisible: boolean; createdAt: Date; updatedAt: Date;
  }) {
    return {
      ...row,
      id: row.id.toString(),
      portfolioId: row.portfolioId.toString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
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
