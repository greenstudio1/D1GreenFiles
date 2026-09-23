export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env
  const id = getRouterParam(event, 'id')
  const authHeader = getHeader(event, 'authorization') || ''
  const customTokenHeader = getHeader(event, 'x-custom-id-token') || ''

  if (!env?.DB) throw createError({ statusCode: 500, statusMessage: 'Falta DB' })
  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  }

  const item = await env.DB.prepare('SELECT id, is_custom FROM files WHERE id = ?').bind(id).first()
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Archivo no encontrado' })

  if (item.is_custom === 1 && (!env.CUSTOM_ID_TOKEN || customTokenHeader !== env.CUSTOM_ID_TOKEN)) {
    throw createError({ statusCode: 403, statusMessage: 'Requiere CUSTOM_ID_TOKEN' })
  }

  await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run()
  return { success: true }
})
