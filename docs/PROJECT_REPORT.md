# CrisisWeave Project Report

## Executive Summary

CrisisWeave is a Smart City Dynamic Dispatch Grid for emergency-response hackathon demos. It ingests uploaded JSON bundles of emergency transcripts, reasons over each report using an LLM-first multi-agent graph, deduplicates repeated reports, creates incidents, scores priority, assigns Hyderabad response resources, creates dispatch records, generates simulated alerts, and exposes every decision through a dashboard.

It is not a live call system and does not send real SMS, calls, or email. Its value is explainable agentic decision-making over emergency transcript data.

## Core Idea

Traditional dispatch systems are usually rule-heavy and opaque. CrisisWeave demonstrates an AI-native alternative:

- Agents understand emergency text.
- Agents reason about duplicate reports.
- Agents score urgency.
- Agents rank resources with context.
- Agents estimate routes and ETA.
- A critic agent evaluates whether the decision is good enough.
- Every agent step is stored as trace memory for judges and admins.

## Reasoning Provider Strategy

The prototype is designed to use API keys:

1. Gemini API is the primary reasoning provider.
2. Groq API is the fallback reasoning provider.
3. Local deterministic logic is retained only as final resilience fallback.

This gives the demo real AI reasoning when keys are configured and prevents total failure if a provider is down.

## End-to-End Process

1. A judge uploads a JSON transcript bundle from the dashboard.
2. The backend creates an `upload_batches` document.
3. Each transcript becomes an `incoming_calls` document.
4. The agent graph runs once per transcript.
5. Triage Agent extracts incident type, severity, location, required resources, title, description, and keywords.
6. Dedup Agent checks candidate active incidents and decides whether this is a duplicate.
7. If duplicate, the existing incident is updated and the call is marked duplicate.
8. If new, Priority Agent assigns a score with an explanation.
9. Resource Agent ranks available Hyderabad resources by type, severity, capability, distance, and context.
10. Routing Agent estimates distance and ETA.
11. Dispatch Agent finalizes assignments and creates dispatch records.
12. Critic Agent evaluates the whole decision.
13. If the critic rejects the decision, the graph retries resource/routing/dispatch once with refinement hints.
14. Alert service creates simulated alert records.
15. `system_logs` records high-level pipeline events.
16. `agent_traces` records agent input, output, reasoning, decision, critique, graph run ID, and retry attempt.
17. The dashboard displays operational data and explainable agent traces.

## Agents

### Triage Agent

Goal: understand a raw emergency transcript.

Input: transcript text plus optional location metadata.

Output: incident type, severity, title, description, location, required resources, keywords, reasoning, decision.

Primary reasoning: Gemini/Groq structured JSON extraction.

Fallback: local keyword-based triage rules.

### Dedup Agent

Goal: decide whether a new report matches an active incident.

Input: structured report, candidate active incidents, deterministic proximity hint.

Output: duplicate flag, matched incident ID, matched incident code, confidence score, reasoning, decision.

Primary reasoning: Gemini/Groq semantic comparison.

Fallback: same type, nearby location, recent time window, active status.

### Priority Agent

Goal: assign an operational priority score.

Input: severity, incident type, duplicate count, keywords, required resources.

Output: score, explanation, reasoning, decision.

Primary reasoning: Gemini/Groq priority judgment.

Fallback: weighted score from severity, type, duplicates, keywords, and resource count.

### Resource Agent

Goal: rank response resources.

Input: incident details, available resources, resource capabilities, distance, severity, refinement hints.

Output: ranked resources by type, missing resource types, reasoning, decision.

Primary reasoning: Gemini/Groq ranking over safe candidate resources.

Fallback: deterministic match score using type, status, capability, severity, and distance.

### Routing Agent

Goal: estimate travel impact.

Input: selected resource candidates.

Output: route summaries, distance, ETA, reasoning, decision.

Primary reasoning: Gemini/Groq explanation of computed route estimates.

Fallback: haversine distance and resource-type speed.

### Dispatch Agent

Goal: finalize assignments.

Input: ranked resources and route estimates.

Output: final dispatch decisions, missing resource types, reasoning, decision.

Primary reasoning: Gemini/Groq selection from validated ranked candidates.

Fallback: top-ranked available resource per required type.

### Critic Agent

Goal: evaluate the full decision and trigger refinement if needed.

Input: severity, required resource types, dispatches, missing resources, retry attempt.

Output: optimal flag, improvement suggestions, refinement hints, reasoning, decision.

Primary reasoning: Gemini/Groq critique.

Fallback: deterministic checks for missing resources and slow critical ETAs.

