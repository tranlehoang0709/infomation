import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { InterestsController } from '../src/modules/interests/interests.controller';
import { InterestsService } from '../src/modules/interests/interests.service';
import { SaveInterestDto } from '../src/modules/interests/dto/save-interest.dto';
import { PrismaService } from '../src/prisma/prisma.service';

const date = new Date('2025-01-01T00:00:00.000Z');
const row = { id: 8n, portfolioId: 4n, title: 'Photography', description: 'Nature', sortOrder: 1, isVisible: true, createdAt: date, updatedAt: date };

function setup() {
  const calls: { interestQuery?: unknown; linkQuery?: unknown; linkCreated?: unknown } = {};
  const tx = {
    interest: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }),
      delete: async () => row,
    },
    portfolioMedia: {
      create: async ({ data }: { data: unknown }) => { calls.linkCreated = data; return {}; },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const prisma = {
    portfolio: {
      findUnique: async () => ({ id: 4n }),
      findFirst: async (args: unknown) => { calls.interestQuery = args; return { id: 4n, interests: [row] }; },
    },
    interest: {
      findMany: async () => [row],
      findFirst: async () => row,
    },
    mediaAsset: { findFirst: async () => ({ id: 12n }) },
    portfolioMedia: {
      findMany: async (args: unknown) => {
        calls.linkQuery = args;
        return [{ entityId: 8n, mediaAsset: { id: 12n, altText: 'Camera' } }];
      },
    },
    $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
  };
  const service = new InterestsService(prisma as unknown as PrismaService, new ConfigService({ portfolioSlug: 'owner-site' }));
  return { service, prisma, calls };
}

test('validates title, order, visibility and image ID input', async () => {
  const invalid = Object.assign(new SaveInterestDto(), { title: '', sortOrder: -1, isVisible: 'yes', iconMediaId: '../12' });
  const errors = await validate(invalid);
  assert.deepEqual(new Set(errors.map((error) => error.property)), new Set(['title', 'sortOrder', 'isVisible', 'iconMediaId']));
});

test('creates a trimmed interest and links an owned icon through existing media relation', async () => {
  const { service, calls } = setup();
  const created = await service.create(10n, { title: '  Photography ', description: '  Nature  ', iconMediaId: '12', sortOrder: 2 });
  assert.equal(created.title, 'Photography');
  assert.equal(created.description, 'Nature');
  assert.deepEqual(calls.linkCreated, { portfolioId: 4n, mediaAssetId: 12n, entityType: 'interest', entityId: 8n, mediaRole: 'icon' });
});

test('rejects media that is not an owned image', async () => {
  const { service, prisma } = setup();
  (prisma.mediaAsset as { findFirst: () => Promise<unknown> }).findFirst = async () => null;
  await assert.rejects(service.create(10n, { title: 'Photo', iconMediaId: '12' }), BadRequestException);
});

test('updates an interest and removes its old media relation before attaching replacement', async () => {
  const { service, calls } = setup();
  const updated = await service.update(10n, '8', { title: 'Updated', iconMediaId: null, isVisible: false });
  assert.equal(updated.title, 'Updated');
  assert.equal(updated.isVisible, false);
  assert.equal(calls.linkCreated, undefined);
});

test('deletes the owner scoped interest and associated links transactionally', async () => {
  const { service } = setup();
  assert.deepEqual(await service.remove(10n, '8'), { ok: true });
});

test('rejects a whitespace-only title after trimming', async () => {
  const { service } = setup();
  await assert.rejects(service.create(10n, { title: '   ' }), BadRequestException);
});

test('public list is portfolio scoped, published and ordered to visible records only', async () => {
  const { service, calls } = setup();
  const result = await service.getPublic();
  assert.equal(result.interests[0].icon?.filePath, '/media/12/file');
  assert.deepEqual(calls.interestQuery, {
    where: { slug: 'owner-site', isPublished: true },
    select: { id: true, interests: { where: { isVisible: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
  });
});

test('admin list keeps hidden records and uses protected media path', async () => {
  const { service } = setup();
  const result = await service.getAdmin(10n);
  assert.equal(result.interests[0].icon?.filePath, '/media/admin/12/file');
});

test('rejects invalid IDs and returns not found when owner does not have a portfolio', async () => {
  const { service, prisma } = setup();
  await assert.rejects(service.remove(10n, 'x'), BadRequestException);
  (prisma.portfolio as { findUnique: () => Promise<unknown> }).findUnique = async () => null;
  await assert.rejects(service.getAdmin(10n), NotFoundException);
});

test('all admin CRUD endpoints require the backend AuthGuard', () => {
  for (const method of ['getAdmin', 'create', 'update', 'remove'] as const) {
    assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, InterestsController.prototype[method]), [AuthGuard]);
  }
  assert.equal(Reflect.getMetadata(GUARDS_METADATA, InterestsController.prototype.getPublic), undefined);
});
