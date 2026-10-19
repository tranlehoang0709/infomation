import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MediaService } from '../src/modules/media/media.service';
import { MediaController } from '../src/modules/media/media.controller';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('stores signature-verified media for the authenticated portfolio', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-media-test-'));
  try {
    const prisma = {
      portfolio: { findUnique: async () => ({ id: 4n }) },
      mediaAsset: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 9n, ...data }) },
    };
    const service = new MediaService(
      prisma as unknown as PrismaService,
      new ConfigService({ mediaStorageDirectory: directory, portfolioSlug: 'test-portfolio' }),
    );
    const result = await service.upload(10n, {
      originalname: '../../..\\logo.png', mimetype: 'image/png', size: pngHeader.length, buffer: pngHeader,
    });
    assert.equal(result.id, '9');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.originalName, 'logo.png');
    assert.equal(result.adminFilePath, '/media/admin/9/file');
    const files = await import('node:fs/promises').then(({ readdir }) => readdir(join(directory, 'portfolio-4')));
    assert.equal(files.length, 1);
    assert.deepEqual(await readFile(join(directory, 'portfolio-4', files[0])), pngHeader);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('lists only the owner library and marks linked media as undeletable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-media-list-'));
  try {
    await import('node:fs/promises').then(({ mkdir }) => mkdir(join(directory, 'portfolio-4'), { recursive: true }));
    await writeFile(join(directory, 'portfolio-4', 'stored.png'), pngHeader);
    const now = new Date('2025-01-01T00:00:00Z');
    const service = new MediaService({
      portfolio: { findUnique: async () => ({ id: 4n }) },
      mediaAsset: { findMany: async () => [{ id: 9n, originalName: 'photo.png', mimeType: 'image/png', fileSize: 8n, altText: null, createdAt: now, storagePath: 'portfolio-4/stored.png', portfolioLinks: [{ entityType: 'project', entityId: 2n, mediaRole: 'thumbnail' }] }] },
      profile: { findMany: async () => [] },
    } as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: directory }));
    const result = await service.list(10n);
    assert.equal(result.media[0].storageAvailable, true);
    assert.equal(result.media[0].canDelete, false);
    assert.deepEqual(result.media[0].usedBy, ['project #2 (thumbnail)']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('rejects mismatched MIME type and file extension even when bytes look valid', async () => {
  const service = new MediaService({} as PrismaService, new ConfigService({ mediaStorageDirectory: tmpdir() }));
  await assert.rejects(() => service.upload(1n, { originalname: 'photo.jpg', mimetype: 'image/png', size: pngHeader.length, buffer: pngHeader }), BadRequestException);
  await assert.rejects(() => service.upload(1n, { originalname: 'photo.exe', mimetype: 'image/png', size: pngHeader.length, buffer: pngHeader }), BadRequestException);
});

test('rejects invalid file signatures and hidden/unlinked public logo access', async () => {
  const invalidService = new MediaService(
    {} as PrismaService,
    new ConfigService({ mediaStorageDirectory: tmpdir(), portfolioSlug: 'test-portfolio' }),
  );
  await assert.rejects(() => invalidService.upload(10n, {
    originalname: 'logo.png', mimetype: 'image/png', size: 4, buffer: Buffer.from('nope'),
  }), BadRequestException);

  const hiddenService = new MediaService({
    portfolioMedia: { findMany: async () => [{ portfolioId: 4n, entityId: 7n, entityType: 'experience', mediaRole: 'company_logo' }] },
    experience: { findFirst: async () => null },
    profile: { findFirst: async () => null },
  } as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: tmpdir(), portfolioSlug: 'test-portfolio' }));
  await assert.rejects(() => hiddenService.getPublicFile('9'), NotFoundException);
});

test('deletes only unreferenced files and removes both the database record and storage file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-media-delete-'));
  const filePath = join(directory, 'asset.png');
  await writeFile(filePath, pngHeader);
  let recordDeleted = false;
  const tx = {
    mediaAsset: {
      findFirst: async () => ({ id: 9n, storagePath: 'asset.png' }),
      delete: async () => { recordDeleted = true; return {}; },
    },
    portfolioMedia: { count: async () => 0 },
    profile: { count: async () => 0 },
  };
  const prisma = {
    portfolio: { findUnique: async () => ({ id: 4n }) },
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
  };
  try {
    const service = new MediaService(prisma as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: directory }));
    assert.deepEqual(await service.delete(10n, '9'), { deleted: true, fileMissing: false });
    assert.equal(recordDeleted, true);
    await assert.rejects(() => access(filePath));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('refuses to delete files referenced by portfolio content', async () => {
  const tx = {
    mediaAsset: { findFirst: async () => ({ id: 9n, storagePath: 'missing.png' }), delete: async () => assert.fail('must not delete a referenced asset') },
    portfolioMedia: { count: async () => 1 },
    profile: { count: async () => 0 },
  };
  const prisma = { portfolio: { findUnique: async () => ({ id: 4n }) }, $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) };
  const service = new MediaService(prisma as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: tmpdir() }));
  await assert.rejects(() => service.delete(10n, '9'), ConflictException);
});

