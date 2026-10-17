export enum HikeSource {
  gpx,
  fit,
  gpx_fit,
  manual,
}

export enum Difficulty {
  easy,
  moderate,
  hard,
  expert,
}

export interface Hike {
  id: string;
  name: string;
  difficulty?: Difficulty;
  date: Date;
  description?: string;
  region?: string;
  rating?: number;
  notes?: string;
  tags?: string[];
  source: HikeSource;
  stats: HikeStats;
  bounds: GeoBounds;
  gpxFileId?: string;
  fitFileId?: string;
  trackId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface HikeStats {
  distanceMeters: number;
  durationSeconds: number;
  durationMovingSeconds: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  elevationMaxMeters: number;
  elevationMinMeters: number;
  avgPaceSecondsPerKm: number;
  avgPaceMovingSecondsPerKm: number;
  minPaceSecondsPerKm: number;
  maxPaceSecondsPerKm: number;
  avgHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  minCadence?: number;
  maxCadence?: number;
  averageTemperatureCelsius?: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
