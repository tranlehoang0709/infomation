import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthController } from '../src/modules/auth/auth.controller';

test('login sets the HttpOnly session cookie and returns no token or private fields', async () => {
  const cookies: unknown[] = [];
  const controller = new AuthController(
    { login: async () => 'signed-session-token' } as never,
    { get: () => 'development' } as never,
  );
  const result = await controller.login({ email: 'owner@example.com', password: 'secret-password' }, {
    cookie: (...args: unknown[]) => cookies.push(args),
  } as never);
  assert.deepEqual(result, { email: 'owner@example.com' });
  assert.equal(JSON.stringify(result).includes('signed-session-token'), false);
  assert.equal(JSON.stringify(result).includes('secret-password'), false);
  assert.deepEqual(cookies[0], ['portfolio_session', 'signed-session-token', {
    httpOnly: true, secure: false, sameSite: 'strict', path: '/api', maxAge: 43200000,
  }]);
});

test('logout clears the session cookie and returns only an acknowledgement', () => {
  let args: unknown[] = [];
  const controller = new AuthController({} as never, {} as never);
  const result = controller.logout({ clearCookie: (...values: unknown[]) => { args = values; } } as never);
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(args, ['portfolio_session', { httpOnly: true, sameSite: 'strict', path: '/api' }]);
});
