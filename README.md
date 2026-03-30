# FeedPulse — AI-Powered Product Feedback Platform

FeedPulse is a full-stack feedback application built with Next.js, Tailwind CSS, Express, MongoDB, and Google Gemini AI. The platform allows customers to submit product feedback while the backend enriches entries with AI-generated category, sentiment, priority, summary, and tags.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB, Mongoose
- AI: Google Gemini API (`gemini-1.5-flash`)
- DevOps: Docker, Docker Compose

## Project Structure

- `frontend/` — Next.js application
- `backend/` — Express API server
- `docker-compose.yml` — Local container composition
- `README.md` — Project documentation

## Features

- Submit feedback using a public form
- AI enrichment on each new feedback entry
- Admin dashboard with authentication
- Filtering, search, sorting, pagination
- Sentiment badges and priority scoring
- Rate limiting (5 requests/hour per IP)
- Docker-ready frontend and backend

## Setup

### Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment example:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your values. For MongoDB Atlas, use a connection string like:
   ```bash
   MONGO_URI=mongodb+srv://admin:FeedPulse123!@cluster0.yreynss.mongodb.net/?appName=Cluster0?retryWrites=true&w=majority
   ```
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment example:
   ```bash
   cp .env.example .env.local
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

## Running Locally with Docker

1. Copy root environment values into `.env` at the project root.
2. Start containers:
   ```bash
   docker compose up --build
   ```
3. Visit:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:4000`

## API Endpoints

- `POST /api/feedback` — Create feedback
- `GET /api/feedback` — List feedback with filters and pagination
- `GET /api/feedback/:id` — Get a single feedback item
- `PATCH /api/feedback/:id` — Update feedback status
- `DELETE /api/feedback/:id` — Delete feedback
- `GET /api/feedback/summary` — AI-powered feedback summary
- `POST /api/auth/login` — Admin login

## Admin Dashboard

- Login at `/dashboard/login`
- View feedback list and stats
- Filter by category and status
- Search title and summary
- Advance feedback status
- Use token-based auth for protected routes

## Environment Variables

### Backend

- `MONGO_URI` — MongoDB Atlas should use an SRV string such as:
  `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/feedpulse?retryWrites=true&w=majority`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Frontend

- `NEXT_PUBLIC_API_URL`

## Testing

### Backend

Run Jest test:
```bash
cd backend
npm test
```

## Screenshots

- `📸 Screenshot: Public feedback form`
- `📸 Screenshot: Admin dashboard with stats`
- `📸 Screenshot: AI-enriched feedback list`

---

Built with a focus on modular TypeScript architecture, reusable UI components, and secure admin workflows.
