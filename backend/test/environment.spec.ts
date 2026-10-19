import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from '../src/config/environment';

const valid = {
  DATABASE_URL: 'mysql://user:pass@localhost:3306/personal_portfolio',
  JWT_SECRET: 'a-secure-secret-with-at-least-32-characters',
  FRONTEND_ORIGIN: 'http://localhost:3000',
  PORTFOLIO_SLUG: 'owner-site',
};

test('validates required environment values and defaults', () => {
  assert.deepEqual(validateEnvironment(valid), {
    databaseUrl: valid.DATABASE_URL,
    jwtSecret: valid.JWT_SECRET,
    frontendOrigin: valid.FRONTEND_ORIGIN,
    portfolioSlug: valid.PORTFOLIO_SLUG,
    port: 4000,
    nodeEnv: 'development',
    mediaStorageDirectory: '../storage/uploads',
  });
});

test('rejects missing connection/secret values and invalid port', () => {
  assert.throws(() => validateEnvironment({ ...valid, DATABASE_URL: '' }), /DATABASE_URL/);
  assert.throws(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' }), /at least 32/);
  assert.throws(() => validateEnvironment({ ...valid, PORT: '70000' }), /valid TCP port/);
});
