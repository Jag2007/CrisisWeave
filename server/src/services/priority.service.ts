import type { IncidentType, ResourceType, Severity } from "../utils/enums";

const severityBase: Record<Severity, number> = {
  CRITICAL: 90,
  HIGH: 72,
  MEDIUM: 45,
  LOW: 18
};

const typeBoost: Partial<Record<IncidentType, number>> = {
  BUILDING_COLLAPSE: 6,
  FIRE: 5,
  GAS_LEAK: 5,
  ACCIDENT: 4,
  MEDICAL: 4,
  CRIME: 3,
  HOME_INTRUSION: 3,
  FLOOD: 3
};

const keywordBoosts: Record<string, number> = {
  trapped: 4,
  child: 4,
  elderly: 3,
  explosion: 5,
  unconscious: 4,
  "not breathing": 5,
  "many injured": 5
};

export function calculatePriorityScore(input: {
  severity: Severity;
  incidentType: IncidentType;
  duplicateCount: number;
  keywords: string[];
  requiredResourceTypes: ResourceType[];
}): number {
  const keywordScore = input.keywords.reduce((sum, keyword) => sum + (keywordBoosts[keyword] || 0), 0);
  const score =
    severityBase[input.severity] +
    (typeBoost[input.incidentType] || 0) +
    Math.min(input.duplicateCount * 2, 8) +
    Math.min(input.requiredResourceTypes.length * 2, 6) +
    keywordScore;

  const maxBySeverity: Record<Severity, number> = {
    CRITICAL: 100,
    HIGH: 89,
    MEDIUM: 69,
    LOW: 39
  };

  return Math.min(maxBySeverity[input.severity], Math.max(10, Math.round(score)));
}
