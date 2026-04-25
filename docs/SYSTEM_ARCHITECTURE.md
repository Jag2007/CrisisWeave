# CrisisWeave System Architecture

## High-Level Architecture

```mermaid
flowchart LR
  Judge["Judge / User"] --> Client["Next.js + Tailwind Dashboard"]
  Client --> UploadAPI["POST /api/uploads/json"]
  Client --> ReadAPIs["Dashboard + Data APIs"]
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

  subgraph Reasoning["Reasoning Provider Chain"]
    Gemini["Gemini API Primary"]
    Groq["Groq API Fallback"]
    Local["Structured Local Fallback"]
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
  participant L as Gemini/Groq/Fallback
  participant DB as MongoDB Atlas

  U->>API: Upload JSON bundle
  API->>DB: Create upload batch
  loop Each transcript
    API->>DB: Store incoming call
    API->>G: executeGraph(call)
    G->>L: Triage Agent reasoning
    G->>DB: Save extractedData + agent trace
    G->>L: Dedup Agent reasoning
    alt Duplicate
      G->>DB: Update existing incident
    else New incident
      G->>L: Priority Agent reasoning
      G->>DB: Create incident
      G->>L: Resource Agent ranking
      G->>L: Routing Agent ETA reasoning
      G->>L: Dispatch Agent final decision
      G->>DB: Create dispatches + mark resources busy
      G->>L: Critic Agent evaluation
      alt Not optimal and retry available
        G->>L: Re-run resource/routing/dispatch with refinement hints
      end
      G->>DB: Create simulated alerts
    end
    G->>DB: Store system logs and agent traces
  end
  API->>DB: Mark batch completed
```

## Reasoning Priority

Every agent follows the same provider strategy:

1. Gemini API, using `GEMINI_API_KEY`.
2. Groq API, using `GROQ_API_KEY`.
3. Local structured fallback logic already present in the project.

This keeps the demo intelligent when keys are present and stable when network/API access is unavailable.
