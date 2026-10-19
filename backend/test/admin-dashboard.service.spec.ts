import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminDashboardController } from '../src/modules/admin-dashboard/admin-dashboard.controller';
import { AdminDashboardService } from '../src/modules/admin-dashboard/admin-dashboard.service';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

function setup(published = true) {
  const calls: Array<{ model: string; args: unknown }> = [];
  const count = (model: string) => ({ count: async (args: unknown) => { calls.push({ model, args }); return model.length; } });
  const prisma = {
    portfolio: { findUnique: async (args: unknown) => {
      calls.push({ model: 'portfolio', args });
      return { id: 4n, title: 'Personal site', isPublished: published, profile: { id: 2n }, _count: { educations: 5, certificates: 6, experiences: 7, skills: 8, projects: 9, interests: 10, mediaAssets: 11 } };
    } },
    education: count('education'), certificate: count('certificate'), experience: count('experience'),
    skill: count('skill'), project: count('project'), interest: count('interest'),
  };
  return { service: new AdminDashboardService(prisma as unknown as PrismaService), calls };
}

test('returns database backed counts and visible counts for the authenticated owner portfolio', async () => {
  const { service, calls } = setup();
  const summary = await service.getSummary(42n);
  assert.deepEqual(summary, {
    portfolio: { title: 'Personal site', isPublished: true },
    sections: {
      profile: { total: 1, visible: 1 },
      educations: { total: 5, visible: 'education'.length },
      certificates: { total: 6, visible: 'certificate'.length },
      experiences: { total: 7, visible: 'experience'.length },
      skills: { total: 8, visible: 'skill'.length },
      projects: { total: 9, visible: 'project'.length },
      interests: { total: 10, visible: 'interest'.length },
      media: { total: 11 },
    },
    system: { database: 'connected' },
  });
  assert.equal(calls.length, 7);
  assert.deepEqual(calls[1].args, { where: { portfolioId: 4n, isVisible: true } });
  assert.equal(JSON.stringify(summary).includes('password'), false);
});

test('profile is not counted publicly when portfolio is not published', async () => {
  const { service } = setup(false);
  assert.deepEqual((await service.getSummary(42n)).sections.profile, { total: 1, visible: 0 });
});

test('returns not found when authenticated owner has no portfolio', async () => {
  const service = new AdminDashboardService({ portfolio: { findUnique: async () => null } } as unknown as PrismaService);
  await assert.rejects(service.getSummary(99n), NotFoundException);
});

test('dashboard summary endpoint requires backend AuthGuard', () => {
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, AdminDashboardController.prototype.getSummary), [AuthGuard]);
});