test('cleans the media row when its storage file is already missing', async () => {
  let deleted = false;
  const tx = {
    mediaAsset: { findFirst: async () => ({ id: 9n, portfolioId: 4n, originalName: 'gone.png', storedName: 'gone.png', storagePath: 'gone.png', mimeType: 'image/png', fileSize: 8n, altText: null, createdAt: new Date() }), delete: async () => { deleted = true; return {}; } },
    portfolioMedia: { count: async () => 0 }, profile: { count: async () => 0 },
  };
  const service = new MediaService({ portfolio: { findUnique: async () => ({ id: 4n }) }, $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) } as unknown as PrismaService,
    new ConfigService({ mediaStorageDirectory: tmpdir() }));
  assert.deepEqual(await service.delete(10n, '9'), { deleted: true, fileMissing: true });
  assert.equal(deleted, true);
});

test('serves a published profile avatar publicly while keeping missing or unrelated assets private', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-public-media-'));
  try {
    await writeFile(join(directory, 'avatar.png'), pngHeader);
    const service = new MediaService({
      portfolioMedia: { findMany: async () => [] },
      profile: { findFirst: async () => ({ portfolioId: 4n, avatarMediaId: 9n, cvMediaId: null }) },
      mediaAsset: { findFirst: async () => ({ storagePath: 'avatar.png', mimeType: 'image/png' }) },
    } as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: directory, portfolioSlug: 'test-portfolio' }));
    const result = await service.getPublicFile('9');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.download, false);
    assert.deepEqual(await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []; result.stream.on('data', (chunk) => chunks.push(Buffer.from(chunk))); result.stream.on('end', () => resolve(Buffer.concat(chunks))); result.stream.on('error', reject);
    }), pngHeader);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('serves linked files only for visible published certificates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-certificate-file-'));
  const pdf = Buffer.from('%PDF-1.7');
  try {
    await writeFile(join(directory, 'certificate.pdf'), pdf);
    const service = new MediaService({
      portfolioMedia: { findMany: async () => [{ portfolioId: 4n, entityId: 3n, entityType: 'certificate', mediaRole: 'certificate_file' }] },
      certificate: { findFirst: async () => ({ id: 3n }) },
      profile: { findFirst: async () => null },
      mediaAsset: { findFirst: async () => ({ storagePath: 'certificate.pdf', mimeType: 'application/pdf' }) },
    } as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: directory, portfolioSlug: 'test-portfolio' }));
    const file = await service.getPublicFile('12');
    assert.equal(file.mimeType, 'application/pdf');
    assert.equal(file.download, true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('serves interest icons only when the linked interest is visible and portfolio is published', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-interest-icon-'));
  try {
    await writeFile(join(directory, 'interest.png'), pngHeader);
    const service = new MediaService({
      portfolioMedia: { findMany: async () => [{ portfolioId: 4n, entityId: 8n, entityType: 'interest', mediaRole: 'icon' }] },
      interest: { findFirst: async (args: unknown) => {
        assert.deepEqual(args, { where: { id: 8n, portfolioId: 4n, isVisible: true, portfolio: { is: { slug: 'test-portfolio', isPublished: true } } }, select: { id: true } });
        return { id: 8n };
      } },
      profile: { findFirst: async () => null },
      mediaAsset: { findFirst: async () => ({ storagePath: 'interest.png', mimeType: 'image/png' }) },
    } as unknown as PrismaService, new ConfigService({ mediaStorageDirectory: directory, portfolioSlug: 'test-portfolio' }));
    const file = await service.getPublicFile('12');
    assert.equal(file.mimeType, 'image/png');
    assert.equal(file.download, false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('protects media listing, upload, deletion, and private file reads with the admin guard', () => {
  for (const method of ['list', 'upload', 'remove', 'getAdminFile'] as const) {
    const guards = Reflect.getMetadata(GUARDS_METADATA, MediaController.prototype[method]);
    assert.deepEqual(guards, [AuthGuard], `${method} must require AuthGuard`);
  }
  assert.equal(Reflect.getMetadata(GUARDS_METADATA, MediaController.prototype.getPublicFile), undefined);
});
