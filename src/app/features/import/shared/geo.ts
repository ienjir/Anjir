import { makeError, Result, GpxError } from '@core/error';
import { GeoBounds, TrackPoint } from '@hike/models/track.model';

const EARTH_RADIUS_METERS = 6_371_000;

/** Great-circle distance between two points, in METERS. */
export function haversine_distance(
  pointA: Pick<TrackPoint, 'lat' | 'lon'>,
  pointB: Pick<TrackPoint, 'lat' | 'lon'>,
): number {
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

  return EARTH_RADIUS_METERS * angularDistance;
}

function to_radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function generate_geo_bounds(track_seg: TrackPoint[][]): Result<GeoBounds> {
  const points = track_seg.flat();
  if (points.length === 0) {
    return { success: false, error: makeError(GpxError.EMPTY_SEG) };
  }

  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;

  for (const { lat, lon } of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }

  return { success: true, data: { minLat, maxLat, minLon, maxLon } };
}
