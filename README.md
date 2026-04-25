# CrisisWeave - Smart City Dynamic Dispatch Grid

CrisisWeave is an AI hackathon prototype that turns uploaded emergency transcript JSON bundles into deduplicated incidents, priority scores, dispatch decisions, simulated alerts, and explainable agent traces.

This is not a real phone-call or alert-delivery system. Emergency inputs are uploaded JSON records, and alerts are simulated database records for dashboard visibility.

## What Makes It Agentic

The backend is built around an agentic execution graph:

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

Each agent records:

- what it received
- what it decided
- why it decided it
- which reasoning provider was used
- optional critique and refinement suggestions

Reasoning is powered by API keys:

1. Groq API is primary.
2. OpenAI API is fallback.
3. Existing deterministic logic is final resilience fallback only.

## Project Structure

```text
server/   Node.js + Express + TypeScript + MongoDB/Mongoose API
client/   Next.js + Tailwind dashboard
data/     Hyderabad sample JSON emergency transcript bundle
docs/     Architecture diagram and full project report
```

Detailed docs:

- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Project report](docs/PROJECT_REPORT.md)

## Environment Setup

Backend env:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=crisisweave_db
PORT=4000
DEDUP_RADIUS_KM=1
DEDUP_WINDOW_MINUTES=60
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o-mini
```

Frontend env:

```bash
BACKEND_API_URL=http://localhost:4000
# Optional direct-browser API mode:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

On Render, set `BACKEND_API_URL` on the frontend service to your deployed Express backend URL, for example `https://crisisweave-backend.onrender.com`. The frontend calls `/api/...`, and Next proxies those requests to `${BACKEND_API_URL}/api/...`.

Do not commit real API keys, passwords, or production connection strings.

## Run Backend

```bash
cd server
npm install
npm run seed
npm run dev
```

## Run Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Flow For Judges

1. Start backend and frontend.
2. Seed Hyderabad resources from the dashboard or `POST /api/admin/seed`.
3. Go to Upload JSON.
4. Upload `data/samples/hyderabad-emergency-bundle.json`.
5. Open Dashboard Overview to see totals, incidents, resources, dispatches, alerts, and trace counts.
6. Open Agent Traces to show step-by-step AI reasoning.
7. Open an Incident Detail page to show linked transcripts, dispatch decisions, alerts, and agent trace memory.

The sample includes fire duplicate reports, medical emergency, accident, flood, building collapse, home intrusion, missing pet, power failure, and gas leak.

## Pipeline

```text
JSON upload
→ upload_batches
→ incoming_calls
→ agentic execution graph
→ LLM-first triage/dedup/priority/resource/routing/dispatch/critic
→ incident create/update
→ dispatches
→ simulated alerts
→ system_logs
→ agent_traces
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

List endpoints support `page`, `limit`, `status`, `severity`, `incidentType`, `resourceType`, `batchId`, `incidentId`, `incomingCallId`, `graphRunId`, and `agentName`.

## Collections

- `upload_batches`: uploaded JSON bundle metadata
- `incoming_calls`: raw transcript records, including duplicates
- `incidents`: deduplicated emergency incidents
- `resources`: available/busy Hyderabad response units
- `dispatches`: dispatch decisions and ETA outputs
- `alerts`: simulated alert records
- `agent_traces`: every agent input, output, reasoning, decision, provider, critique, and retry attempt
- `system_logs`: explainable pipeline audit trail
- `users`: basic admin/staff seed users for future auth

## Notes

- The prototype is designed to use Groq/OpenAI API keys for agent reasoning.
- Local deterministic logic is retained only to keep the demo stable if providers fail.
- The dashboard uses polling for live progress and live ETA display; WebSockets are not required for this prototype.
- No real SMS/email/phone alerts are sent.
- Authentication is intentionally not implemented yet, per current scope.
- MongoDB geospatial fields use GeoJSON points with `2dsphere` indexes.
