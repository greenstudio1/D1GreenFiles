<template>
  <div class="app-root">
    <div class="container">
      <!-- HEADER -->
      <header class="brand">
        <div class="brand-left">
          <div class="logo-wrap">
            <svg viewBox="0 0 64 64" class="logo-svg">
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#047857"/>
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#g)"/>
              <path d="M22 17 C20.3 17 19 18.3 19 20 L19 44 C19 45.7 20.3 47 22 47 L42 47 C43.7 47 45 45.7 45 44 L45 27 L35 17 Z" fill="#ffffff" opacity="0.95"/>
              <path d="M35 17 L35 25 C35 26.1 35.9 27 37 27 L45 27 Z" fill="#062419" opacity="0.35"/>
              <circle cx="28" cy="36" r="3" fill="#047857"/>
              <path d="M25 43 L31 37 L36 41 L40 37 L43 40 L43 43 Z" fill="#047857" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <h1>D1Files</h1>
            <p>Bóveda integrada sobre Nuxt + Cloudflare D1</p>
          </div>
        </div>
        <div class="storage-badge" v-if="isAuthed">
          {{ files.length }} archivos guardados
        </div>
      </header>

      <!-- LOGIN -->
      <div v-if="!isAuthed" class="card">
        <h2 class="card-title">🔐 Acceso al Panel</h2>
        <label>AUTH_TOKEN:</label>
        <input v-model="authToken" type="password" placeholder="Tu token principal">
        
        <label>CUSTOM_ID_TOKEN (Opcional):</label>
        <input v-model="customToken" type="password" placeholder="Para slugs personalizados">

        <button class="btn-main" style="width:100%; margin-top:16px;" @click="login">
          Desbloquear Panel
        </button>
        <p v-if="authError" class="error-text">{{ authError }}</p>
      </div>

      <!-- DASHBOARD -->
      <div v-else>
        <div class="nav-bar">
          <span style="font-weight:700; color:#10b981;">Archivos Almacenados</span>
          <div style="display:flex; gap:8px;">
            <button class="btn-main" @click="showUploadModal = true">📤 Subir Archivo</button>
            <button class="btn-secondary" @click="fetchFiles">↻ Recargar</button>
            <button class="btn-danger" @click="logout">Cerrar Sesión</button>
          </div>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="table-empty">Consultando D1...</td>
                </tr>
                <tr v-else-if="files.length === 0">
                  <td colspan="5" class="table-empty">No hay archivos aún.</td>
                </tr>
                <tr v-for="f in files" :key="f.id">
                  <td><strong style="color:#10b981;">{{ f.id }}</strong></td>
                  <td>
                    <strong>{{ f.filename }}</strong>
                    <div style="font-size:11px; color:#64748b;">{{ formatBytes(f.size_bytes) }}</div>
                  </td>
                  <td>
                    <span :class="['tag', f.is_custom ? 'tag-custom' : 'tag-random']">
                      {{ f.is_custom ? 'Custom' : 'Random' }}
                    </span>
                  </td>
                  <td style="color:#64748b; font-size:12px;">{{ (f.created_at || '').substring(0, 16) }}</td>
                  <td>
                    <div style="display:flex; gap:4px;">
                      <a :href="'/' + f.id" target="_blank" class="btn-action">Ver</a>
                      <button class="btn-action" @click="copyLink('/' + f.id)">Copiar</button>
                      <button class="btn-action btn-del" @click="deleteFile(f.id)">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL SUBIDA -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-box">
        <h2 style="margin-bottom:12px;">Subir Archivo</h2>
        <input type="file" @change="onFileSelected" style="margin-bottom:12px;">
        <label>ID Personalizado (Opcional):</label>
        <input v-model="uploadCustomId" placeholder="ej: mi-archivo">

        <p v-if="uploadError" class="error-text">{{ uploadError }}</p>

        <div style="display:flex; gap:8px; margin-top:16px;">
          <button class="btn-main" style="flex:1;" :disabled="uploading" @click="uploadFile">
            {{ uploading ? 'Subiendo...' : 'Guardar' }}
          </button>
          <button class="btn-secondary" @click="showUploadModal = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const authToken = ref('')
const customToken = ref('')
const isAuthed = ref(false)
const authError = ref('')
const files = ref([])
const loading = ref(false)

const showUploadModal = ref(false)
const selectedFile = ref(null)
const uploadCustomId = ref('')
const uploading = ref(false)
const uploadError = ref('')

onMounted(() => {
  const saved = localStorage.getItem('d1files_auth')
  const savedCustom = localStorage.getItem('d1files_custom')
  if (saved) {
    authToken.value = saved
    customToken.value = savedCustom || ''
    login()
  }
})

