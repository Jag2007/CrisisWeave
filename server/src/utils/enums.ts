export const UPLOAD_BATCH_STATUSES = ["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"] as const;

export const CALL_PROCESSING_STATUSES = [
  "PENDING",
  "EXTRACTED",
  "DUPLICATE",
  "INCIDENT_CREATED",
  "FAILED"
] as const;

export const INCIDENT_TYPES = [
  "FIRE",
  "FLOOD",
  "ACCIDENT",
  "MEDICAL",
  "BUILDING_COLLAPSE",
  "CRIME",
  "THEFT",
  "HOME_INTRUSION",
  "MISSING_PERSON",
  "MISSING_PET",
  "GAS_LEAK",
  "POWER_FAILURE",
  "OTHER"
] as const;

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export const INCIDENT_STATUSES = [
  "NEW",
  "ACTIVE",
  "DISPATCH_PENDING",
  "DISPATCHED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
] as const;

export const RESOURCE_TYPES = [
  "AMBULANCE",
  "FIRE_TRUCK",
  "POLICE",
  "RESCUE_TEAM",
  "UTILITY_TEAM",
  "ANIMAL_RESCUE",
  "OTHER"
] as const;

export const RESOURCE_STATUSES = ["AVAILABLE", "BUSY", "OFFLINE", "MAINTENANCE"] as const;

export const DISPATCH_STATUSES = ["ASSIGNED", "EN_ROUTE", "ARRIVED", "COMPLETED", "CANCELLED"] as const;

export const ALERT_TYPES = [
  "HOSPITAL_ALERT",
  "FIRE_STATION_ALERT",
  "POLICE_ALERT",
  "RESCUE_ALERT",
  "ADMIN_ALERT",
  "UTILITY_ALERT",
  "ANIMAL_RESCUE_ALERT"
] as const;

export const ALERT_STATUSES = ["PENDING", "SENT", "FAILED"] as const;

export const SYSTEM_EVENT_TYPES = [
  "BATCH_UPLOADED",
  "CALL_STORED",
  "TRIAGE_STARTED",
  "TRIAGE_COMPLETED",
  "DEDUP_CHECK_STARTED",
  "DUPLICATE_FOUND",
  "INCIDENT_CREATED",
  "INCIDENT_UPDATED",
  "PRIORITY_ASSIGNED",
  "RESOURCE_SEARCH_STARTED",
  "RESOURCE_ASSIGNED",
  "DISPATCH_CREATED",
  "ALERT_CREATED",
  "PIPELINE_COMPLETED",
  "PIPELINE_FAILED"
] as const;

export const USER_ROLES = ["ADMIN", "STAFF"] as const;

export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;

export type UploadBatchStatus = (typeof UPLOAD_BATCH_STATUSES)[number];
export type CallProcessingStatus = (typeof CALL_PROCESSING_STATUSES)[number];
export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];
export type AlertType = (typeof ALERT_TYPES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type SystemEventType = (typeof SYSTEM_EVENT_TYPES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
