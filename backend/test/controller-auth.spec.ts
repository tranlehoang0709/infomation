import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { ExperiencesController } from '../src/modules/experiences/experiences.controller';
import { InterestsController } from '../src/modules/interests/interests.controller';
import { MediaController } from '../src/modules/media/media.controller';
import { ProfileController } from '../src/modules/profile/profile.controller';
import { ProjectsController } from '../src/modules/projects/projects.controller';
import { AdminDashboardController } from '../src/modules/admin-dashboard/admin-dashboard.controller';

const protectedMethods: Array<[object, string[]]> = [
  [AuthController.prototype, ['session']],
  [ProfileController.prototype, ['getAdmin', 'update']],
  [ExperiencesController.prototype, ['getAdmin', 'create', 'update', 'remove']],
  [ProjectsController.prototype, ['getAdmin', 'create', 'update', 'remove']],
  [InterestsController.prototype, ['getAdmin', 'create', 'update', 'remove']],
  [MediaController.prototype, ['list', 'upload', 'remove', 'getAdminFile']],
  [AdminDashboardController.prototype, ['getSummary']],
];

test('every existing admin API handler is protected by AuthGuard', () => {
  for (const [prototype, methods] of protectedMethods) {
    for (const method of methods) {
      assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, (prototype as Record<string, object>)[method]), [AuthGuard], `${prototype.constructor.name}.${method}`);
    }
  }
});

test('login, logout, and intentionally public reads do not require admin session', () => {
  const publicMethods: Array<[object, string[]]> = [
    [AuthController.prototype, ['login', 'logout']],
    [ProfileController.prototype, ['getPublic']],
    [ExperiencesController.prototype, ['getPublic']],
    [ProjectsController.prototype, ['getPublic', 'getPublicBySlug']],
    [InterestsController.prototype, ['getPublic']],
    [MediaController.prototype, ['getPublicFile']],
  ];
  for (const [prototype, methods] of publicMethods) {
    for (const method of methods) {
      assert.equal(Reflect.getMetadata(GUARDS_METADATA, (prototype as Record<string, object>)[method]), undefined, `${prototype.constructor.name}.${method}`);
    }
  }
});
