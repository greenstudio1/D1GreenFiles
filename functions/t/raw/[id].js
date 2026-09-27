import { ensureSchema, toBinaryBody } from '../../_utils.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = decodeURIComponent(params.id || '').trim();

  if (!env.DB || !id) {
    return new Response('404 Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  await ensureSchema(env.DB);

  const file = await env.DB.prepare('SELECT filename, mime_type, data FROM files WHERE id = ?').bind(id).first();
  if (!file || !file.data) {
    return new Response('404 Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response(toBinaryBody(file.data), {
    headers: {
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
