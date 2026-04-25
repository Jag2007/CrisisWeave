import type { IncidentType, ResourceType, Severity } from "../utils/enums";

export interface TriageResult {
  incidentType: IncidentType;
  severity: Severity;
  requiredResourceTypes: ResourceType[];
  title: string;
  description: string;
  keywords: string[];
}

const rules: Array<{
  terms: string[];
  incidentType: IncidentType;
  resources: ResourceType[];
  title: string;
}> = [
  { terms: ["gas leak", "gas smell"], incidentType: "GAS_LEAK", resources: ["FIRE_TRUCK", "UTILITY_TEAM"], title: "Gas Leak Reported" },
  { terms: ["fire", "smoke", "burning", "flames"], incidentType: "FIRE", resources: ["FIRE_TRUCK"], title: "Fire Emergency" },
  { terms: ["collapse", "building fell", "building collapse", "trapped", "rubble"], incidentType: "BUILDING_COLLAPSE", resources: ["RESCUE_TEAM", "AMBULANCE"], title: "Building Collapse" },
  { terms: ["accident", "crash", "collision", "hit by"], incidentType: "ACCIDENT", resources: ["AMBULANCE", "POLICE"], title: "Traffic Accident" },
  { terms: ["injured", "heart attack", "unconscious", "bleeding", "not breathing"], incidentType: "MEDICAL", resources: ["AMBULANCE"], title: "Medical Emergency" },
  { terms: ["flood", "water stuck", "water is rising", "waterlogging", "stranded", "stuck inside"], incidentType: "FLOOD", resources: ["RESCUE_TEAM"], title: "Flood Rescue Request" },
  { terms: ["home intrusion", "intruder"], incidentType: "HOME_INTRUSION", resources: ["POLICE"], title: "Home Intrusion" },
  { terms: ["thief", "burglary", "robbery", "crime"], incidentType: "CRIME", resources: ["POLICE"], title: "Crime Reported" },
  { terms: ["missing dog", "missing pet", "lost dog", "lost pet"], incidentType: "MISSING_PET", resources: ["ANIMAL_RESCUE"], title: "Missing Pet" },
  { terms: ["electricity", "power outage", "power failure", "transformer"], incidentType: "POWER_FAILURE", resources: ["UTILITY_TEAM"], title: "Power Failure" }
];

const criticalTerms = ["trapped", "unconscious", "not breathing", "building collapse", "explosion", "many injured", "child trapped"];
const highTerms = ["fire", "bleeding", "accident", "crime in progress", "gas leak", "robbery", "flames"];
const lowTerms = ["missing pet", "missing dog", "small issue", "non-critical", "lost pet"];

function collectKeywords(text: string): string[] {
  const vocabulary = [...new Set([...rules.flatMap((rule) => rule.terms), ...criticalTerms, ...highTerms, ...lowTerms, "child", "elderly"])];
  return vocabulary.filter((term) => text.includes(term));
}

export function triageTranscript(rawTranscript: string): TriageResult {
  const text = rawTranscript.toLowerCase();
  const match = rules.find((rule) => rule.terms.some((term) => text.includes(term)));
  const keywords = collectKeywords(text);

  let severity: Severity = "MEDIUM";
  if (criticalTerms.some((term) => text.includes(term))) {
    severity = "CRITICAL";
  } else if (highTerms.some((term) => text.includes(term))) {
    severity = "HIGH";
  } else if (lowTerms.some((term) => text.includes(term))) {
    severity = "LOW";
  }

  if (!match) {
    return {
      incidentType: "OTHER",
      severity,
      requiredResourceTypes: ["OTHER"],
      title: "Emergency Report",
      description: rawTranscript,
      keywords
    };
  }

  return {
    incidentType: match.incidentType,
    severity,
    requiredResourceTypes: match.resources,
    title: match.title,
    description: rawTranscript,
    keywords
  };
}
