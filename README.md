# Muralis

Web and mobile application for previewing murals and street art on real walls and facades using a live camera feed or static photos. It runs **local-first** (browser persistence via IndexedDB) with an optional Python (FastAPI) backend for authentication, cloud sync, and public link sharing.

Live demo: https://muralis-app.netlify.app

## Features

- **Live camera & static photo:** direct device camera preview (with frame capture) or static wall photo upload.
- **Perspective projection (3x3 Homography):** draggable 4-corner handles, touch drag/pinch gestures, wall angle presets, and auto-fit.
- **Paint & finish:** blend modes (`multiply`, `overlay`, `soft-light`, `normal`), opacity, brightness, and contrast controls.
- **Editing & occlusion masking:** artwork cropping/editing modal and brush/eraser mask to hide occluded areas (windows, poles, wires).
- **Wall measurement:** 2-point reference line calibration (`A–B` in meters), average artwork dimensions (`W × H`), surface area in `m²`, and estimated paint consumption (1 coat).
- **Computer Graphics & Image Processing:**
  - 3x3 homography matrix inspector.
  - 3x3 convolution filters applied to artwork.
  - 3D scene preview with lighting (`Three.js`).
  - Painter's perspective squaring grid.
  - Projector mode (inverse keystone).
- **Mural gallery (local-first):** create, open, duplicate, and delete projects stored locally in IndexedDB (Dexie), with automatic image conversion for offline persistence.
- **Export & sharing:** high-resolution PNG export and native sharing (`Web Share API` when supported).

## Tech Stack

- **Frontend (`client/`):** Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router, Dexie (IndexedDB), Three.js, Lucide Icons, Capacitor (Android).
- **Testing (`client/`):** Vitest + `fake-indexeddb`.
- **Optional Backend (`backend/`):** Python 3.11, FastAPI, SQLAlchemy, Uvicorn (local SQLite or PostgreSQL).

## Project Structure

```text
Muralis/
├── backend/              # Optional FastAPI API (auth, sync, sharing)
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
├── client/               # Vue 3 + TypeScript + Capacitor app
│   ├── src/
│   │   ├── components/
│   │   ├── engine/       # Homography, blend, autoFit, measurement, convolution, clipping, grid
│   │   ├── services/     # apiClient, offlineDb, permissionService
│   │   ├── stores/       # authStore, projectStore
│   │   └── views/        # EditorView, ProjectsView, LoginView, ShareView
│   ├── netlify.toml
│   └── package.json
├── docker-compose.yml
└── render.yaml
```

## Running Locally

### Frontend (`client/`)

```bash
cd client
npm install
npm run dev
```

Available scripts in `client/`:

- `npm run dev` — starts the Vite dev server
- `npm run type-check` — runs `vue-tsc --noEmit`
- `npm run test` — runs the Vitest test suite
- `npm run build` — type-checks and builds production assets into `client/dist/`

### Optional Backend (`backend/`)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

Or via Docker Compose from the repository root:

```bash
docker compose up --build
```
