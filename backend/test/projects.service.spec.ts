import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { ProjectsService } from '../src/modules/projects/projects.service';
import { SaveProjectDto } from '../src/modules/projects/dto/save-project.dto';
import { PrismaService } from '../src/prisma/prisma.service';

const input: SaveProjectDto = {
  title: 'Portfolio Project', shortDescription: 'A short summary', technologies: ['Next.js', 'MySQL'],
  startDate: '2024-01-01', endDate: '2024-08-01', sortOrder: 3, isFeatured: true, isVisible: true,
};

function setup() {
  const now = new Date('2025-01-01T00:00:00.000Z');
  const row = {
    id: 7n, portfolioId: 4n, name: input.title, slug: 'portfolio-project', summary: input.shortDescription,
    description: null, role: null, technologies: ['Next.js', 'MySQL'], githubUrl: null, demoUrl: null,
    startDate: new Date('2024-01-01T00:00:00.000Z'), endDate: new Date('2024-08-01T00:00:00.000Z'),
    isFeatured: true, sortOrder: 3, isVisible: true, createdAt: now, updatedAt: now,
  };
  const calls: Record<string, unknown> = {};
  const tx = {
    project: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }),
      delete: async () => row,
    },
    portfolioMedia: { create: async () => ({}), createMany: async () => ({ count: 0 }), deleteMany: async () => ({ count: 0 }) },
  };
  const prisma = {
    portfolio: { findUnique: async () => ({ id: 4n }), findFirst: async () => ({ id: 4n }) },
    project: {
      findMany: async (query: unknown) => { calls.adminListQuery = query; return [row]; },
      findFirst: async (query: unknown) => {
        calls.projectQuery = query;
        const where = (query as { where?: { slug?: string } }).where;
        return where?.slug ? null : row;
      },
    },
    mediaAsset: { findMany: async () => [] },
    portfolioMedia: { findMany: async () => [] },
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
  };
  const service = new ProjectsService(
    prisma as unknown as PrismaService,
    new ConfigService({ portfolioSlug: 'test-portfolio' }),
  );
  return { service, calls };
}

test('creates project with generated slug, normalized fields, and persisted visibility flags', async () => {
  const { service } = setup();
  const saved = await service.create(12n, { ...input, title: '  Portfolio Project  ' });
  assert.equal(saved.name, 'Portfolio Project');
  assert.equal(saved.slug, 'portfolio-project');
  assert.deepEqual(saved.technologies, ['Next.js', 'MySQL']);
  assert.equal(saved.isFeatured, true);
});

test('updates an owner project while preserving its stable slug when no replacement is supplied', async () => {
  const { service } = setup();
  const saved = await service.update(12n, '7', { ...input, title: 'Renamed portfolio' });
  assert.equal(saved.name, 'Renamed portfolio');
  assert.equal(saved.slug, 'portfolio-project');
});

test('rejects reversed dates and invalid project IDs', async () => {
  const { service } = setup();
  await assert.rejects(() => service.create(12n, { ...input, startDate: '2024-10-01', endDate: '2024-02-01' }), BadRequestException);
  await assert.rejects(() => service.update(12n, 'not-an-id', input), BadRequestException);
});

test('rejects thumbnail or gallery media that is not owned by the portfolio', async () => {
  const { service } = setup();
  await assert.rejects(() => service.create(12n, { ...input, thumbnailMediaId: '55' }), /Selected project images/);
  await assert.rejects(() => service.create(12n, { ...input, galleryMediaIds: ['56'] }), /Selected project images/);
});

test('validates slug, URL, date, and bounded list inputs', async () => {
  const dto = Object.assign(new SaveProjectDto(), { ...input, slug: 'Not A Slug', githubUrl: 'javascript:alert(1)', technologies: Array(41).fill('x') });
  const errors = await validate(dto);
  assert.ok(errors.some(({ property }) => property === 'slug'));
  assert.ok(errors.some(({ property }) => property === 'githubUrl'));
  assert.ok(errors.some(({ property }) => property === 'technologies'));
});

test('public records are ordered and detail queries are restricted to visible portfolio projects', async () => {
  const { service, calls } = setup();
  const listed = await service.getPublicProjects();
  assert.equal(listed.projects.length, 1);
  const listQuery = calls.adminListQuery as { where: unknown; orderBy: unknown };
  assert.deepEqual(listQuery.where, { portfolioId: 4n, isVisible: true });
  assert.deepEqual(listQuery.orderBy, [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { startDate: 'desc' }, { id: 'asc' }]);
  await service.getPublicProject('portfolio-project');
  const detailQuery = calls.projectQuery as { where: { portfolioId: bigint; isVisible: boolean } };
  assert.equal(detailQuery.where.portfolioId, 4n);
  assert.equal(detailQuery.where.isVisible, true);
});

test('uses stable ID detail lookup for legacy rows without slugs and deletes owner scoped media links', async () => {
  const { service, calls } = setup();
  await service.getPublicProject('7');
  const query = calls.projectQuery as { where: { OR: Array<Record<string, unknown>> } };
  assert.deepEqual(query.where.OR, [{ slug: '7' }, { id: 7n, slug: null }]);
  assert.deepEqual(await service.remove(12n, '7'), { ok: true });
});
