# Kala Mandir — Admin Panel (React + Vite)

Frontend admin panel for [Kala Mandir Art & Dance Institute](https://kala-mandir-eda5.vercel.app/).

Matches the website design system (warm paper background, rose/pink accents, plum sidebar, DM Serif Display + Inter).

## Features

- **Login / Register** — connected to the server auth API
- **Dashboard** — stats + recent uploads
- **Gallery** — photos & videos with title, category, subcategory
  - Filter by type / category, search by title
  - Add / edit / delete persisted gallery items
  - Photos and videos upload directly to Cloudinary
- **Categories** — dedicated category and subcategory management screens with CRUD
- **Media upload** — choose media type, enter title, select a photo/video file, then assign its category and subcategory

## Run

```bash
cd kala-mandir-admin-react
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Connect the backend

Run the server in `Server` with `npm start` (or `node server.js`) and configure
its `.env` with `MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, and
`CLOUDINARY_UPLOAD_PRESET=kala mandir` (the preset must be set to Unsigned).
The admin app calls `http://localhost:8000/api` by default. Set
`VITE_API_URL` in an admin `.env` file to use a different API base URL.

Create the initial admin account through the admin sign-in screen. To prevent
public visitors from creating admin accounts, registration closes after the
first account is created. Gallery and category management endpoints require
the returned bearer token. Uploaded files are limited to 100 MB.

## Stack

- React 18
- Vite 5
- Plain CSS (theme tokens from the public site)

Admin data and uploaded media are stored via the server and persist across refreshes.
