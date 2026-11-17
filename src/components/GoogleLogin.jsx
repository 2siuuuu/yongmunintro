import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../../shared/google-auth.js';
import { loadGoogleIdentity } from '../lib/google-identity.js';

export default function GoogleLogin() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const dialog = useRef(null);
  const buttonSlot = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => {
      setExpiresAt(null);
      setError('로그인 시간이 만료되었습니다. 다시 로그인해 주세요.');
    }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (!open || expiresAt) return;
    let active = true;
    let verifying = false;
    const controller = new AbortController();
    const slot = buttonSlot.current;
    const nonce = crypto.randomUUID();
    setPhase('loading');

    loadGoogleIdentity().then(identity => {
      if (!active) return;
      identity.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: 'popup',
        auto_select: false,
        nonce,
        callback: async ({ credential }) => {
          if (!active || verifying) return;
          verifying = true;
          setPhase('verifying');
          setError('');
          const timeout = setTimeout(() => controller.abort(), 15000);
          try {
            const response = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit',
              cache: 'no-store',
              body: JSON.stringify({ credential, nonce }),
              signal: controller.signal,
            });
            const result = await response.json();
            if (!response.ok || result.authenticated !== true || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) {
              throw new Error('로그인을 확인하지 못했습니다. 다시 시도해 주세요.');
            }
            if (active) setExpiresAt(result.expiresAt);
          } catch {
            if (active) {
              setError('로그인을 확인하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
              setPhase('error');
            }
          } finally {
            clearTimeout(timeout);
            credential = undefined;
            verifying = false;
          }
        },
      });
      slot.replaceChildren();
      identity.renderButton(slot, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'ko', width: 260 });
      setPhase('ready');
    }).catch(() => {
      if (active) {
        setError('Google 로그인 버튼을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
        setPhase('error');
      }
    });
    return () => {
      active = false;
      controller.abort();
      slot?.replaceChildren();
    };
  }, [open, attempt, expiresAt]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function logout() {
    window.google?.accounts?.id.disableAutoSelect();
    setExpiresAt(null);
    setError('');
    setOpen(false);
  }

  return <>
    <button ref={trigger} type="button" className="login-trigger" onClick={() => { setError(''); setOpen(true); }}>
      {expiresAt ? '로그인 완료 ✓' : '로그인'}
    </button>
    <dialog ref={dialog} className="login-dialog" aria-labelledby="login-title" aria-describedby="login-description" onCancel={close} onClose={close}>
      <button className="login-close" type="button" aria-label="로그인 창 닫기" onClick={close}>×</button>
      <span className="eyebrow">WELCOME TO YONGMUN-DONG</span>
      <h2 id="login-title">{expiresAt ? '반갑습니다.' : '용문동에 오신 걸 환영해요.'}</h2>
      <p id="login-description">연습용 구글 로그인입니다.<br />회원 정보를 별도로 저장하지 않으며,<br />새로고침하면 로그인 상태가 초기화됩니다.</p>
      {expiresAt ? <div className="login-success">
        <p role="status">Google 로그인 확인을 완료했습니다.</p>
        <button type="button" className="login-action" onClick={logout}>로그아웃</button>
      </div> : <div aria-busy={phase === 'loading' || phase === 'verifying'}>
        <div ref={buttonSlot} className="google-button-slot" hidden={phase !== 'ready'} />
        {(phase === 'loading' || phase === 'verifying') && <p role="status">{phase === 'loading' ? '로그인 버튼을 준비하고 있습니다…' : '로그인을 확인하고 있습니다…'}</p>}
        {error && <p role="alert" className="login-error">{error}</p>}
        {phase === 'error' && <button type="button" className="login-action" onClick={() => { setError(''); setAttempt(value => value + 1); }}>다시 시도</button>}
      </div>}
    </dialog>
  </>;
}
