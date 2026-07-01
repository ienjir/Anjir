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
  id: number;
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
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPaceSecondsPerKm?: number;
  avgPaceMovingSecondsPerKm?: number;
  maxPaceSecondsPerKm?: number;
  averageTemperatureCelsius?: number;
}
