import { createRemoteJWKSet, jwtVerify } from 'jose';
import { GOOGLE_CLIENT_ID } from '../shared/google-auth.js';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function verifyGoogleToken(credential, nonce, keys = googleKeys) {
  const { payload } = await jwtVerify(credential, keys, {
    algorithms: ['RS256'],
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: GOOGLE_CLIENT_ID,
    requiredClaims: ['sub', 'iat', 'exp', 'nonce'],
    maxTokenAge: '1h',
  });
  if (payload.nonce !== nonce || typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid identity');
  }
  if (payload.azp && payload.azp !== GOOGLE_CLIENT_ID) throw new Error('Invalid authorized party');
  // Do not return, log, or persist personal claims or the original token.
  return { authenticated: true, expiresAt: payload.exp * 1000 };
}
