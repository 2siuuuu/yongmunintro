import { readFile, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { render } from '../.ssr/entry-server.js';
import { siteSettings, escapeXml } from './seo.mjs';

const { indexable, url } = siteSettings({ ...loadEnv('production', process.cwd(), ''), ...process.env });
let template = await readFile('dist/index.html', 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('정적 렌더링 삽입 지점이 없습니다.');
template = template.replace('<!--app-html-->', render());
template = template.replace('<!--site-meta-->', url ? `<link rel="canonical" href="${escapeXml(url)}" /><meta property="og:url" content="${escapeXml(url)}" />` : '');
if (indexable) template = template.replace('content="noindex,nofollow"', 'content="index,follow"');
await writeFile('dist/index.html', template);
await writeFile('dist/robots.txt', indexable ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${url}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable ? `<url><loc>${escapeXml(url)}</loc></url>` : ''}</urlset>`);
console.log(`SSG complete: content included in initial HTML; indexing ${indexable ? 'enabled' : 'disabled (preview)'}.`);
