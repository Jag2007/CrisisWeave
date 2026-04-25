export interface EmergencyTranscriptInput {
  transcript?: string;
  rawTranscript?: string;
  text?: string;
  date?: string;
  callDate?: string;
  startTime?: string;
  endTime?: string;
  locationText?: string;
  city?: string;
  state?: string;
  latitude?: number | string;
  longitude?: number | string;
  callerName?: string;
  callerPhone?: string;
  sourceId?: string;
  source?: string;
  [key: string]: unknown;
}

export interface NormalizedTranscriptRecord {
  rawTranscript: string;
  callDate?: Date;
  startTime?: string;
  endTime?: string;
  locationText?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  callerName?: string;
  callerPhone?: string;
  sourceId?: string;
}
