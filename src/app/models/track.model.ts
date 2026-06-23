export interface TrackData {
  id?: number
  hikeId: number
  points: TrackPoint[]
  paceSplits: PaceSplit[]
}

export interface TrackPoint {
  lat: number
  lon: number
  elevationMeters?: number
  timestamp?: Date
  heartRate?: number
  cadence?: number
  temperature?: number
}

export interface PaceSplit {
  splitNumber: number
  durationSeconds: number
  elevationDeltaMeters: number
  distanceMeters: number
}
