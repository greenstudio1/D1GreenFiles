import { ensureSchema } from '../../_utils.js';

export async function onRequestDelete(context) {
  const { params, request, env } = context;
  const id = decodeURIComponent(params.id || '').trim();
  const authHeader = request.headers.get('Authorization') || '';
  const customTokenHeader = request.headers.get('X-Custom-ID-Token') || '';

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Falta DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  await ensureSchema(env.DB);

  const item = await env.DB.prepare('SELECT id, is_custom FROM files WHERE id = ?').bind(id).first();
  if (!item) {
    return new Response(JSON.stringify({ error: 'Archivo no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  if (item.is_custom === 1 && (!env.CUSTOM_ID_TOKEN || customTokenHeader !== env.CUSTOM_ID_TOKEN)) {
    return new Response(JSON.stringify({ error: 'Requiere CUSTOM_ID_TOKEN' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