## Database Collections

- `upload_batches`: uploaded JSON bundle metadata and processing counts.
- `incoming_calls`: every raw transcript record, including duplicates.
- `incidents`: unique deduplicated emergency incidents.
- `resources`: Hyderabad response units and current status.
- `dispatches`: final dispatch assignments, route estimates, and rationale.
- `alerts`: simulated alert records for dashboard visibility.
- `system_logs`: high-level pipeline events.
- `agent_traces`: detailed agent memory, reasoning, decisions, critiques, provider notes, and retry attempts.
- `users`: seeded demo users for future authentication.

## Backend File Map

### `server/src/app.ts`

Creates the Express app, applies middleware, exposes health routes, and mounts `/api`.

### `server/src/server.ts`

Loads env variables, connects to MongoDB Atlas, and starts the server.

### `server/src/config/database.ts`

Central MongoDB connection utility. Uses `MONGODB_URI` and `MONGODB_DB_NAME`.

### `server/src/routes/api.routes.ts`

Defines upload, dashboard, list, detail, agent trace, seed, and reset routes.

### `server/src/controllers/*.ts`

Thin request/response layer. Business decisions stay in services and agents.

### `server/src/services/uploadPipeline.service.ts`

Creates upload batches and incoming calls, then invokes `executeGraph` for each transcript.

### `server/src/graph/agentGraph.ts`

Central graph orchestrator. It executes agents in order, handles duplicate/new incident branches, runs critic retry, creates alerts, and writes logs.

### `server/src/agents/baseAgent.ts`

Base class that standardizes agent name, goal, reasoning, decision, critique, and trace persistence.

### `server/src/agents/*.ts`

Individual agent implementations. Each agent uses Gemini first, Groq second, and local fallback last.

### `server/src/services/llm.service.ts`

LLM provider chain. Builds strict JSON prompts, calls Gemini/Groq, parses model responses, and falls back safely.

### `server/src/services/triage.service.ts`

Fallback transcript classification rules.

### `server/src/services/deduplication.service.ts`

Fallback duplicate detection using incident type, time window, status, and geospatial radius.

### `server/src/services/priority.service.ts`

Fallback priority scoring.

### `server/src/services/dispatch.service.ts`

Legacy deterministic dispatch logic retained as reference/fallback. The active path uses Dispatch Agent.

### `server/src/services/alert.service.ts`

Creates simulated alert records based on incident type and severity.

### `server/src/services/dashboard.service.ts`

Aggregates dashboard summary metrics.

### `server/src/services/query.service.ts`

Reusable pagination and filtering for list APIs.

### `server/src/models/*.ts`

Mongoose schemas for all MongoDB collections.

### `server/src/utils/*.ts`

Enums, geospatial helpers, code generation, distance, and ETA utilities.

## Frontend File Map

### `client/app/page.tsx`

Main dashboard overview with metrics, seed/reset controls, incident groupings, and recent logs.

### `client/app/upload/page.tsx`

Upload experience for JSON files or pasted JSON.

### `client/app/agent-traces/page.tsx`

Shows agent step, agent name, goal, decision, reasoning, critique, retry attempt, and timestamp.

### `client/app/incidents/[id]/page.tsx`

Incident detail page with linked transcripts, dispatch decisions, alerts, and agent trace timeline.

### `client/app/*/page.tsx`

Collection-specific views for incoming calls, incidents, resources, dispatches, alerts, system logs, upload batches, and data viewer.

### `client/components/AppShell.tsx`

Navigation shell.

### `client/components/DataTable.tsx`

Reusable table renderer.

### `client/components/Badge.tsx`

Reusable status/severity/type badge.

### `client/components/ListPage.tsx`

Reusable list-page loader and table wrapper.

### `client/lib/api.ts`

Frontend API helper functions.

### `client/lib/format.ts`

Date and ID formatting helpers.

## Demo Script

1. Start backend and frontend.
2. Confirm Gemini/Groq API keys are present in backend env.
3. Seed resources.
4. Upload `data/samples/hyderabad-emergency-bundle.json`.
5. Open Dashboard Overview.
6. Open Agent Traces.
7. Open one incident detail page.
8. Explain that each visible trace is a persisted agent memory record from the graph.

## Why The Project Fits The Hackathon Theme

- It is practical: emergency transcript bundles become operational dispatch decisions.
- It is explainable: every agent decision is visible.
- It is resilient: Gemini, then Groq, then local fallback.
- It is agentic: the system plans, executes, critiques, and refines.
- It is demo-ready: seed, upload, inspect dashboard.
