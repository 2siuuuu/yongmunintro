import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyGoogleToken } from '../server/google-auth.js';
import { createApp } from '../server/app.js';
import { GOOGLE_CLIENT_ID } from '../shared/google-auth.js';

const pair = await generateKeyPair('RS256');
const nonce = crypto.randomUUID();
const origin = 'https://yongmunintro-2.pages.dev';
const now = Math.floor(Date.now() / 1000);
const claims = { sub: 'test-user', aud: GOOGLE_CLIENT_ID, iss: 'https://accounts.google.com', iat: now, exp: now + 3600, nonce, email: 'private@example.com', name: 'Private User' };
const sign = (changes = {}, key = pair.privateKey) => new SignJWT({ ...claims, ...changes }).setProtectedHeader({ alg: 'RS256' }).sign(key);
const app = createApp((credential, expectedNonce) => verifyGoogleToken(credential, expectedNonce, pair.publicKey));
const request = (body, headers = {}) => app.request(`${origin}/api/auth/google`, {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

test('유효한 서명은 성공 여부와 만료 시각만 반환하고 쿠키를 만들지 않는다', async () => {
  const response = await request({ credential: await sign(), nonce });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: true, expiresAt: claims.exp * 1000 });
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('잘못된 대상·발급자·만료·nonce·필수 클레임·서명을 거부한다', async () => {
  for (const invalid of [{ aud: 'other-client' }, { iss: 'https://evil.example' }, { exp: now - 1 }, { nonce: 'other' }, { sub: '' }, { exp: undefined }, { azp: 'other-client' }, { iat: now + 3600 }]) {
    const response = await request({ credential: await sign(invalid), nonce });
    assert.equal(response.status, 401, JSON.stringify(invalid));
    assert.ok(!(await response.text()).includes('private@example.com'));
  }
  const other = await generateKeyPair('RS256');
  assert.equal((await request({ credential: await sign({}, other.privateKey), nonce })).status, 401);
  assert.equal((await request({ credential: 'invalid-token', nonce })).status, 401);
});

test('교차 출처·비JSON·잘못된 요청·과대 요청을 거부한다', async () => {
  const body = { credential: await sign(), nonce };
  assert.equal((await request(body, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request(body, { Origin: '' })).status, 403);
  assert.equal((await request(body, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request({ credential: body.credential })).status, 400);
  assert.equal((await request(null)).status, 400);
  assert.equal((await request({ credential: 'x'.repeat(17000), nonce })).status, 413);
});
