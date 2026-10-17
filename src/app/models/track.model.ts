export interface TrackData {
  id?: string;
  hikeId: string;
  bounds: GeoBounds;
  segments: TrackPoint[][];
  paceSplits: PaceSplit[];
}

export interface TrackPoint {
  lat: number;
  lon: number;
  elevationMeters?: number;
  timestamp: Date;
  heartRate?: number;
  cadence?: number;
  temperature?: number;
}

export interface PaceSplit {
  splitNumber: number;
  durationSeconds: number;
  elevationDeltaMeters: number;
  elevationGain: number;
  elevationLoss: number
  distanceMeters: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
