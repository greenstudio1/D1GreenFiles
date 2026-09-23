# 📁 D1GreenFiles

A unified file vault and delivery server built on **Nuxt 3** and **Cloudflare Pages**, powered directly by **Cloudflare D1 (SQLite)**.

Everything runs inside a single project: a reactive Vue 3 frontend, management API routes, and direct binary delivery/rendering (`/:id`) without relying on external standalone Workers.

---

## 📋 Prerequisites & Requirements

### 1. Local Environment
* **Node.js**: Version 18.x or 20+ recommended.
* **Package Manager**: `npm`, `pnpm`, or `bun`.
* **Cloudflare Account**: With access to D1 and Pages (both available on the free tier).
* **Wrangler CLI**: Included with project dev dependencies (`npx wrangler`).

---

## ⚙️ Cloudflare D1 Setup

1. **Log in to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Create the D1 database:**
   ```bash
   npx wrangler d1 create d1greenfiles-db
   ```
   *Copy the `database_id` displayed in your terminal after running this command.*

---

## 🔐 Environment Variables & Bindings

Edit your `wrangler.toml` file with your credentials and database configuration:

```toml
name = "d1greenfiles"
compatibility_date = "2026-09-01"
pages_build_output_dir = ".output/public"

# Required database binding
[[d1_databases]]
binding = "DB"
database_name = "d1greenfiles-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"

[vars]
# Required token to access dashboard, upload, and delete files
AUTH_TOKEN = "your_secret_access_token_here"

# Optional token required to create and manage custom slugs/IDs
CUSTOM_ID_TOKEN = "your_secret_custom_id_token_here"
```

> **Note:** The SQLite `files` schema is created automatically upon the first API request, so no manual migrations are needed.

---

## 🚀 Installation & Local Development

### Step 1: Install dependencies
```bash
npm install
```

### Step 2: Run locally
Run the app locally with full Cloudflare Pages and D1 emulation:
```bash
npx wrangler pages dev -- npm run dev
```
The application will default to `http://localhost:8788`.

---

## 📦 Build & Production Deployment

1. **Build the Nuxt application:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   npx wrangler pages deploy .output/public
   ```

---

## 🌐 Routes & Endpoints

| Route | Method | Description |
|---|---|---|
| `/` | `GET` | Web control dashboard (Vue 3 / Nuxt). |
| `/:id` | `GET` | Direct binary delivery/rendering with original MIME type. |
| `/api/files` | `GET` | Lists files stored in D1 (Requires `Bearer AUTH_TOKEN`). |
| `/api/files` | `POST` | Multipart file upload (Requires `Bearer AUTH_TOKEN`). |
| `/api/files/:id` | `DELETE` | Deletes a file by ID (Requires `Bearer AUTH_TOKEN`). |

---

## 🔒 Security Recommendations

* For production deployments, store sensitive credentials using encrypted secrets:
  ```bash
  npx wrangler pages secret put AUTH_TOKEN
  npx wrangler pages secret put CUSTOM_ID_TOKEN
  ```
* D1 SQLite rows have query size constraints; optimize large assets accordingly.
