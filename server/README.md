# CrisisWeave Server

Node.js/Express/MongoDB API for **CrisisWeave - Smart City Dynamic Dispatch Grid**.

The server accepts uploaded JSON emergency transcript bundles, stores raw calls, executes an LLM-first multi-agent graph, creates or updates incidents, assigns Hyderabad response resources, creates dispatches, generates simulated alert records, and logs every important step.

## Agentic Backend

Each uploaded transcript runs through:

```text
Triage Agent
→ Dedup Agent
→ Priority Agent
→ Resource Agent
→ Routing Agent
→ Dispatch Agent
→ Critic Agent
```

The Critic Agent can send the graph back to resource/routing/dispatch once with refinement hints. Every agent writes memory into `agent_traces`.

Reasoning provider order:

1. Gemini API through `GEMINI_API_KEY`.
2. Groq API through `GROQ_API_KEY`.
3. Existing deterministic fallback functions if both providers fail.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- Gemini API
- Groq API

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in real credentials.

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=crisisweave_db
PORT=4000
DEDUP_RADIUS_KM=1
DEDUP_WINDOW_MINUTES=60
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.0-flash
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
SEED_ADMIN_EMAIL=admin@crisisweave.local
SEED_ADMIN_PASSWORD=change-me-admin-password
SEED_STAFF_EMAIL=staff@crisisweave.local
SEED_STAFF_PASSWORD=change-me-staff-password
```

Do not commit real API keys, passwords, or production connection strings.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access.
3. Add your IP address to Atlas Network Access.
4. Copy the connection string into `MONGODB_URI`.
5. Keep `MONGODB_DB_NAME=crisisweave_db`.
6. Run the seed script to create Hyderabad demo users/resources.

## Commands

```bash
cd server
npm install
npm run typecheck
npm run seed
npm run dev
```

Health endpoints:

- `GET /health`
- `GET /health/database`

Main API endpoints:

- `POST /api/uploads/json`
- `GET /api/dashboard/summary`
- `GET /api/incoming-calls`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `GET /api/resources`
- `GET /api/dispatches`
- `GET /api/alerts`
- `GET /api/agent-traces`
- `GET /api/system-logs`
- `GET /api/upload-batches`
- `POST /api/admin/seed`
- `POST /api/admin/reset-demo-data`

## Key Collections

### `upload_batches`

Stores uploaded JSON bundle metadata and processing counts.

### `incoming_calls`

Stores every raw transcript record, including duplicates.

### `incidents`

Stores deduplicated emergency incidents after agent reasoning.

### `resources`

Stores Hyderabad response units and availability.

### `dispatches`

Stores final dispatch decisions, distance, ETA, and decision rationale.

### `alerts`

Stores simulated organization alerts for dashboard visibility only.

### `agent_traces`

Stores graph memory: agent name, goal, input, output, reasoning, decision, critique, graph run ID, retry attempt, and related batch/call/incident references.

### `system_logs`

Stores high-level pipeline events for demo explainability.

### `users`

Stores seeded ADMIN/STAFF users for future authentication.

## Geospatial Fields

The schemas keep latitude/longitude fields and also maintain GeoJSON points:

- `incoming_calls.location`
- `incidents.location`
- `resources.currentLocation`
- `resources.baseLocation`

MongoDB `2dsphere` indexes support nearby duplicate detection and resource matching.

## Seed Data

`npm run seed` upserts:

- 5 ambulances
- 5 fire trucks
- 4 police units
- 3 rescue teams
- 2 utility teams
- 1 animal rescue unit
- one ADMIN user
- one STAFF user

All resources use realistic Hyderabad coordinates.
