# FeedPulse — AI-Powered Product Feedback Platform

FeedPulse is a full-stack feedback application built with Next.js, Tailwind CSS, Express, MongoDB, and Google Gemini AI. Customers submit product feedback without logging in; the backend enriches each entry with AI-generated category, sentiment, priority score, summary, and tags. Admins sign in to review items, filter, advance status, and delete entries.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Mongoose)
- **AI:** Google Gemini API (default model: `gemini-2.5-flash`, configurable via `GEMINI_MODEL`)
- **DevOps:** Docker, Docker Compose (optional)

## Project Structure

- `frontend/` — Next.js public form + admin dashboard
- `backend/` — Express REST API
- `docker-compose.yml` — Local MongoDB + API + frontend (optional)

## Features

- Public feedback form (title, description, category; optional name/email)
- Gemini analysis: `ai_category`, sentiment, priority (1–10), summary, tags
- Admin JWT login, list with pagination, search, filters, sorting
- Stats bar (totals, open count, average priority, top tag)
- Optional **AI digest** on the dashboard (aggregate summary via Gemini)
- Rate limiting on public submissions (5 per IP per hour)
- Delete feedback (admin)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key

### Backend

1. `cd backend`
2. `npm install`
3. Copy `cp .env.example .env` and set:
   - `MONGO_URI` — e.g. `mongodb://127.0.0.1:27017/feedpulse` or Atlas:
     `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/feedpulse?retryWrites=true&w=majority`
   - `GEMINI_API_KEY`
   - `JWT_SECRET` (long random string)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dashboard login)
4. `npm run dev` — API listens on port **4000** by default (`PORT` in `.env`).

### Frontend

1. `cd frontend`
2. `npm install`
3. `cp .env.example .env.local`
4. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your deployed API URL).
5. `npm run dev` — app at **http://localhost:3000**

### Docker

1. Copy root `.env.example` to `.env` and fill values.
2. `docker compose up --build`
3. Frontend: `http://localhost:3000` · API: `http://localhost:4000`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/feedback` | No | Create feedback (AI runs on create) |
| `GET` | `/api/feedback` | Yes | List with `category`, `status`, `search`, `page`, `limit`, `sort` |
| `GET` | `/api/feedback/summary` | Yes | Aggregate stats + AI digest text |
| `GET` | `/api/feedback/:id` | Yes | Single feedback |
| `PATCH` | `/api/feedback/:id` | Yes | Update `status` (`New` \| `In Review` \| `Resolved`) |
| `DELETE` | `/api/feedback/:id` | Yes | Delete feedback |
| `POST` | `/api/auth/login` | No | Admin login → JWT |
| `GET` | `/api/health` | No | Health check |

## Admin Dashboard

- Login: `/dashboard/login`
- After login: `/dashboard` — filters, search, stats, AI digest, status workflow, delete

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Optional; default `gemini-2.5-flash` |
| `JWT_SECRET` | Secret for signing admin JWTs |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Dashboard credentials |
| `PORT` | API port (default `4000`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API (e.g. `http://localhost:4000`) |

## Testing

```bash
cd backend
npm test
```

Runs Jest unit tests (including a smoke test for `/api/health`).

## Screenshots

Add your own screenshots to the repo or docs when you ship:

1. **Public form** — Home page with feedback submission.
2. **Admin dashboard** — Filters, stats, and AI-enriched list.
3. **AI insights** — Example row showing sentiment, priority, summary, tags.

*(Replace this section with real images, e.g. `docs/screenshots/form.png`, linked in markdown.)*

---

Built with a modular TypeScript layout (routes, controllers, models, services) and clear separation between public submission and protected admin APIs.
