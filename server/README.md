# CrisisWeave Server

Node.js/Express/MongoDB API for **CrisisWeave - Smart City Dynamic Dispatch Grid**.

This backend accepts uploaded JSON transcript bundles, stores raw calls, runs deterministic triage, deduplicates nearby active incidents, scores priority, assigns Hyderabad resources, creates dispatches, generates simulated alert records, and logs every pipeline step.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your Atlas credentials.

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=crisisweave_db
PORT=4000
DEDUP_RADIUS_KM=1
DEDUP_WINDOW_MINUTES=60
SEED_ADMIN_EMAIL=admin@crisisweave.local
SEED_ADMIN_PASSWORD=change-me-admin-password
SEED_STAFF_EMAIL=staff@crisisweave.local
SEED_STAFF_PASSWORD=change-me-staff-password
```

Do not commit real passwords or production connection strings.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access.
3. Add your IP address to Atlas Network Access.
4. Copy the connection string into `MONGODB_URI`.
5. Keep `MONGODB_DB_NAME=crisisweave_db`.
6. Run the seed script to create demo users/resources.

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
- `GET /api/system-logs`
- `GET /api/upload-batches`
- `POST /api/admin/seed`
- `POST /api/admin/reset-demo-data`

## Collections

### `upload_batches`

Stores one document per uploaded JSON transcript bundle. Tracks bundle-level progress with counts and status.

Indexes: default `_id`.

### `incoming_calls`

Stores every raw transcript record from uploaded JSON bundles, including duplicates. Later AI services can populate `extractedData`, link calls to incidents, and mark duplicates.

Indexes:

- `batchId`
- `processingStatus`
- `linkedIncidentId`
- `callDate`
- `location` 2dsphere

### `incidents`

Stores deduplicated emergency incidents. These documents become the main operational objects for prioritization, dispatch, alerts, dashboards, and admin review.

Indexes:

- unique `incidentCode`
- `incidentType`
- `severity`
- `status`
- `priorityScore`
- `createdAt`
- `location` 2dsphere

### `resources`

Stores dispatchable response units such as ambulances, fire trucks, police, rescue teams, utility teams, and animal rescue.

Indexes:

- unique `resourceCode`
- `resourceType`
- `status`
- `assignedIncidentId`
- `currentLocation` 2dsphere

### `dispatches`

Stores assignment decisions and lightweight routing outputs for demo and auditability.

Indexes:

- unique `dispatchCode`
- `incidentId`
- `resourceId`
- `status`
- `dispatchedAt`

### `alerts`

Stores simulated alert records for nearby organizations. These records are for dashboard visibility only; no SMS, phone, or email delivery is performed.

Indexes:

- unique `alertCode`
- `incidentId`
- `alertType`
- `status`
- `generatedAt`

### `system_logs`

Stores human-readable pipeline events for demos, audits, and debugging.

Indexes:

- `eventType`
- `batchId`
- `incidentId`
- `resourceId`
- `createdAt`

### `users`

Stores basic ADMIN/STAFF users for demo access control and upload ownership.

Indexes:

- unique `email`
- `role`
- `status`

## Geospatial Fields

The schemas keep the requested latitude/longitude fields and also maintain GeoJSON fields for MongoDB geospatial queries:

- `incoming_calls.location`
- `incidents.location`
- `resources.currentLocation`
- `resources.baseLocation`

MongoDB requires GeoJSON points for reliable `2dsphere` indexes. Coordinates are stored as `[longitude, latitude]`.

## Pipeline Support

The database supports the intended CrisisWeave flow:

1. Store uploaded bundle metadata in `upload_batches`.
2. Store each transcript record in `incoming_calls`.
3. Later AI extraction writes structured data to `incoming_calls.extractedData`.
4. Deduplication links calls to existing or new `incidents`.
5. Priority services update incident severity and `priorityScore`.
6. Resource matching queries `resources` by type, status, availability, and distance.
7. Dispatch services create `dispatches` and update incident/resource relationships.
8. Alert services create simulated `alerts`.
9. Every step writes explanatory events to `system_logs`.
10. Dashboard/admin views can read each collection directly with clear relationships.

## Seed Data

`npm run seed` upserts:

- Demo emergency resources across ambulance, fire, police, rescue, utility, and animal rescue types.
- One ADMIN user.
- One STAFF user.

Change the seed emails and passwords through environment variables before using the demo with other people.
