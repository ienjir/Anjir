import { Difficulty } from "./hike.model"

export interface PlannedHike {
  id: number
  name: string
  description?: string
  notes?: string
  createdAt: Date
  updatedAt: Date

  trackId?: number
  waypoints: Waypoint[]
  stages?: Stage[]

  linkedHikeId?: number
  estimatedStats?: PlannedStats
}

export interface PlannedStats {
  estimatedDistanceMeters?: number
  estimatedDurationSeconds?: number
  estimatedElevationGainMeters?: number
  estimatedElevationLossMeters?: number
  difficulty?: Difficulty
}

export interface Waypoint {
  id: string
  lat: number
  lon: number
  name?: string
  type: 'hut' | 'water' | 'viewpoint' | 'parking' | 'custom'
  notes?: string
}

export interface Stage {
  id: string
  name: string
  order: number
  startWaypointId: string
  endWaypointId: string
  estimatedDurationSeconds?: number
}
