import type { ResourceType } from "./enums";

const EARTH_RADIUS_KM = 6371;

const speeds: Record<ResourceType, number> = {
  AMBULANCE: 55,
  FIRE_TRUCK: 45,
  POLICE: 60,
  RESCUE_TEAM: 40,
  UTILITY_TEAM: 35,
  ANIMAL_RESCUE: 35,
  OTHER: 35
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
): number {
  const dLat = toRadians(endLatitude - startLatitude);
  const dLon = toRadians(endLongitude - startLongitude);
  const lat1 = toRadians(startLatitude);
  const lat2 = toRadians(endLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateArrivalMinutes(distanceKm: number, resourceType: ResourceType): number {
  return Math.ceil((distanceKm / speeds[resourceType]) * 60);
}
