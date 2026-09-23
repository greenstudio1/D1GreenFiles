export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const env = event.context.cloudflare?.env

  if (!env?.DB || !id) {
    throw createError({ statusCode: 404, statusMessage: 'No encontrado' })
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
