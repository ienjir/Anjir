import { environment } from "@environments/environment";
import { RawGpxPoint } from "@models/gpx.model";
import { TrackPoint } from "@models/track.model";

export function raw_gpx_point_to_track_point(raw_gpx_point: RawGpxPoint): Result<TrackPoint> {
  if (raw_gpx_point === undefined) {
    return {
      success: false,
      error: makeError('GPX_UND_TRKPNT')
    }
  }

  if (raw_gpx_point.time === undefined) {
    return {
      success: false,
      error: makeError('GPX_NO_TMPSTMP')
    }
  }

  return {
    success: true,
    data: {
      lat: raw_gpx_point.lat,
      lon: raw_gpx_point.lon,
      elevationMeters: raw_gpx_point.ele,
      timestamp: new Date(raw_gpx_point.time),
    }
  };
}

export function smoothElevation(points: TrackPoint[]): number[] {
  const smoothed = points.map(p => p.elevationMeters ?? 0);
  for (let i = 1; i < smoothed.length - 1; i++) {
    const avg = (smoothed[i - 1] + smoothed[i] + smoothed[i + 1]) / 3;
    if (Math.abs(smoothed[i] - avg) < environment.elevation_smoothing_tolerance) {
      smoothed[i] = avg;
    }
  }
  return smoothed;
}

export function haversine_distance(pointA: TrackPoint, pointB: TrackPoint): number {
  const radius = 6371;

  const deltaLatitude = to_radians(pointB.lat - pointA.lat);
  const deltaLongitude = to_radians(pointB.lon - pointA.lon);

  const halfChordLength =
    Math.cos(to_radians(pointA.lat)) *
    Math.cos(to_radians(pointB.lat)) *
    Math.sin(deltaLongitude / 2) *
    Math.sin(deltaLongitude / 2) +
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

  return radius * angularDistance;
}

function to_radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
