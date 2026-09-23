// server/routes/[id].get.ts
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // 1. Si es la raíz, peticiones de Nuxt, favicon o API, ignorar y pasar al frontend
  if (
    pathname === '/' ||
    pathname === '' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_nuxt/')  
  ) {
    return // Deja que Nuxt maneje la página normalmente
  }

  const id = getRouterParam(event, 'id')
  if (!id) return

  const env = event.context.cloudflare?.env
  if (!env?.DB) {
    throw createError({ statusCode: 500, statusMessage: 'Falta DB' })
  }

  const file = await env.DB.prepare('SELECT filename, mime_type, data FROM files WHERE id = ?')
    .bind(id)
    .first()

  if (!file || !file.data) {
    throw createError({ statusCode: 404, statusMessage: 'Archivo no encontrado' })
  }

  const encodedFilename = encodeURIComponent(file.filename)

  setResponseHeaders(event, {
    'Content-Type': file.mime_type || 'application/octet-stream',
    'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Cache-Control': 'public, max-age=86400'
  })

  return new Uint8Array(file.data)
})
