export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type HikeSource = 'gpx' | 'fit' | 'gpx+fit' | 'manual';

export interface Hike {
  id?: string
  name: string
  difficulty?: Difficulty
  date: Date
  description?: string
  region?: string
  rating?: number
  notes?: string
  tags?: string[]
  source: HikeSource
  stats: HikeStats
  gpxFileId?: string
  fitFileId?: string
  trackId?: string
  createdAt: Date
  updatedAt: Date
}


interface HikeStats {
  distanceMeters: number
  durationSeconds: number
  elevationGainMeters: number
  elevationLossMeters: number
  elevationMaxMeters: number
  elevationMinMeters: number
  avgHeartRate?: number
  maxHeartRate?: number
  avgPaceSecondsPerKm?: number
  maxPaceSecondsPerKm?: number
  averageTemperatureCelsius?: number
}
