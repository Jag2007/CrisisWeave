# CrisisWeave - Smart City Dynamic Dispatch Grid

CrisisWeave is a hackathon prototype that turns uploaded emergency transcript JSON bundles into deduplicated incidents, priority scores, resource dispatches, simulated alerts, and dashboard-visible system logs.

This is not a real phone-call or alerting system. Inputs are uploaded JSON files, and alerts are database records for demo visibility.

The backend now runs as an agentic execution graph:

```text
Goal
→ Plan
→ Triage Agent
→ Dedup Agent
→ Priority Agent
→ Resource Agent
→ Routing Agent
→ Dispatch Agent
→ Critic Agent
→ Refine resource/dispatch if needed
→ Persist trace memory
```

## Project Structure

```text
server/   Node.js + Express + TypeScript + MongoDB/Mongoose API
client/   Next.js + Tailwind dashboard
data/     Sample JSON emergency transcript bundles
docs/     Architecture diagram and project report
```

Detailed docs:

- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Project report](docs/PROJECT_REPORT.md)

## Run Backend

```bash
cd server
npm install
npm run seed
npm run dev
```

Backend env:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=crisisweave_db
PORT=4000
DEDUP_RADIUS_KM=1
DEDUP_WINDOW_MINUTES=60
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

## Run Frontend

```bash
cd client
npm install
npm run dev
```

Frontend env:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Open `http://localhost:3000`.

## Demo Flow For Judges

1. Start the backend and frontend.
2. Open the dashboard and click `Seed`.
3. Go to Upload JSON.
4. Upload `data/samples/hyderabad-emergency-bundle.json`.
5. Review incidents, dispatches, alerts, and system logs.

The sample includes fire duplicate reports, medical emergency, accident, flood, building collapse, home intrusion, missing pet, power failure, and gas leak.

## Pipeline

```text
JSON upload
→ upload_batches
→ incoming_calls
→ rule-based triage
→ deduplication
→ incidents
→ priority scoring
→ resource matching
→ dispatches
→ simulated alerts
→ system_logs
→ dashboard APIs
```

## API List

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

List endpoints support `page`, `limit`, `status`, `severity`, `incidentType`, `resourceType`, and `batchId`.

## Collections

- `upload_batches`: uploaded JSON bundle metadata
- `incoming_calls`: raw transcript records, including duplicates
- `incidents`: deduplicated emergency incidents
- `resources`: available/busy Hyderabad response units
- `dispatches`: dispatch decisions and ETA outputs
- `alerts`: simulated alert records
- `agent_traces`: every agent input, output, reasoning, decision, and critique
- `system_logs`: explainable pipeline audit trail
- `users`: basic admin/staff seed users for future auth

## Notes

- The prototype works without AI API keys.
- Agent reasoning is Gemini-first, Groq-second, and structured local fallback if both providers are unavailable or fail.
- No real SMS/email/phone alerts are sent.
- Authentication is intentionally not implemented yet, per current scope.
- MongoDB geospatial fields use GeoJSON points with `2dsphere` indexes.
