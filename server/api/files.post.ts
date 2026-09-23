export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env
  const authHeader = getHeader(event, 'authorization') || ''
  const customTokenHeader = getHeader(event, 'x-custom-id-token') || ''

  if (!env?.DB) throw createError({ statusCode: 500, statusMessage: 'Falta el binding DB' })
  if (!env.AUTH_TOKEN || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    throw createError({ statusCode: 401, statusMessage: 'AUTH_TOKEN inválido' })
  }

  await ensureSchema(env.DB)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No se envió ningún archivo' })
  }

  const fileItem = formData.find(item => item.name === 'file' && item.filename)
  const customIdItem = formData.find(item => item.name === 'custom_id')
  const customId = customIdItem?.data ? customIdItem.data.toString().trim() : ''

  if (!fileItem || !fileItem.data) {
    throw createError({ statusCode: 400, statusMessage: 'Campo "file" requerido' })
  }

  let fileId = ''
  let isCustom = 0

  if (customId && env.CUSTOM_ID_TOKEN && customTokenHeader === env.CUSTOM_ID_TOKEN) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(customId)) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido (solo letras, números, puntos y guiones)' })
    }
    const exists = await env.DB.prepare('SELECT id FROM files WHERE id = ?').bind(customId).first()
    if (exists) {
      throw createError({ statusCode: 409, statusMessage: 'El ID ya existe' })
    }
    fileId = customId
    isCustom = 1
  } else {
    let tries = 0
    while (tries < 5) {
      const candidate = generateRandomId()
      const exists = await env.DB.prepare('SELECT id FROM files WHERE id = ?').bind(candidate).first()
      if (!exists) {
        fileId = candidate
        break
      }
      tries++
    }
  }

  const binaryData = new Uint8Array(fileItem.data)
  const mime = getMime(fileItem.filename || '', fileItem.type)

  await env.DB.prepare(`
    INSERT INTO files (id, filename, mime_type, size_bytes, data, is_custom)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .bind(fileId, fileItem.filename, mime, binaryData.byteLength, binaryData, isCustom)
    .run()

  return {
    id: fileId,
    filename: fileItem.filename,
    size: binaryData.byteLength,
    url: `/${fileId}`
  }
})
