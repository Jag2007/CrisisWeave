# CrisisWeave System Architecture

## High-Level Architecture

```mermaid
flowchart LR
  Judge["Judge / User"] --> Client["Next.js + Tailwind Dashboard"]
  Client --> UploadAPI["POST /api/uploads/json"]
  Client --> ReadAPIs["Dashboard + Admin Data APIs"]

  UploadAPI --> Batch["upload_batches"]
  UploadAPI --> Calls["incoming_calls"]
  Calls --> Graph["Agentic Execution Graph"]

  subgraph Graph["Goal → Plan → Execute → Evaluate → Refine"]
    Triage["Triage Agent"]
    Dedup["Dedup Agent"]
    Priority["Priority Agent"]
    Resource["Resource Agent"]
    Routing["Routing Agent"]
    Dispatch["Dispatch Agent"]
    Critic["Critic Agent"]
    Triage --> Dedup --> Priority --> Resource --> Routing --> Dispatch --> Critic
    Critic -- "not optimal, retry limit not reached" --> Resource
  end

  subgraph Reasoning["LLM Reasoning Provider Chain"]
    Gemini["Gemini API Primary"]
    Groq["Groq API Fallback"]
    Local["Local Deterministic Safety Fallback"]
    Gemini --> Groq --> Local
  end

  Graph --> Reasoning
  Graph --> Incidents["incidents"]
  Graph --> Resources["resources"]
  Graph --> Dispatches["dispatches"]
  Graph --> Alerts["alerts"]
  Graph --> Logs["system_logs"]
  Graph --> Traces["agent_traces"]

  ReadAPIs --> Batch
  ReadAPIs --> Calls
  ReadAPIs --> Incidents
  ReadAPIs --> Resources
  ReadAPIs --> Dispatches
  ReadAPIs --> Alerts
  ReadAPIs --> Logs
  ReadAPIs --> Traces
```

## Agent Graph Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant API as Upload API
  participant G as Agent Graph
  participant Gemini as Gemini API
  participant Groq as Groq API
  participant Fallback as Local Fallback
  participant DB as MongoDB Atlas

  U->>API: Upload JSON bundle
  API->>DB: Create upload batch
  loop Each transcript
    API->>DB: Store incoming call
    API->>G: executeGraph(call)
    G->>Gemini: Ask agent for structured reasoning
    alt Gemini unavailable/fails
      G->>Groq: Ask same agent for structured reasoning
    end
    alt Groq unavailable/fails
      G->>Fallback: Run deterministic safety logic
    end
    G->>DB: Save agent trace
    G->>DB: Save extracted data / incident / dispatch / alert changes
    G->>DB: Save system log
  end
  API->>DB: Mark batch completed
```

## Decision Flow

```mermaid
flowchart TD
  Start["Incoming transcript"] --> Triage["Triage Agent extracts emergency structure"]
  Triage --> Dedup["Dedup Agent compares active incidents"]
  Dedup -->|duplicate| Update["Update existing incident + duplicate count"]
  Dedup -->|new| Priority["Priority Agent scores urgency"]
  Priority --> Resource["Resource Agent ranks available resources"]
  Resource --> Routing["Routing Agent estimates distance + ETA"]
  Routing --> Dispatch["Dispatch Agent creates assignments"]
  Dispatch --> Critic["Critic Agent evaluates decision"]
  Critic -->|optimal| Alerts["Create simulated alerts"]
  Critic -->|not optimal| Refine["Apply refinement hints"]
  Refine --> Resource
  Alerts --> Trace["Dashboard reads system_logs + agent_traces"]
  Update --> Trace
```

## Reasoning Priority

Every agent follows the same provider strategy:

1. Gemini API using `GEMINI_API_KEY`.
2. Groq API using `GROQ_API_KEY`.
3. Local deterministic fallback logic only if providers fail.

The project is intended to demonstrate API-key powered agentic reasoning while staying robust during demos.
