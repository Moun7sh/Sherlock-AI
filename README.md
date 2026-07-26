# 🔍 Sherlock AI

**The Autonomous Investigation Operating System for Karnataka State Police**

> KSP Datathon 2026 · Intelligent Conversational AI for Crime Database

Officers lose hours querying siloed crime databases by hand, and the links that actually solve cases — a shared vehicle, a shared handset, one ATM withdrawal — stay invisible because they exist between records, not inside any one of them. Sherlock AI reads the whole datastore and surfaces those links on its own.

---

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone https://github.com/your-team/sherlock-ai.git
cd sherlock-ai
cp .env.example .env
docker compose up -d
```

- **Client**: http://localhost:5173
- **API**: http://localhost:3001/api/health
- **Login**: Badge `KSP-4471` / Password `sherlock2026`

### Option 2: Local Development

**Prerequisites**: Node.js 18+, PostgreSQL 16

```bash
git clone https://github.com/your-team/sherlock-ai.git
cd sherlock-ai
cp .env.example .env
# Edit .env with your PostgreSQL connection string

npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
npm -w server run db:seed
npm run dev
```

Client runs on http://localhost:5173, server on http://localhost:3001.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (React)                 │
│  Vite · TypeScript · TailwindCSS · React Query   │
└──────────────────────┬──────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────┐
│                  Server (Express)                │
│  JWT Auth · Rate Limiting · Audit Logging        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ REST API │ │WebSocket │ │ Multi-Agent       │ │
│  │ 12 route │ │ real-time│ │ Pipeline (6 AIs)  │ │
│  │ modules  │ │ discover │ │                   │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              PostgreSQL (Prisma ORM)             │
│  22 tables · FIRs · Persons · Vehicles · Phones  │
│  Evidence · CDR · Bank · Network Links · Audit   │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, React Query, Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT, bcrypt, refresh tokens |
| Real-time | WebSocket |
| AI | Multi-agent pipeline (6 specialist agents) |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Features

- **Investigation Command Center** — live operational picture with real-time autonomous discoveries
- **Case management** — full CRUD for FIRs with linked entities, timeline and evidence
- **Multi-agent analysis** — six specialist AIs (Investigation, Financial, Cyber, Behavioural, Legal, Forensic) analyse every case
- **Global search** — searches across cases, persons and vehicles simultaneously
- **Knowledge graph** — AI-inferred links between entities across unrelated cases
- **Crime analytics** — breakdowns by type, district, trend
- **Audit logging** — every action logged for evidentiary chain
- **Role-based access** — Admin, Superintendent, Inspector, Constable, Analyst
- **Real-time notifications** — WebSocket-powered autonomous discovery feed
- **Notes and collaboration** — per-case notes with officer attribution

## Database

22 tables with full relational integrity. See `prisma/schema.prisma` for the complete schema.

Key entities: User, Case, Person, Vehicle, PhoneNumber, BankAccount, Evidence, TimelineEvent, CDRRecord, BankTransaction, NetworkLink, CaseAssignment, Note, Notification, AuditLog.

## API

All endpoints require JWT authentication (except `/api/auth/login` and `/api/health`).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate with badge number |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/cases` | List cases (paginated, filterable) |
| GET | `/api/cases/:id` | Case detail with all linked entities |
| POST | `/api/cases` | Create a new FIR |
| GET | `/api/cases/stats` | Case statistics |
| GET | `/api/search?q=` | Global search |
| GET | `/api/analytics/dashboard` | Dashboard aggregates |
| GET | `/api/network/graph/:caseId` | Knowledge graph for a case |
| GET | `/api/network/discover` | AI-inferred links |
| POST | `/api/agents/analyze` | Run multi-agent pipeline |
| GET | `/api/notifications` | Officer notifications |
| GET | `/api/audit` | Audit log (admin only) |

## Seed Data

The seed contains the "Cobra crew" investigation story — 4 linked FIRs across Mysuru, Mandya, Hassan and Mangaluru, 5 suspects, 2 vehicles, 3 phones, 1 bank account, 8 AI-inferred network links, and 7 timeline events.

Login: `KSP-4471` / `sherlock2026`

## Deployment

### Zoho Catalyst
Build the client (`npm -w client run build`), upload to AppSense. Deploy the server as a Serverless Function.

### Railway / Render
Set `DATABASE_URL` and `JWT_SECRET` environment variables. The Dockerfile handles the rest.

## Team

| | |
|---|---|
| Team name | *fill in* |
| Team leader | *fill in* |
| Problem statement | Intelligent Conversational AI for Crime Database |

## License

MIT
