import { FAVICON_SVG, escapeHtml, formatBytes } from './_utils.js';

export function renderFileHtml(file, id, origin) {
  const downloadUrl = `${origin}/t/download/${encodeURIComponent(id)}`;
  const rawUrl = `${origin}/t/raw/${encodeURIComponent(id)}`;
  const isImage = (file.mime_type || '').startsWith('image/');
  const isAudio = (file.mime_type || '').startsWith('audio/');
  const isVideo = (file.mime_type || '').startsWith('video/');

  let contentBlock = '';
  if (isImage) {
    contentBlock = `
      <div class="media-wrap">
        <img src="${rawUrl}" alt="${escapeHtml(file.filename)}" class="preview-img">
      </div>`;
  } else if (isAudio) {
    contentBlock = `
      <div class="media-wrap" style="padding: 40px 20px;">
        <audio controls style="width: 100%; max-width: 450px;">
          <source src="${rawUrl}" type="${escapeHtml(file.mime_type)}">
        </audio>
      </div>`;
  } else if (isVideo) {
    contentBlock = `
      <div class="media-wrap">
        <video controls style="max-width: 100%; max-height: 520px; border-radius: 10px;">
          <source src="${rawUrl}" type="${escapeHtml(file.mime_type)}">
        </video>
      </div>`;
  } else {
    contentBlock = `
      <div class="doc-box">
        <div class="doc-icon">📁</div>
        <div class="doc-name">${escapeHtml(file.filename)}</div>
        <div class="doc-meta">${formatBytes(file.size_bytes)} • ${escapeHtml(file.mime_type)}</div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenFiles - ${escapeHtml(file.filename)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: radial-gradient(ellipse at top, #101915 0%, #0c110e 50%); color: #e2e8f0; display: flex; justify-content: center; padding: 24px 16px; min-height: 100vh; }
    .container { width: 100%; max-width: 900px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #1e2a22; padding-bottom: 14px; flex-wrap: wrap; gap: 10px; }
    .brand-link { color: #10b981; font-weight: 800; font-size: 18px; text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .brand-link svg { width: 26px; height: 26px; }
    .actions { display: flex; gap: 6px; }
    a.btn, button { background: #17261e; border: 1px solid #21352a; color: #e2e8f0; padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.2s; }
    a.btn:hover, button:hover { border-color: #10b981; color: #10b981; transform: translateY(-1px); }
    .btn-main { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #062419 !important; border: none; }
    .card-preview { background: #131a16; border: 1px solid #1e2a22; border-radius: 14px; padding: 20px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
    .media-wrap { text-align: center; padding: 12px; }
    .preview-img { max-width: 100%; max-height: 580px; border-radius: 10px; border: 1px solid #1e2a22; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); object-fit: contain; }
    .doc-box { text-align: center; padding: 50px 20px; }
    .doc-icon { font-size: 56px; margin-bottom: 14px; }
    .doc-name { font-size: 18px; font-weight: 700; color: #f1f5f9; word-break: break-all; }
    .doc-meta { font-size: 13px; color: #64748b; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <a href="${origin}/" class="brand-link">${FAVICON_SVG} GreenFiles</a>
        <span style="color: #64748b; font-size: 14px; margin-left: 6px;">/t/${escapeHtml(id)}</span>
      </div>
      <div class="actions">
        <a href="${origin}/" class="btn">Dashboard</a>
        <a href="${rawUrl}" target="_blank" class="btn">Crudo / Raw</a>
        <a href="${downloadUrl}" download class="btn btn-main">Descargar</a>
        <button onclick="copyCurrent(this)">Copiar</button>
      </div>
    </div>
    <div class="card-preview">
      ${contentBlock}
    </div>
  </div>
  <script>
    function copyCurrent(btn) {
      navigator.clipboard.writeText(window.location.href);
      const old = btn.textContent;
      btn.textContent = '¡OK!';
      setTimeout(() => btn.textContent = old, 1200);
    }
  </script>
</body>
</html>`;
}
