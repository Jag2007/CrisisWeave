# CrisisWeave Project Report

## Project Purpose

CrisisWeave is a Smart City Dynamic Dispatch Grid for hackathon demos. It is not a real phone-call system. Emergency reports come from uploaded JSON bundles containing multiple transcript records. The backend stores those raw records, runs an agentic AI decision graph, creates or updates incidents, assigns city resources, creates dispatch records, generates simulated alerts, and exposes every step through a dashboard.

## End-to-End Process

1. A judge uploads a JSON bundle from the dashboard.
2. The backend creates an `upload_batches` document.
3. Each transcript becomes an `incoming_calls` document.
4. The agent graph runs for each call.
5. The Triage Agent understands the transcript and extracts incident type, severity, location, required resources, title, description, and keywords.
6. The Dedup Agent checks whether the call belongs to an active nearby incident.
7. If duplicate, the existing incident is updated and the call is marked duplicate.
8. If new, the Priority Agent assigns a score and explanation.
9. The Resource Agent ranks available resources using type, severity, distance, capability, and context.
10. The Routing Agent calculates distance and ETA.
11. The Dispatch Agent finalizes assignments and writes dispatch records.
12. The Critic Agent evaluates the decision. If not optimal, the graph retries resource/routing/dispatch once with refinement hints.
13. Simulated alerts are created for hospitals, fire stations, police, rescue, utility, admin, or animal rescue.
14. `system_logs` records pipeline events.
15. `agent_traces` records agent input, output, reasoning, decision, and critique.
16. The dashboard shows operational data and the full agent trace.

## Agentic Design

The old deterministic services are now fallback tools. The primary decision layer is agentic:

- Gemini is the first reasoning provider.
- Groq is the second provider.
- Existing deterministic functions are final fallback.

This means the project can demonstrate AI reasoning when API keys are available while remaining demo-stable when keys are missing.

## Agents

### Triage Agent

Goal: understand raw transcript text.

Input: transcript and location metadata.

Output: incident type, severity, title, description, location, required resources, keywords, reasoning, decision.

### Dedup Agent

Goal: decide whether a report matches an existing active incident.

Input: structured report, candidate incidents, deterministic proximity hint.

Output: duplicate flag, matched incident ID, confidence score, reasoning, decision.

### Priority Agent

Goal: assign an operational priority score.

Input: severity, incident type, duplicate count, keywords, required resources.

Output: priority score, explanation, reasoning, decision.

### Resource Agent

Goal: rank available resources.

Input: incident details, available resources, capabilities, distance, refinement hints.

Output: ranked resources by type, missing resource types, reasoning, decision.

### Routing Agent

Goal: estimate travel distance and ETA.

Input: selected resource candidates.

Output: routes, distance, ETA, reasoning, decision.

### Dispatch Agent

Goal: finalize assignments.

Input: ranked resources and route estimates.

Output: dispatch records, missing resource types, reasoning, decision.

### Critic Agent

Goal: evaluate the whole decision.

Input: severity, required resource types, dispatches, missing resources, retry attempt.

Output: optimal/not optimal, improvement suggestions, refinement hints, reasoning, decision.

## Database Collections

- `upload_batches`: one row per uploaded JSON bundle.
- `incoming_calls`: every raw transcript record, including duplicates.
- `incidents`: unique deduplicated emergencies.
- `resources`: Hyderabad emergency response units.
- `dispatches`: dispatch decisions and route estimates.
- `alerts`: simulated alert records for dashboard visibility.
- `system_logs`: high-level pipeline log events.
- `agent_traces`: detailed agent memory and reasoning.
- `users`: seeded admin/staff users for future auth.

## Important Backend Files

### `server/src/app.ts`

Creates the Express app, applies security/middleware, exposes health routes, and mounts `/api`.

### `server/src/server.ts`

Loads env, connects to MongoDB, starts the Express server.

### `server/src/config/database.ts`

Central MongoDB Atlas connection utility using `MONGODB_URI` and `MONGODB_DB_NAME`.

### `server/src/routes/api.routes.ts`

Defines all backend API routes: uploads, dashboard, list endpoints, incident detail, agent traces, seed, reset.

### `server/src/controllers/*.ts`

Thin HTTP controllers. They parse requests, call services, and return responses.

### `server/src/services/uploadPipeline.service.ts`

Handles JSON bundle upload processing. Creates batch/call records and invokes `executeGraph` for each transcript.

### `server/src/graph/agentGraph.ts`

The central agentic orchestrator. It runs:

`Triage → Dedup → Priority → Resource → Routing → Dispatch → Critic`

It also handles duplicate updates, incident creation, critic retry, alerts, and logs.

### `server/src/agents/baseAgent.ts`

Base class for all agents. It standardizes name, goal, input, output, reasoning, decision, critique, and trace persistence.

### `server/src/agents/*.ts`

Each file implements one agent. Agents call the LLM provider chain first and fall back to deterministic logic only if needed.

### `server/src/services/llm.service.ts`

Gemini → Groq → local fallback provider chain. It asks models for strict JSON and parses responses safely.

### `server/src/services/triage.service.ts`

Local fallback rules for transcript extraction.

### `server/src/services/deduplication.service.ts`

Local fallback duplicate detection using incident type, time window, and geospatial radius.

### `server/src/services/priority.service.ts`

Local fallback priority scoring.

### `server/src/services/dispatch.service.ts`

Legacy deterministic dispatch service retained as fallback/reference. The active graph uses Dispatch Agent.

### `server/src/services/alert.service.ts`

Creates simulated alert records after incident dispatch decisions.

### `server/src/models/*.ts`

Mongoose schemas, references, enums, timestamps, and indexes.

### `server/src/utils/*.ts`

Shared enums, code generation, geospatial helpers, and distance/ETA utilities.

## Important Frontend Files

### `client/app/page.tsx`

Main dashboard overview with metrics, incident groupings, logs, seed/reset, and upload shortcut.

### `client/app/upload/page.tsx`

JSON upload UI supporting file upload or pasted JSON.

### `client/app/agent-traces/page.tsx`

Shows all agent reasoning steps, decisions, critiques, retry attempts, and graph run IDs.

### `client/app/incidents/[id]/page.tsx`

Incident detail page. Shows linked transcripts, dispatch decisions, alerts, and agent execution trace.

### `client/components/AppShell.tsx`

Application shell and navigation.

### `client/components/DataTable.tsx`

Reusable table component.

### `client/lib/api.ts`

Frontend API helper for GET/POST requests.

## Demo Script

1. Start backend.
2. Start frontend.
3. Click Seed or call `/api/admin/seed`.
4. Upload `data/samples/hyderabad-emergency-bundle.json`.
5. Open Agent Traces.
6. Open an incident detail page.
7. Show how each agent reasoned, how the critic evaluated the dispatch, and how the final incident/dispatch/alert records were produced.

## Why This Looks Agentic

- Each stage is an agent with a goal.
- Each agent records reasoning and decisions.
- Gemini/Groq can provide reasoning and structured outputs.
- The critic can reject a decision and trigger a refinement pass.
- The dashboard exposes the agent memory, not just final database rows.
