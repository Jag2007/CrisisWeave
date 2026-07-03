"use client";

import { Badge, Code, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate, humanize } from "../../lib/format";

export default function ResourcesPage() {
  return (
    <ListPage
      title="Resources"
      description="The Hyderabad response fleet the Resource agent picks from. A unit turns busy once it is dispatched."
      endpoint="/resources"
      filter={{ param: "resourceType", options: ["AMBULANCE", "FIRE_TRUCK", "POLICE", "RESCUE_TEAM", "UTILITY_TEAM", "ANIMAL_RESCUE"] }}
      empty="No units in the fleet"
      emptyHint="Use “Seed units” on the overview to create the Hyderabad fleet."
      columns={[
        { key: "code", label: "Unit", render: (row: any) => <Code>{row.resourceCode}</Code> },
        { key: "name", label: "Name", render: (row: any) => <span className="font-medium">{row.name}</span> },
        { key: "type", label: "Type", render: (row: any) => humanize(row.resourceType) },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "assigned", label: "Assigned to", render: (row: any) => <IncidentLink id={row.assignedIncidentId} /> },
        { key: "base", label: "Base", render: (row: any) => row.baseLocationText || "-" },
        {
          key: "capabilities",
          label: "Capabilities",
          render: (row: any) => <span className="text-xs text-muted">{(row.capabilities || []).map(humanize).join(", ") || "-"}</span>
        },
        { key: "updated", label: "Updated", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.lastStatusUpdatedAt)}</span> }
      ]}
    />
  );
}
