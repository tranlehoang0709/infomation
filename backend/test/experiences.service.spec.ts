import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { ExperiencesService } from '../src/modules/experiences/experiences.service';
import { SaveExperienceDto } from '../src/modules/experiences/dto/save-experience.dto';
import { PrismaService } from '../src/prisma/prisma.service';

const valid: SaveExperienceDto = {
  companyName: 'Example Co.',
  position: 'Engineer',
  startDate: '2022-01-01',
  endDate: null,
  isCurrent: true,
  achievements: ['Built a portfolio'],
  sortOrder: 2,
  isVisible: true,
};

function buildService(overrides: Record<string, unknown> = {}) {
  const now = new Date('2025-01-01T00:00:00.000Z');
  const experience = {
    id: 7n,
    portfolioId: 4n,
    companyName: valid.companyName,
    position: valid.position,
    employmentType: null,
    location: null,
    startDate: now,
    endDate: null,
    isCurrent: true,
    description: null,
    achievements: ['Built a portfolio'],
    sortOrder: 2,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  };
  const tx = {
    experience: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ ...experience, ...data }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({ ...experience, ...data }),
      delete: async () => experience,
    },
    portfolioMedia: {
      create: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const prisma = {
    portfolio: {
      findUnique: async () => ({ id: 4n }),
      findFirst: async (args: unknown) => {
        (prisma as unknown as { lastPublicQuery?: unknown }).lastPublicQuery = args;
        return { id: 4n, experiences: [experience] };
      },
    },
    experience: {
      findMany: async () => [experience],
      findFirst: async () => experience,
    },
    mediaAsset: { findFirst: async () => null },
    portfolioMedia: { findMany: async () => [] },
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
    ...overrides,
  };
  const service = new ExperiencesService(
    prisma as unknown as PrismaService,
    new ConfigService({ portfolioSlug: 'test-portfolio' }),
  );
  return { service, prisma };
}

test('creates an experience with trimmed required fields and achievements', async () => {
  const { service } = buildService();
  const created = await service.create(10n, { ...valid, companyName: '  Example Co.  ', position: ' Engineer ' });
  assert.equal(created.companyName, 'Example Co.');
  assert.deepEqual(created.achievements, ['Built a portfolio']);
  assert.equal(created.isCurrent, true);
});

test('rejects empty required fields and reversed employment dates', async () => {
  const { service } = buildService();
  await assert.rejects(() => service.create(10n, { ...valid, companyName: '  ' }), BadRequestException);
  await assert.rejects(() => service.create(10n, {
    ...valid,
    isCurrent: false,
    startDate: '2023-01-01',
    endDate: '2022-12-31',
  }), BadRequestException);
});

test('validates request field lengths, dates, and achievement types', async () => {
  const dto = Object.assign(new SaveExperienceDto(), { ...valid, companyName: 'x'.repeat(256), startDate: 'not-a-date', achievements: [42] });
  const errors = await validate(dto);
  assert.ok(errors.some(({ property }) => property === 'companyName'));
  assert.ok(errors.some(({ property }) => property === 'startDate'));
  assert.ok(errors.some(({ property }) => property === 'achievements'));
});

test('updates an existing experience and returns its persisted fields', async () => {
  const { service } = buildService();
  const updated = await service.update(10n, '7', { ...valid, companyName: 'Updated Co.', isCurrent: false, endDate: '2024-01-01' });
  assert.equal(updated.companyName, 'Updated Co.');
  assert.equal(updated.isCurrent, false);
  assert.equal(updated.endDate?.toISOString(), '2024-01-01T00:00:00.000Z');
});

test('public list query filters unpublished portfolios and hidden experiences', async () => {
  const { service, prisma } = buildService();
  const result = await service.getPublicExperiences();
  const query = (prisma as unknown as { lastPublicQuery: { where: unknown; select: { experiences: { where: unknown } } } }).lastPublicQuery;
  assert.deepEqual(query.where, { slug: 'test-portfolio', isPublished: true });
  assert.deepEqual(query.select.experiences.where, { isVisible: true });
  assert.equal(result.experiences.length, 1);
});

test('delete removes only the owner-scoped experience and its links', async () => {
  const { service } = buildService();
  assert.deepEqual(await service.remove(10n, '7'), { ok: true });
  await assert.rejects(() => service.remove(10n, 'not-an-id'), BadRequestException);
});
