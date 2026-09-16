# Airth Mini Job Queue Dashboard

A beginner-friendly full-stack job queue dashboard built with:

- React + Vite + JavaScript
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS via CDN-style utility classes are not used; the frontend includes simple CSS for portability.

## Features

- Create jobs
- View all jobs
- Filter jobs by status
- Display counts for every status
- Update job status using valid transitions only
- Delete jobs
- Loading, empty, and API error states
- Backend validation
- Atomic status transitions to handle concurrent requests

## Allowed status transitions

```text
pending -> running -> completed
                    -> failed
```

A completed or failed job cannot be moved back to running.

## Project structure

```text
airth-job-queue/
├── backend/
└── frontend/
```

## Requirements

- Node.js 18+
- npm
- PostgreSQL database

## Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

Run Prisma migration:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run start:dev
```

Backend URL: `http://localhost:3000`

## Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:3000"
```

Start the frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## API endpoints

### Create a job

`POST /jobs`

```json
{
  "title": "Send welcome email",
  "type": "email"
}
```

### Get jobs

`GET /jobs`

Optional filter:

`GET /jobs?status=pending`

### Update status

`PATCH /jobs/:id/status`

```json
{
  "status": "running"
}
```

### Delete job

`DELETE /jobs/:id`

## Concurrency decision

The backend does not trust the frontend to enforce status transitions.

For `pending -> running`, the service uses an atomic conditional update:

```text
UPDATE job
SET status = 'running'
WHERE id = requested_id
AND status = 'pending'
```

If two browser tabs attempt the same transition, only the request that updates one row succeeds. The other receives a conflict response.

The same transition rules are also checked on the backend, so direct API callers cannot bypass the rules.

## Trade-offs

- Authentication is not included because it was not required.
- There is no background worker; jobs are manually moved through statuses.
- Pagination is not included because the assignment is intentionally small.
- PostgreSQL is used for persistent deployment-friendly storage.

## Production improvements

- Add authentication and role-based permissions.
- Add a job status history/audit table.
- Add pagination and server-side filtering.
- Add automated tests and CI.
- Add a real worker system such as BullMQ with Redis.
