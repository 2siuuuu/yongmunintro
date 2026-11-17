export function siteSettings(env) {
  const indexable = env.SITE_INDEXABLE === 'true';
  const raw = env.SITE_URL?.trim();
  if (indexable && !raw) throw new Error('색인 활성화에는 SITE_URL이 필요합니다.');
  if (!raw) return { indexable, url: null };
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SITE_URL에는 HTTPS 도메인 루트 주소를 입력하세요.');
  }
  return { indexable, url: url.origin + '/' };
}

export function escapeXml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}
