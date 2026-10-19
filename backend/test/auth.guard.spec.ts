import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../src/modules/auth/auth.guard';

function context(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) };
}

test('rejects requests without the session cookie', async () => {
  const guard = new AuthGuard({ verifyAsync: async () => ({ sub: '1' }) } as never, { validateSession: async () => ({ id: '1', email: 'owner@example.com' }) } as never);
  await assert.rejects(() => guard.canActivate(context({}) as never), UnauthorizedException);
});

test('verifies the session and attaches the owner identity', async () => {
  const guard = new AuthGuard(
    { verifyAsync: async () => ({ sub: '12' }) } as never,
    { validateSession: async (id: string) => ({ id, email: 'owner@example.com' }) } as never,
  );
  const request: Record<string, unknown> = { cookies: { portfolio_session: 'valid-session' } };
  assert.equal(await guard.canActivate(context(request) as never), true);
  assert.deepEqual(request.user, { id: '12', email: 'owner@example.com' });
});
