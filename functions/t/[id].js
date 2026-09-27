import { ensureSchema } from '../_utils.js';
import { renderFileHtml } from '../_viewer.js';

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const id = decodeURIComponent(params.id || '').trim();

  if (!id) {
    return new Response('404 Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  if (!env.DB) {
    return new Response('Error: falta binding DB', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  await ensureSchema(env.DB);

  const file = await env.DB.prepare('SELECT filename, mime_type, size_bytes, created_at FROM files WHERE id = ?').bind(id).first();
  if (!file) {
    return new Response('Archivo no encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const url = new URL(request.url);
  return new Response(renderFileHtml(file, id, url.origin), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