async function login() {
  if (!authToken.value) return
  authError.value = ''
  try {
    const res = await $fetch('/api/files', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    files.value = res.files || []
    isAuthed.value = true
    localStorage.setItem('d1files_auth', authToken.value)
    localStorage.setItem('d1files_custom', customToken.value)
  } catch (err) {
    authError.value = err?.statusMessage || 'Token incorrecto'
  }
}

function logout() {
  localStorage.removeItem('d1files_auth')
  localStorage.removeItem('d1files_custom')
  isAuthed.value = false
  authToken.value = ''
  customToken.value = ''
  files.value = []
}

async function fetchFiles() {
  loading.value = true
  try {
    const res = await $fetch('/api/files', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    files.value = res.files || []
  } finally {
    loading.value = false
  }
}

function onFileSelected(e) {
  selectedFile.value = e.target.files[0] || null
}

async function uploadFile() {
  if (!selectedFile.value) {
    uploadError.value = 'Selecciona un archivo'
    return
  }
  uploading.value = true
  uploadError.value = ''

  const fd = new FormData()
  fd.append('file', selectedFile.value)
  if (uploadCustomId.value) fd.append('custom_id', uploadCustomId.value)

  try {
    await $fetch('/api/files', {
      method: 'POST',
      body: fd,
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        ...(customToken.value ? { 'X-Custom-ID-Token': customToken.value } : {})
      }
    })
    showUploadModal.value = false
    selectedFile.value = null
    uploadCustomId.value = ''
    fetchFiles()
  } catch (err) {
    uploadError.value = err?.data?.statusMessage || err?.message || 'Error al subir'
  } finally {
    uploading.value = false
  }
}

async function deleteFile(id) {
  if (!confirm(`¿Eliminar ${id}?`)) return
  try {
    await $fetch(`/api/files/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken.value}`,
        ...(customToken.value ? { 'X-Custom-ID-Token': customToken.value } : {})
      }
    })
    fetchFiles()
  } catch (err) {
    alert(err?.data?.statusMessage || 'Error al eliminar')
  }
}

function copyLink(path) {
  navigator.clipboard.writeText(window.location.origin + path)
  alert('Enlace copiado')
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
body { background: radial-gradient(ellipse at top, #101915 0%, #0c110e 50%); color: #e2e8f0; min-height: 100vh; }
.app-root { display: flex; justify-content: center; padding: 20px 14px; }
.container { width: 100%; max-width: 1000px; }

.brand { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.brand-left { display: flex; align-items: center; gap: 12px; }
.logo-wrap { width: 44px; height: 44px; }
.logo-svg { width: 100%; height: 100%; border-radius: 12px; }
.brand h1 { font-size: 20px; font-weight: 800; color: #f8fafc; }
.brand p { font-size: 11px; color: #64748b; }

.storage-badge { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 14px; border-radius: 999px; font-size: 12px; color: #10b981; font-weight: 600; }

.card { background: #131a16; border: 1px solid #1e2a22; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
.card-title { font-size: 16px; margin-bottom: 14px; }
label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; margin: 12px 0 6px; text-transform: uppercase; }
input { width: 100%; padding: 10px 12px; background: #0c110e; border: 1px solid #233228; border-radius: 8px; color: #fff; outline: none; }
input:focus { border-color: #10b981; }

.btn-main { background: linear-gradient(135deg, #10b981, #059669); color: #062419; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
.btn-secondary { background: #1b2620; border: 1px solid #27382d; color: #e2e8f0; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-danger { background: #7f1d1d; border: none; color: #fca5a5; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-action { background: #17261e; border: 1px solid #21352a; color: #e2e8f0; padding: 5px 8px; border-radius: 6px; font-size: 11px; text-decoration: none; cursor: pointer; display: inline-flex; }
.btn-del { color: #f87171; }

.nav-bar { display: flex; justify-content: space-between; align-items: center; background: #131a16; border: 1px solid #1e2a22; border-radius: 12px; padding: 8px 12px; margin-bottom: 16px; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
th { text-align: left; padding: 10px; color: #64748b; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #1e2a22; }
td { padding: 12px 10px; border-bottom: 1px solid #16201a; vertical-align: middle; }
.table-empty { text-align: center; color: #64748b; padding: 24px; }

.tag { padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; }
.tag-custom { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
.tag-random { background: rgba(51, 65, 85, 0.5); color: #94a3b8; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal-box { background: #131a16; border: 1px solid #233228; border-radius: 14px; width: 100%; max-width: 480px; padding: 20px; }
.error-text { color: #f87171; font-size: 12px; margin-top: 8px; }
</style>
