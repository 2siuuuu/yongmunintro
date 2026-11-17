import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { verifyGoogleToken } from './google-auth.js';

export function createApp(verifyToken = verifyGoogleToken) {
const app = new Hono().basePath('/api');
app.use('*', async (context, next) => {
  await next();
  context.header('X-Robots-Tag', 'noindex');
  context.header('Cache-Control', 'no-store');
});
app.get('/health', context => context.json({ status: 'ok', service: 'yongmundong-village' }));
app.post('/auth/google', bodyLimit({ maxSize: 16 * 1024, onError: context => context.json({ error: '요청이 너무 큽니다.' }, 413) }), async context => {
  const origin = context.req.header('Origin');
  if (!origin || origin !== new URL(context.req.url).origin) {
    return context.json({ error: '허용되지 않은 요청입니다.' }, 403);
  }
  if (context.req.header('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    return context.json({ error: 'JSON 요청이 필요합니다.' }, 415);
  }
  let body;
  try { body = await context.req.json(); } catch {
    return context.json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }
  if (typeof body?.credential !== 'string' || !body.credential || body.credential.length > 12000 ||
      typeof body?.nonce !== 'string' || !/^[a-f0-9-]{36}$/.test(body.nonce)) {
    return context.json({ error: '인증 정보가 올바르지 않습니다.' }, 400);
  }
  try {
    return context.json(await verifyToken(body.credential, body.nonce));
  } catch {
    return context.json({ error: '로그인을 확인하지 못했습니다. 다시 시도해 주세요.' }, 401);
  }
});
app.notFound(context => context.json({ error: 'Not found' }, 404));
return app;
}

export default createApp();
