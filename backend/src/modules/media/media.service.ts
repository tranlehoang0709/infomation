import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createReadStream } from 'node:fs';
import { access, mkdir, realpath, rm, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PUBLIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FILE_FORMATS = {
  'image/jpeg': { extension: '.jpg', extensions: ['.jpg', '.jpeg'], check: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  'image/png': { extension: '.png', extensions: ['.png'], check: (data: Buffer) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/gif': { extension: '.gif', extensions: ['.gif'], check: (data: Buffer) => data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString('ascii')) },
  'image/webp': { extension: '.webp', extensions: ['.webp'], check: (data: Buffer) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' },
  'application/pdf': { extension: '.pdf', extensions: ['.pdf'], check: (data: Buffer) => data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-' },
} as const;

@Injectable()
export class MediaService {
  private readonly storageRoot: string;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    const configured = config.getOrThrow<string>('mediaStorageDirectory');
    this.storageRoot = resolve(process.cwd(), configured);
  }

  async upload(userId: bigint, file: UploadedMediaFile) {
    if (!file.buffer?.length || file.size < 1) throw new BadRequestException('The uploaded file is empty.');
    if (file.buffer.length !== file.size) throw new BadRequestException('The uploaded file size is invalid.');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Files must be 10 MB or smaller.');
    const format = Object.entries(FILE_FORMATS).find(([, value]) => value.check(file.buffer));
    if (!format) throw new BadRequestException('Upload a valid JPEG, PNG, GIF, WebP, or PDF file.');
    const [mimeType, metadata] = format;
    const originalExtension = extname(file.originalname).toLowerCase();
    if (file.mimetype !== mimeType || !metadata.extensions.includes(originalExtension as never)) {
      throw new BadRequestException('File extension, MIME type, and file contents must match.');
    }

    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const storedName = `${randomUUID()}${metadata.extension}`;
    const relativePath = `portfolio-${portfolio.id.toString()}/${storedName}`;
    const absolutePath = this.resolveStoragePath(relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await this.assertWithinStorageRoot(dirname(absolutePath));
    await writeFile(absolutePath, file.buffer, { flag: 'wx' });

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          portfolioId: portfolio.id,
          originalName: this.safeOriginalName(file.originalname, extname(storedName)),
          storedName,
          storagePath: relativePath,
          mimeType,
          fileSize: BigInt(file.size),
        },
        select: { id: true, originalName: true, mimeType: true, fileSize: true },
      });
      return {
        ...asset,
        id: asset.id.toString(),
        fileSize: asset.fileSize.toString(),
        adminFilePath: `/media/admin/${asset.id.toString()}/file`,
      };
    } catch (error) {
      try { await rm(absolutePath, { force: true }); }
      catch { throw new InternalServerErrorException('Media metadata could not be saved and the uploaded file could not be cleaned up. Check the storage directory.'); }
      throw error;
    }
  }

  async list(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    const assets = await this.prisma.mediaAsset.findMany({
      where: { portfolioId: portfolio.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true, originalName: true, mimeType: true, fileSize: true, altText: true, createdAt: true, storagePath: true,
        portfolioLinks: { select: { entityType: true, entityId: true, mediaRole: true } },
      },
    });
    if (!assets.length) return { media: [] };
    const ids = assets.map((asset) => asset.id);
    const profiles = await this.prisma.profile.findMany({
      where: { portfolioId: portfolio.id, OR: [{ avatarMediaId: { in: ids } }, { cvMediaId: { in: ids } }] },
      select: { avatarMediaId: true, cvMediaId: true },
    });
    const directReferences = new Map<string, string[]>();
    for (const profile of profiles) {
      if (profile.avatarMediaId) directReferences.set(profile.avatarMediaId.toString(), [...(directReferences.get(profile.avatarMediaId.toString()) ?? []), 'profile avatar']);
      if (profile.cvMediaId) directReferences.set(profile.cvMediaId.toString(), [...(directReferences.get(profile.cvMediaId.toString()) ?? []), 'profile CV']);
    }
    const media = await Promise.all(assets.map(async (asset) => {
      const links = asset.portfolioLinks.map((link) => `${link.entityType} #${link.entityId.toString()} (${link.mediaRole})`);
      const usedBy = [...links, ...(directReferences.get(asset.id.toString()) ?? [])];
      let storageAvailable = true;
      try { await this.existingPath(asset.storagePath); }
      catch (error) {
        if (error instanceof NotFoundException) storageAvailable = false;
        else if (error instanceof Error && 'code' in error && error.code === 'ENOENT') storageAvailable = false;
        else throw error;
      }
      return {
        id: asset.id.toString(), originalName: asset.originalName, mimeType: asset.mimeType,
        fileSize: asset.fileSize.toString(), altText: asset.altText, createdAt: asset.createdAt.toISOString(),
        adminFilePath: `/media/admin/${asset.id.toString()}/file`, usedBy, canDelete: usedBy.length === 0, storageAvailable,
      };
    }));
    return { media };
  }

  async delete(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    let absolutePath = '';
    let fileAvailable = false;
    let recordToRestore: Prisma.MediaAssetGetPayload<object> | null = null;
    await this.prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.findFirst({ where: { id, portfolioId: portfolio.id } });
      if (!asset) throw new NotFoundException('Media file was not found.');
      const [linkCount, profileCount] = await Promise.all([
        tx.portfolioMedia.count({ where: { portfolioId: portfolio.id, mediaAssetId: id } }),
        tx.profile.count({ where: { portfolioId: portfolio.id, OR: [{ avatarMediaId: id }, { cvMediaId: id }] } }),
      ]);
      if (linkCount || profileCount) throw new ConflictException('This file is in use. Unlink it from every portfolio section before deleting it.');
      absolutePath = this.resolveStoragePath(asset.storagePath);
      try { await this.existingPath(asset.storagePath); fileAvailable = true; }
      catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }
      recordToRestore = asset;
      await tx.mediaAsset.delete({ where: { id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!fileAvailable) return { deleted: true, fileMissing: true };
    try { await unlink(absolutePath); }
    catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { deleted: true, fileMissing: true };
      if (recordToRestore) {
        try { await this.prisma.mediaAsset.create({ data: recordToRestore }); }
        catch { throw new InternalServerErrorException('Storage deletion failed, and media metadata could not be restored. Check the database and storage directory.'); }
      }
      throw new InternalServerErrorException('File could not be removed; the media record was restored. Check the storage directory.');
    }
    return { deleted: true, fileMissing: false };
  }

  async getAdminFile(userId: bigint, idValue: string) {
    const id = this.parseId(idValue);
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, portfolioId: portfolio.id },
      select: { storagePath: true, mimeType: true },
    });
    if (!asset) throw new NotFoundException('Media file was not found.');
    return { stream: createReadStream(await this.existingPath(asset.storagePath)), mimeType: asset.mimeType };
  }

  async getPublicFile(idValue: string) {
    const id = this.parseId(idValue);
    const slug = this.config.getOrThrow<string>('portfolioSlug');
    const links = await this.prisma.portfolioMedia.findMany({
      where: {
        mediaAssetId: id,
        OR: [
          { entityType: 'experience', mediaRole: 'company_logo' },
          { entityType: 'project', mediaRole: { in: ['thumbnail', 'gallery'] } },
          { entityType: 'certificate', mediaRole: { in: ['certificate_image', 'certificate_file', 'certificate'] } },
          { entityType: 'profile', mediaRole: 'cover' },
          { entityType: 'interest', mediaRole: 'icon' },
        ],
        portfolio: { is: { slug, isPublished: true } },
      },
      select: { portfolioId: true, entityId: true, entityType: true, mediaRole: true },
    });
    let publiclyLinked = false;
    let allowPdf = false;
    let authorizedPortfolioId: bigint | null = null;
    for (const link of links) {
      if (link.entityType === 'experience' && link.mediaRole === 'company_logo') {
        const experience = await this.prisma.experience.findFirst({
          where: { id: link.entityId, portfolioId: link.portfolioId, isVisible: true, portfolio: { is: { isPublished: true } } }, select: { id: true },
        });
        if (experience) { publiclyLinked = true; authorizedPortfolioId = link.portfolioId; }
      } else if (link.entityType === 'project' && ['thumbnail', 'gallery'].includes(link.mediaRole)) {
        const project = await this.prisma.project.findFirst({
          where: { id: link.entityId, portfolioId: link.portfolioId, isVisible: true, portfolio: { is: { isPublished: true } } }, select: { id: true },
        });
        if (project) { publiclyLinked = true; authorizedPortfolioId = link.portfolioId; }
      } else if (link.entityType === 'certificate' && ['certificate_image', 'certificate_file', 'certificate'].includes(link.mediaRole)) {
        const certificate = await this.prisma.certificate.findFirst({
          where: { id: link.entityId, portfolioId: link.portfolioId, isVisible: true, portfolio: { is: { isPublished: true } } }, select: { id: true },
        });
        if (certificate) { publiclyLinked = true; authorizedPortfolioId = link.portfolioId; }
        allowPdf ||= Boolean(certificate && ['certificate_file', 'certificate'].includes(link.mediaRole));
      } else if (link.entityType === 'profile' && link.mediaRole === 'cover') {
        const linkedProfile = await this.prisma.profile.findFirst({
          where: { id: link.entityId, portfolioId: link.portfolioId, portfolio: { is: { slug, isPublished: true } } }, select: { id: true },
        });
        if (linkedProfile) { publiclyLinked = true; authorizedPortfolioId = link.portfolioId; }
      } else if (link.entityType === 'interest' && link.mediaRole === 'icon') {
        const interest = await this.prisma.interest.findFirst({
          where: { id: link.entityId, portfolioId: link.portfolioId, isVisible: true, portfolio: { is: { slug, isPublished: true } } },
          select: { id: true },
        });
        if (interest) { publiclyLinked = true; authorizedPortfolioId = link.portfolioId; }
      }
    }
    const publicProfile = await this.prisma.profile.findFirst({
      where: { portfolio: { is: { slug, isPublished: true } }, OR: [{ avatarMediaId: id }, { cvMediaId: id }] },
      select: { portfolioId: true, avatarMediaId: true, cvMediaId: true },
    });
    const isAvatar = publicProfile?.avatarMediaId === id;
    const isCv = publicProfile?.cvMediaId === id;
    if (isAvatar || isCv) { publiclyLinked = true; authorizedPortfolioId = publicProfile!.portfolioId; }
    allowPdf ||= isCv;
    if (!publiclyLinked) throw new NotFoundException('Media file was not found.');

    const asset = authorizedPortfolioId === null ? null : await this.prisma.mediaAsset.findFirst({
      where: { id, portfolioId: authorizedPortfolioId }, select: { storagePath: true, mimeType: true },
    });
    const allowedType = asset?.mimeType === 'application/pdf' ? allowPdf : PUBLIC_IMAGE_TYPES.includes(asset?.mimeType ?? '');
    if (!asset || !allowedType) throw new NotFoundException('Media file was not found.');
    return { stream: createReadStream(await this.existingPath(asset.storagePath)), mimeType: asset.mimeType, download: asset.mimeType === 'application/pdf' && allowPdf };
  }

  private resolveStoragePath(storagePath: string) {
    if (isAbsolute(storagePath)) throw new NotFoundException('Media file was not found.');
    const absolutePath = resolve(this.storageRoot, storagePath);
    const pathFromRoot = relative(this.storageRoot, absolutePath);
    if (!pathFromRoot || pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
      throw new NotFoundException('Media file was not found.');
    }
    return absolutePath;
  }

  private async existingPath(storagePath: string) {
    const absolutePath = this.resolveStoragePath(storagePath);
    try {
      await access(absolutePath);
      return await this.assertWithinStorageRoot(absolutePath);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if ('code' in error && error.code !== 'ENOENT') throw error;
      throw new NotFoundException('Media file was not found.');
    }
  }

  private async assertWithinStorageRoot(pathValue: string) {
    const [realRoot, realTarget] = await Promise.all([realpath(this.storageRoot), realpath(pathValue)]);
    const fromRoot = relative(realRoot, realTarget);
    if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      throw new NotFoundException('Media file was not found.');
    }
    return realTarget;
  }

  private safeOriginalName(originalName: string, extension: string) {
    const safeName = basename(originalName).replace(/[\u0000-\u001f\u007f]/g, '').trim();
    const name = safeName ? basename(safeName, extname(safeName)) : 'upload';
    const base = name.slice(0, Math.max(1, 255 - extension.length));
    return `${base}${extension}`;
  }

  private parseId(value: string) {
    if (!/^\d{1,20}$/.test(value)) throw new BadRequestException('Invalid media ID.');
    const parsed = BigInt(value);
    if (parsed > 18446744073709551615n) throw new BadRequestException('Invalid media ID.');
    return parsed;
  }
}
