import { Hono } from 'hono';

const app = new Hono().basePath('/api');
app.use('*', async (context, next) => {
  await next();
  context.header('X-Robots-Tag', 'noindex');
  context.header('Cache-Control', 'no-store');
});
app.get('/health', context => context.json({ status: 'ok', service: 'yongmundong-village' }));
app.notFound(context => context.json({ error: 'Not found' }, 404));
export default app;
