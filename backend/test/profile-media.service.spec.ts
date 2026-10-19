import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { ProfileService } from '../src/modules/profile/profile.service';
import { PrismaService } from '../src/prisma/prisma.service';

test('saves profile avatar, CV, and cover references through existing media tables', async () => {
  const now = new Date('2025-01-01T00:00:00.000Z');
  const savedData: Record<string, unknown>[] = [];
  const coverLinks: Record<string, unknown>[] = [];
  const tx = {
    mediaAsset: { findFirst: async ({ where }: { where: { id: bigint } }) => ({ id: where.id }) },
    profile: { upsert: async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
      savedData.push(create, update);
      return { id: 5n, portfolioId: 4n, ...create, createdAt: now, updatedAt: now };
    } },
    portfolioMedia: {
      deleteMany: async () => ({ count: 0 }),
      create: async ({ data }: { data: Record<string, unknown> }) => { coverLinks.push(data); return data; },
    },
  };
  const prisma = {
    portfolio: { findUnique: async () => ({ id: 4n }) },
    mediaAsset: { findFirst: async ({ where }: { where: { id: bigint } }) => ({ id: where.id }) },
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
  };
  const service = new ProfileService(prisma as unknown as PrismaService, new ConfigService({ portfolioSlug: 'test-portfolio' }));
  const result = await service.update(9n, {
    fullName: 'Portfolio Owner', avatarMediaId: '51', cvMediaId: '52', coverMediaId: '53',
  });
  assert.equal(result?.avatarMediaId, '51');
  assert.equal(result?.cvMediaId, '52');
  assert.deepEqual(coverLinks[0], {
    portfolioId: 4n, entityType: 'profile', entityId: 5n, mediaAssetId: 53n, mediaRole: 'cover',
  });
});

test('omitting media IDs preserves existing profile media references', async () => {
  let updateData: Record<string, unknown> | null = null;
  const tx = {
    mediaAsset: { findFirst: async () => ({ id: 51n }) },
    profile: { upsert: async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
      updateData = update;
      return { id: 5n, portfolioId: 4n, ...create, avatarMediaId: 51n, cvMediaId: 52n, createdAt: new Date(), updatedAt: new Date() };
    } },
    portfolioMedia: { deleteMany: async () => ({ count: 0 }), create: async () => ({}) },
  };
  const prisma = { portfolio: { findUnique: async () => ({ id: 4n }) }, $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) };
  const service = new ProfileService(prisma as unknown as PrismaService, new ConfigService({ portfolioSlug: 'test-portfolio' }));
  await service.update(9n, { fullName: 'Portfolio Owner' });
  assert.equal(Object.hasOwn(updateData ?? {}, 'avatarMediaId'), false);
  assert.equal(Object.hasOwn(updateData ?? {}, 'cvMediaId'), false);
});
