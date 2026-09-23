export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env
  const authHeader = getHeader(event, 'authorization') || ''

  if (!env?.DB) {
    throw createError({ statusCode: 500, statusMessage: 'Falta el binding DB de D1' })
  }

  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }

  await ensureSchema(env.DB)

  const { results } = await env.DB.prepare(
    'SELECT id, filename, mime_type, size_bytes, is_custom, created_at FROM files ORDER BY created_at DESC LIMIT 200'
  ).all()

  return { total: results.length, files: results }
})
