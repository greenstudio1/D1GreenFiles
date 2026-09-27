let isInitialized = false;

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#059669" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#g)" filter="url(#shadow)"/>
  <path d="M22 17 C20.3 17 19 18.3 19 20 L19 44 C19 45.7 20.3 47 22 47 L42 47 C43.7 47 45 45.7 45 44 L45 27 L35 17 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M35 17 L35 25 C35 26.1 35.9 27 37 27 L45 27 Z" fill="#062419" opacity="0.35"/>
  <circle cx="28" cy="36" r="3" fill="#047857"/>
  <path d="M25 43 L31 37 L36 41 L40 37 L43 40 L43 43 Z" fill="#047857" opacity="0.8"/>
</svg>`;

export const MIME_MAP = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  txt: 'text/plain; charset=utf-8',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  zip: 'application/zip'
};

export function getMime(filename, fallback) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || fallback || 'application/octet-stream';
}

export function toBinaryBody(data) {
  if (!data) return new Uint8Array(0);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return new Uint8Array(data);
  return data;
}

export async function ensureSchema(db) {
  if (isInitialized) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data BLOB NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
  isInitialized = true;
}

export function generateRandomId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
