let loading;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(new Error('Google 로그인 버튼을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'));
    };
    const timeout = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.google?.accounts?.id) return fail();
      clearTimeout(timeout);
      resolve(window.google.accounts.id);
    };
    document.head.append(script);
  });
  return loading;
}
