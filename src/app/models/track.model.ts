export interface TrackData {
  id?: string;
  hikeId: string;
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
