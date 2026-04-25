export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export function toGeoPoint(latitude?: number | null, longitude?: number | null): GeoPoint | undefined {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [longitude, latitude]
  };
}
