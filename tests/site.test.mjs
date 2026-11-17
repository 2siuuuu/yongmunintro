import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App } from '../.ssr/entry-server.js';
import app from '../server/app.js';
import { onRequest } from '../functions/api/[[path]].js';
import { siteSettings } from '../scripts/seo.mjs';

test('초기 HTML에 본문, 접근 가능한 링크, 로컬 이미지가 포함된다', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const { document } = new JSDOM(html).window;
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.match(document.querySelector('main').textContent, /용문동이 보입니다/);
  for (const id of ['about', 'scenery', 'stories', 'visit']) assert.ok(document.getElementById(id));
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    const id = link.getAttribute('href').slice(1);
    if (id) assert.ok(document.getElementById(id), `Missing anchor: ${id}`);
  }
  for (const image of document.querySelectorAll('img')) {
    assert.ok(image.hasAttribute('alt'));
    await access(`dist${image.getAttribute('src')}`);
  }
  assert.ok(!html.includes('<!--app-html-->'));
  await access('dist/404.html');
  await access('dist/robots.txt');
  await access('dist/sitemap.xml');
});

test('정적 HTML을 오류 없이 hydrate하고 메뉴를 열고 닫는다', async () => {
  const dom = new JSDOM(await readFile('dist/index.html', 'utf8'), { url: 'https://example.com/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  let root;
  try {
    await act(async () => { root = hydrateRoot(document.getElementById('root'), React.createElement(App), { onRecoverableError: error => errors.push(error) }); });
    const button = document.querySelector('.menu');
    await act(async () => button.click());
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    assert.ok(document.getElementById('navigation').classList.contains('open'));
    await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' })));
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, button);
    await act(async () => button.click());
    await act(async () => document.querySelector('nav a').click());
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(errors, []);
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test('Hono API 및 Pages 진입점의 정상·404 응답', async () => {
  const response = await onRequest({ request: new Request('https://example.com/api/health'), env: {} });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  const missing = await app.request('/api/missing');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Not found' });
});

test('색인 설정에는 유효한 공개 도메인이 필요하다', () => {
  assert.deepEqual(siteSettings({}), { indexable: false, url: null });
  assert.throws(() => siteSettings({ SITE_INDEXABLE: 'true' }));
  assert.throws(() => siteSettings({ SITE_URL: 'javascript:alert(1)' }));
  assert.throws(() => siteSettings({ SITE_URL: 'https://example.com/path' }));
  assert.deepEqual(siteSettings({ SITE_URL: 'https://example.com', SITE_INDEXABLE: 'true' }), { indexable: true, url: 'https://example.com/' });
});

test('로그인 창의 성공·로그아웃·실패·재시도와 닫힌 창의 늦은 응답을 처리한다', async () => {
  const dom = new JSDOM(await readFile('dist/index.html', 'utf8'), { url: 'https://example.com/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  let configuration;
  let disabled = 0;
  let rendered = 0;
  window.google = { accounts: { id: {
    initialize(options) { configuration = options; },
    renderButton(element) { rendered++; element.textContent = 'Google 로그인'; },
    disableAutoSelect() { disabled++; },
  } } };
  const originalFetch = globalThis.fetch;
  const replies = [];
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url, ...init };
    return replies.shift();
  };
  let root;
  try {
    await act(async () => { root = hydrateRoot(document.getElementById('root'), React.createElement(App)); });
    assert.equal(rendered, 0, '사용자가 창을 열기 전에는 Google SDK를 초기화하지 않음');
    await act(async () => document.querySelector('.login-trigger').click());
    assert.equal(document.querySelector('dialog').open, true);
    assert.ok(configuration.nonce);
    replies.push(new Response(JSON.stringify({ authenticated: true, expiresAt: Date.now() + 60000 })));
    await act(async () => configuration.callback({ credential: 'mock-test-credential' }));
    assert.equal(request.url, '/api/auth/google');
    assert.equal(request.credentials, 'omit');
    assert.match(document.querySelector('.login-trigger').textContent, /로그인 완료/);
    assert.equal(window.localStorage.length, 0);
    assert.equal(window.sessionStorage.length, 0);
    assert.equal(document.cookie, '');
    await act(async () => document.querySelector('.login-success button').click());
    assert.equal(disabled, 1);
    assert.equal(document.querySelector('.login-trigger').textContent, '로그인');
    assert.equal(document.querySelector('dialog').open, false);

    await act(async () => document.querySelector('.login-trigger').click());
    replies.push(new Response('{}', { status: 401 }));
    await act(async () => configuration.callback({ credential: 'bad-token' }));
    assert.match(document.querySelector('[role="alert"]').textContent, /확인하지 못했습니다/);
    const previousNonce = configuration.nonce;
    await act(async () => document.querySelector('.login-action').click());
    assert.notEqual(configuration.nonce, previousNonce);

    let complete;
    replies.push(new Promise(resolve => { complete = resolve; }));
    let pending;
    await act(async () => { pending = configuration.callback({ credential: 'late-token' }); });
    await act(async () => document.querySelector('.login-close').click());
    await act(async () => {
      complete(new Response(JSON.stringify({ authenticated: true, expiresAt: Date.now() + 60000 })));
      await pending;
    });
    assert.equal(document.querySelector('.login-trigger').textContent, '로그인');
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
