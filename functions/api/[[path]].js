import app from '../../server/app.js';

export function onRequest(context) {
  return app.fetch(context.request, context.env, context);
}
