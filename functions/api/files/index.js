import { ensureSchema, generateRandomId, getMime } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization') || '';

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Falta binding DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  await ensureSchema(env.DB);

  const { results } = await env.DB.prepare(
    'SELECT id, filename, mime_type, size_bytes, is_custom, created_at FROM files ORDER BY created_at DESC LIMIT 200'
  ).all();

  return new Response(JSON.stringify({ total: results.length, files: results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization') || '';
  const customTokenHeader = request.headers.get('X-Custom-ID-Token') || '';

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Falta DB' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'AUTH_TOKEN inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  await ensureSchema(env.DB);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Formato multipart requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const file = formData.get('file');
  const custom_id = (formData.get('custom_id') || '').toString().trim();

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'El archivo es requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let fileId = '';
  let isCustom = 0;

  if (custom_id && env.CUSTOM_ID_TOKEN && customTokenHeader === env.CUSTOM_ID_TOKEN) {
    const cleanId = custom_id.trim();
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanId)) {
      return new Response(JSON.stringify({ error: 'ID inválido (solo letras, números, puntos y guiones)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const exists = await env.DB.prepare('SELECT id FROM files WHERE id = ?').bind(cleanId).first();
    if (exists) {
      return new Response(JSON.stringify({ error: 'El ID ya existe' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    fileId = cleanId;
    isCustom = 1;
  } else {
    let tries = 0;
    while (tries < 5) {
      const candidate = generateRandomId();
      const exists = await env.DB.prepare('SELECT id FROM files WHERE id = ?').bind(candidate).first();
      if (!exists) {
        fileId = candidate;
        break;
      }
      tries++;
    }
  }

  const buffer = await file.arrayBuffer();
  const binaryData = new Uint8Array(buffer);
  const mime = getMime(file.name, file.type);

  await env.DB.prepare(`
    INSERT INTO files (id, filename, mime_type, size_bytes, data, is_custom)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .bind(fileId, file.name, mime, buffer.byteLength, binaryData, isCustom)
    .run();

  const url = new URL(request.url);
  return new Response(JSON.stringify({
    id: fileId,
    filename: file.name,
    size: buffer.byteLength,
    view_url: `${url.origin}/t/${fileId}`,
    raw_url: `${url.origin}/t/raw/${fileId}`,
    download_url: `${url.origin}/t/download/${fileId}`
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
