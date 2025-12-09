# AI ERP Frontend

This repository contains the frontend for the AI-enabled ERP application (Vite + React).

## Project structure

- `src/` - React source files
  - `main.jsx` - app entry
  - `App.jsx` - top-level component
  - `pages/` - route pages (Dashboard, Login, Admin, etc.)
  - `api/` - API helper modules
  - `components/` - shared UI components
  - `store/` - Redux store + slices

- `index.html` - Vite HTML entry
- `package.json` - scripts & dependencies
- `vite.config.js` - Vite configuration
- `Dockerfile` - container build
- `nginx.conf` - optional container/nginx config

## Requirements

- Node.js 18+ (or your project's required version)
- npm or yarn

## Local development

1. Install dependencies:

```powershell
cd c:\Users\palla\projects\blu_task\frontend
npm install
```

2. Start dev server:

```powershell
npm run dev
```

3. Open the app in your browser at the URL printed by Vite (typically `http://localhost:5173`).

## Build for production

```powershell
npm run build
# serve the dist locally for a quick test
npm run preview
```

## Docker

Build and run the container (optional):

```powershell
# build
docker build -t ai-erp-frontend .

# run
docker run --rm -p 8080:80 ai-erp-frontend
```

## Git / Deployment notes

This project expects a remote repository like `https://github.com/Noupadalikhitha/ai_erp_frontend` to push to. If pushing fails due to authentication, create a Personal Access Token (PAT) and use it for remote push, or configure SSH keys.

## Helpful scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — serve production build locally

## Contact / Maintainers

If you need changes to this README or help pushing to GitHub, let me know and I can update the file or run the push commands again with authentication guidance.
